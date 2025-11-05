import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: process.env.JSON_LIMIT || '5mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_LIMIT || '5mb' }));
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;
const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

const usersFile = path.join(__dirname, 'data', 'users.json');
const prefsFile = path.join(__dirname, 'data', 'prefs.json');
const incidentsFile = path.join(__dirname, 'data', 'incidents.json');
const profilesFile = path.join(__dirname, 'data', 'profiles.json');
const savedRoutesFile = path.join(__dirname, 'data', 'routes.json');

function readJSON(p){
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return null; }
}
function writeJSON(p, data){
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

app.get('/api/health', (_, res)=> res.json({ ok: true }));

function requiredUserId(req, res){
  const userId = (req.headers['x-user-id']||'').toString();
  if(!userId){
    res.status(400).json({ error:'user_id_required' });
    return null;
  }
  return userId;
}

app.post('/api/auth/register', (req, res)=>{
  const { name, email, password } = req.body || {};
  if(!name || !email || !password) return res.status(400).json({ error: 'missing_fields' });
  const db = readJSON(usersFile) || { users: [] };
  if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'email_exists' });
  const user = { id: Date.now(), name, email, password };
  db.users.push(user);
  writeJSON(usersFile, db);
  res.json({ ok: true, user: { id: user.id, name, email }, token: 'mock-'+user.id });
});

app.post('/api/auth/login', (req, res)=>{
  const { email, password } = req.body || {};
  const db = readJSON(usersFile) || { users: [] };
  const user = db.users.find(u => u.email === email && u.password === password);
  if(!user) return res.status(401).json({ error: 'invalid_credentials' });
  res.json({ token: 'mock-'+user.id, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/user/preferences', (req, res)=>{
  const userId = requiredUserId(req, res);
  if(!userId) return;
  const db = readJSON(prefsFile) || { prefs: {} };
  res.json(db.prefs[userId] || { theme:'dark', units:'km', avoidTolls:false });
});
app.put('/api/user/preferences', (req, res)=>{
  const userId = requiredUserId(req, res);
  if(!userId) return;
  const db = readJSON(prefsFile) || { prefs: {} };
  db.prefs[userId] = req.body;
  writeJSON(prefsFile, db);
  res.json({ ok: true });
});

const defaultProfile = { name:'', cpf:'', phone:'', email:'', password:'' };

app.get('/api/user/profile', (req, res)=>{
  const userId = requiredUserId(req, res);
  if(!userId) return;
  const db = readJSON(profilesFile) || { profiles: {} };
  res.json({ ...defaultProfile, ...(db.profiles?.[userId] || {}) });
});

app.put('/api/user/profile', (req, res)=>{
  const userId = requiredUserId(req, res);
  if(!userId) return;
  const incoming = req.body || {};
  const profile = {
    name: incoming.name ?? '',
    cpf: incoming.cpf ?? '',
    phone: incoming.phone ?? '',
    email: incoming.email ?? '',
    password: incoming.password ?? '',
  };
  const db = readJSON(profilesFile) || { profiles: {} };
  db.profiles = db.profiles || {};
  db.profiles[userId] = profile;
  writeJSON(profilesFile, db);
  res.json({ ok: true, profile });
});

app.get('/api/routes/saved', (req, res)=>{
  const userId = requiredUserId(req, res);
  if(!userId) return;
  const db = readJSON(savedRoutesFile) || { routes: {} };
  const stored = db.routes?.[userId] || { routes: [], activeIndex: 0, timestamp: null };
  res.json(stored);
});

app.post('/api/routes/saved', (req, res)=>{
  const userId = requiredUserId(req, res);
  if(!userId) return;
  const payload = req.body || {};
  const routes = Array.isArray(payload.routes) ? payload.routes : [];
  const activeIndex = Number.isFinite(payload.activeIndex) ? payload.activeIndex : 0;
  const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString();
  const db = readJSON(savedRoutesFile) || { routes: {} };
  db.routes = db.routes || {};
  db.routes[userId] = { routes, activeIndex, timestamp };
  writeJSON(savedRoutesFile, db);
  res.json({ ok: true });
});

app.get('/api/geocode', async (req, res)=>{
  const q = (req.query.q||'').toString();
  if(!q) return res.status(400).json({ error: 'q_required' });
  try{
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'User-Agent':'iGPS/1.1 (educational)' } });
    const data = await r.json();
    const mapped = data.map(d=>({ label:d.display_name, lat:parseFloat(d.lat), lng:parseFloat(d.lon) }));
    res.json(mapped);
  }catch(e){
    res.status(500).json({ error:'geocode_failed', detail:e?.message });
  }
});

app.post('/api/routes', async (req, res)=>{
  try{
    const { origin, destination, stops = [], profile='driving' } = req.body || {};
    if(!origin || !destination) return res.status(400).json({ error: 'origin_destination_required' });
    const all = [origin, ...stops, destination];
    const coords = all.map(p=>`${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_URL}/route/v1/${profile}/${coords}?alternatives=true&overview=full&geometries=geojson&steps=true&annotations=duration`;
    const r = await fetch(url);
    const data = await r.json();
    if(!data || !data.routes) return res.status(502).json({ error:'bad_osrm_response', data });
    const sorted = [...data.routes].sort((a,b)=>a.duration-b.duration);
    const best = sorted[0]?.duration || 0;
    const routes = data.routes.map((rt, idx)=>({
      idx,
      duration: rt.duration,
      distance: rt.distance,
      geometry: rt.geometry,
      legs: rt.legs,
      delta_sec: Math.round(rt.duration - best)
    }));
    res.json({ routes });
  }catch(e){
    res.status(500).json({ error:'route_failed', detail: e?.message });
  }
});

app.get('/api/pois', (req, res)=>{
  const baseLat = parseFloat(req.query.lat) || -23.55;
  const baseLng = parseFloat(req.query.lng) || -46.63;
  const pois = Array.from({length:6}).map((_,i)=>({
    id: i+1,
    name: `Ponto ${i+1}`,
    lat: baseLat + (Math.random()-0.5)*0.05,
    lng: baseLng + (Math.random()-0.5)*0.05,
    type: i%2===0?'fuel':'charge'
  }));
  res.json({ pois });
});

app.get('/api/incidents', (_, res)=>{
  const db = readJSON(incidentsFile) || { incidents: [] };
  res.json(db);
});
app.post('/api/incidents', (req, res)=>{
  const db = readJSON(incidentsFile) || { incidents: [] };
  const it = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
  db.incidents.push(it);
  writeJSON(incidentsFile, db);
  res.json(it);
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, ()=> console.log(`server on ${HOST}:${PORT}`));

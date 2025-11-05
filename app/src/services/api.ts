import { Capacitor, CapacitorHttp, HttpResponse } from "@capacitor/core";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

const isNative = Capacitor.isNativePlatform();

function headersToObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  return { ...headers };
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = localStorage.getItem("token") || "";
  const userId = localStorage.getItem("userId") || "";

  const initHeaders = headersToObject(init?.headers);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...initHeaders,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  } else if (!token) {
    delete headers.Authorization;
  }

  if (userId && !headers["x-user-id"]) {
    headers["x-user-id"] = userId;
  } else if (!userId) {
    delete headers["x-user-id"];
  }

  const method = init?.method?.toUpperCase() ?? "GET";
  const url = `${API_BASE}${path}`;

  if (isNative) {
    let data = init?.body;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
      }
    }

    try {
      const nativeResponse: HttpResponse = await CapacitorHttp.request({
        url,
        method,
        headers,
        data,
        responseType: "json",
        connectTimeout: 15000,
        readTimeout: 15000,
      });

      if (nativeResponse.status < 200 || nativeResponse.status >= 300) {
        throw new Error(`HTTP ${nativeResponse.status}`);
      }
      return nativeResponse.data;
    } catch (err: any) {
      if (err?.status) {
        throw new Error(`HTTP ${err.status}`);
      }
      throw err;
    }
  }

  const response = await fetch(url, {
    ...init,
    method,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export type LatLng = { lat: number; lng: number };
export type Preferences = {
  theme: "light" | "dark";
  units: "km" | "mi";
  avoidTolls: boolean;
};
export type RouteResult = {
  id?: string;
  distance?: number;
  duration?: number;
  delta_sec?: number;
  summary?: string;
  geometry?: {
    coordinates?: [number, number][];
  };
  [key: string]: any;
};

export type UserProfile = {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
};

export type SavedRoutesResponse = {
  routes: RouteResult[];
  activeIndex: number;
  timestamp: string | null;
};

export async function geocode(q: string) {
  return apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`);
}

export async function fetchRoutes(origin: LatLng, destination: LatLng, stops: LatLng[] = []) {
  return apiFetch(`/api/routes`, { method: 'POST', body: JSON.stringify({ origin, destination, stops }) }) as Promise<{
    routes: RouteResult[];
    [key: string]: any;
  }>;
}

export async function saveRoutes(routes: RouteResult[], activeIndex: number, timestamp: string){
  return apiFetch(`/api/routes/saved`, {
    method: 'POST',
    body: JSON.stringify({ routes, activeIndex, timestamp })
  });
}

export async function fetchSavedRoutes(){
  return apiFetch(`/api/routes/saved`) as Promise<SavedRoutesResponse>;
}

// Auth
export async function login(email: string, password: string){
  const res = await apiFetch(`/api/auth/login`, { method:'POST', body: JSON.stringify({ email, password })});
  localStorage.setItem('token', res.token);
  localStorage.setItem('userId', String(res.user.id));
  localStorage.setItem('userName', res.user.name);
  return res;
}

export async function register(name: string, email: string, password: string){
  const res = await apiFetch(`/api/auth/register`, { method:'POST', body: JSON.stringify({ name, email, password })});
  localStorage.setItem('token', res.token);
  localStorage.setItem('userId', String(res.user.id));
  localStorage.setItem('userName', res.user.name);
  return res;
}

// Preferences
export async function getPreferences(){
  return apiFetch(`/api/user/preferences`);
}
export async function updatePreferences(prefs: Preferences){
  return apiFetch(`/api/user/preferences`, { method: 'PUT', body: JSON.stringify(prefs) });
}

export async function getProfile(){
  return apiFetch(`/api/user/profile`) as Promise<UserProfile>;
}

export async function updateProfile(profile: UserProfile){
  return apiFetch(`/api/user/profile`, { method:'PUT', body: JSON.stringify(profile) });
}

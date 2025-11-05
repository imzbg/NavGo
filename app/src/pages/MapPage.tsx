import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import AddressInput from "../components/AddressInput";
import { fetchRoutes, LatLng, RouteResult, saveRoutes } from "../services/api";
import { STORAGE_ROUTES } from "../services/storageKeys";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

const palette = {
  surface: "#111827",
  elevated: "#1f2937",
  border: "rgba(148, 163, 184, 0.2)",
  primary: "#38bdf8",
  primaryContrast: "#031525",
  text: "#e2e8f0",
  muted: "#94a3b8",
  shadow: "rgba(2, 6, 23, 0.6)",
  success: "#34d399",
};

const SYNC_MAX_COORDS = 500;

function simplifyRoutesForSync(routes: RouteResult[]): RouteResult[] {
  return routes.map((route) => {
    const lean: RouteResult = { ...route };
    if (Array.isArray(lean.geometry?.coordinates)) {
      const coords = lean.geometry.coordinates;
      const step = Math.max(1, Math.ceil(coords.length / SYNC_MAX_COORDS));
      const simplified: [number, number][] = [];
      for (let i = 0; i < coords.length; i += step) {
        const [lng, lat] = coords[i];
        simplified.push([Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
      }
      const last = coords[coords.length - 1];
      if (last) {
        const [lastLng, lastLat] = last;
        const lastRounded: [number, number] = [Number(lastLng.toFixed(5)), Number(lastLat.toFixed(5))];
        const currentLast = simplified[simplified.length - 1];
        if (!currentLast || currentLast[0] !== lastRounded[0] || currentLast[1] !== lastRounded[1]) {
          simplified.push(lastRounded);
        }
      }
      lean.geometry = {
        ...lean.geometry,
        coordinates: simplified,
      };
    }
    if ((lean as any).legs) {
      delete (lean as any).legs;
    }
    return lean;
  });
}

type StoredContext = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  stops?: LatLng[];
  originLabel?: string;
  destLabel?: string;
  stopLabels?: string[];
};

function toLeafletLine(route?: RouteResult): [number, number][] {
  const coords = route?.geometry?.coordinates;
  if (!coords || !Array.isArray(coords)) return [];
  return coords
    .filter((value) => Array.isArray(value) && value.length >= 2)
    .map(([lng, lat]) => [lat, lng]);
}

function FitToRoute({ line }: { line: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (line.length === 0) return;
    const bounds = L.latLngBounds(line.map(([lat, lng]) => [lat, lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [line, map]);
  return null;
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [center.lat, center.lng, map]);
  return null;
}

const defaultCenter: LatLng = { lat: -23.55, lng: -46.63 };

export default function MapPage() {
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [stopsText, setStopsText] = useState<string[]>([]);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [stops, setStops] = useState<(LatLng | null)[]>([]);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [myPos, setMyPos] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const geo = navigator.geolocation;
    const cancel = geo.watchPosition(
      (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("geolocation error", err),
      { enableHighAccuracy: true }
    );
    return () => {
      geo.clearWatch(cancel);
    };
  }, []);

  useEffect(() => {
    try {
      const contextRaw = localStorage.getItem(STORAGE_ROUTES.context);
      if (contextRaw) {
        const context: StoredContext = JSON.parse(contextRaw);
        if (context.origin) setOrigin(context.origin);
        if (context.destination) setDestination(context.destination);
        setOriginText(context.originLabel || "");
        setDestText(context.destLabel || "");
        const coords = context.stops || [];
        const labels = context.stopLabels || [];
        const maxLen = Math.max(coords.length, labels.length);
        if (maxLen > 0) {
          setStops(Array.from({ length: maxLen }, (_, idx) => coords[idx] ?? null));
          setStopsText(Array.from({ length: maxLen }, (_, idx) => labels[idx] ?? ""));
        }
      }
    } catch (err) {
      console.warn("failed to restore context", err);
    }

    try {
      const storedRoutesRaw = localStorage.getItem(STORAGE_ROUTES.routes);
      if (storedRoutesRaw) {
        const parsed: RouteResult[] = JSON.parse(storedRoutesRaw);
        if (Array.isArray(parsed)) {
          setRoutes(parsed);
          const storedIndex = Number.parseInt(localStorage.getItem(STORAGE_ROUTES.activeIndex) || "0", 10);
          const safeIndex = Number.isFinite(storedIndex)
            ? Math.min(Math.max(storedIndex, 0), Math.max(parsed.length - 1, 0))
            : 0;
          setSelectedRouteIndex(safeIndex);
        }
      }
    } catch (err) {
      console.warn("failed to restore routes", err);
    }
  }, []);

  const persistData = useCallback(
    (routesToStore: RouteResult[], activeIndex: number, overrides?: Partial<StoredContext>) => {
      const contextBase: StoredContext = {
        origin,
        destination,
        stops: stops.filter((s): s is LatLng => !!s),
        originLabel: originText,
        destLabel: destText,
        stopLabels: stopsText,
      };
      const contextForStorage: StoredContext = { ...contextBase, ...overrides };
      localStorage.setItem(STORAGE_ROUTES.routes, JSON.stringify(routesToStore));
      localStorage.setItem(STORAGE_ROUTES.activeIndex, String(activeIndex));
      localStorage.setItem(STORAGE_ROUTES.context, JSON.stringify(contextForStorage));
      const timestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_ROUTES.timestamp, timestamp);
      const syncPayload = simplifyRoutesForSync(routesToStore);
      saveRoutes(syncPayload, activeIndex, timestamp).catch((err) => {
        console.error("failed to sync routes", err);
      });
    },
    [destination, origin, originText, destText, stops, stopsText]
  );

  const selectedRoute = routes[selectedRouteIndex];
  const selectedLine = useMemo(() => toLeafletLine(selectedRoute), [selectedRoute]);
  const alternativeLines = useMemo(() => {
    return routes.map((route, idx) => (idx === selectedRouteIndex ? null : toLeafletLine(route)));
  }, [routes, selectedRouteIndex]);

  const activeCenter = useMemo(() => {
    if (origin) return origin;
    if (myPos) return myPos;
    return defaultCenter;
  }, [origin, myPos]);

  function addStopField() {
    setStopsText((prev) => [...prev, ""]);
    setStops((prev) => [...prev, null]);
  }

  const handleSelectRoute = useCallback(
    (index: number) => {
      if (index < 0 || index >= routes.length) return;
      setSelectedRouteIndex(index);
      persistData(routes, index);
    },
    [persistData, routes]
  );

  async function calculate() {
    const currentOrigin = origin || myPos;
    if (!currentOrigin || !destination) {
      alert("Defina origem e destino.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validStops = stops.filter((item): item is LatLng => !!item);
      const response = await fetchRoutes(currentOrigin, destination, validStops);
      const receivedRoutes: RouteResult[] = Array.isArray(response?.routes) ? response.routes : [];
      setRoutes(receivedRoutes);
      const nextIndex = receivedRoutes.length > 0 ? 0 : 0;
      setSelectedRouteIndex(nextIndex);
      persistData(receivedRoutes, nextIndex, {
        origin: currentOrigin,
        destination,
        stops: validStops,
      });
    } catch (err) {
      console.error(err);
      setError("Nao foi possivel calcular a rota. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", position: "relative", background: "#0b1220" }}>
      <MapContainer center={[activeCenter.lat, activeCenter.lng]} zoom={13} style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {myPos && <Recenter center={myPos} />}
        {selectedLine.length > 0 && <FitToRoute line={selectedLine} />}
        {myPos && <Marker position={[myPos.lat, myPos.lng]} />}
        {origin && <Marker position={[origin.lat, origin.lng]} />}
        {destination && <Marker position={[destination.lat, destination.lng]} />}
        {selectedLine.length > 0 && <Polyline positions={selectedLine} color={palette.primary} weight={5} />}
        {alternativeLines.map(
          (line, idx) =>
            line && line.length > 0 && (
              <Polyline key={idx} positions={line} color={palette.muted} weight={3} dashArray="6 8" opacity={0.7} />
            )
        )}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          bottom: 70,
          right: 10,
          left: 10,
          zIndex: 9999,
          maxWidth: 420,
          margin: "0 auto",
          background: palette.elevated,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          boxShadow: `0 12px 24px ${palette.shadow}`,
          transition: "all 0.3s ease",
          overflow: "hidden",
          color: palette.text,
        }}
      >
        <button
          onClick={() => setShowPanel((prev) => !prev)}
          style={{
            width: "100%",
            border: "none",
            background: palette.primary,
            color: palette.primaryContrast,
            padding: 10,
            fontWeight: 600,
          }}
        >
          {showPanel ? "Ocultar painel" : "Mostrar painel"}
        </button>

        {showPanel && (
          <div style={{ padding: 12, maxHeight: "70vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>Planejar rota</h3>
            {error && (
              <div style={{ marginBottom: 10, color: "#f87171", fontSize: 13 }}>
                {error}
              </div>
            )}

            <AddressInput
              label="Origem"
              value={originText}
              onChangeText={setOriginText}
              onSelectLocation={(loc) => {
                setOrigin({ lat: loc.lat, lng: loc.lng });
                setOriginText(loc.label);
              }}
            />

            <div style={{ height: 10 }} />

            <AddressInput
              label="Destino"
              value={destText}
              onChangeText={setDestText}
              onSelectLocation={(loc) => {
                setDestination({ lat: loc.lat, lng: loc.lng });
                setDestText(loc.label);
              }}
            />

            {stopsText.map((text, idx) => (
              <div key={idx} style={{ marginTop: 10 }}>
                <AddressInput
                  label={`Parada ${idx + 1}`}
                  value={text}
                  onChangeText={(value) => {
                    setStopsText((prev) => {
                      const next = [...prev];
                      next[idx] = value;
                      return next;
                    });
                  }}
                  onSelectLocation={(loc) => {
                    setStops((prev) => {
                      const next = [...prev];
                      next[idx] = { lat: loc.lat, lng: loc.lng };
                      return next;
                    });
                    setStopsText((prev) => {
                      const next = [...prev];
                      next[idx] = loc.label;
                      return next;
                    });
                  }}
                />
              </div>
            ))}

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                onClick={addStopField}
                style={{
                  border: `1px solid ${palette.primary}`,
                  background: palette.surface,
                  color: palette.primary,
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                + Parada
              </button>

              <button
                onClick={calculate}
                disabled={loading || !destination}
                style={{
                  background: loading ? "rgba(56, 189, 248, 0.5)" : palette.primary,
                  color: palette.primaryContrast,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  flexGrow: 1,
                  minWidth: 140,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Calculando..." : "Calcular rota"}
              </button>
            </div>

            {routes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>Rotas alternativas</strong>
                <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                  {routes.map((route, idx) => {
                    const durationMin = route.duration ? Math.round(route.duration / 60) : 0;
                    const distanceKm = route.distance ? (route.distance / 1000).toFixed(1) : "0";
                    const deltaMin =
                      route.delta_sec && idx !== 0 ? Math.round(route.delta_sec / 60) : 0;
                    const isActive = idx === selectedRouteIndex;
                    return (
                      <li
                        key={route.id || idx}
                        style={{
                          marginBottom: 8,
                          border: `1px solid ${isActive ? palette.primary : palette.border}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                          background: isActive ? "rgba(56, 189, 248, 0.1)" : palette.surface,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div style={{ color: palette.text }}>
                          <div style={{ fontWeight: 600 }}>
                            Rota {idx + 1}{" "}
                            {idx === 0 ? <span style={{ color: palette.success }}>Mais rapida</span> : null}
                          </div>
                          <div style={{ fontSize: 13, color: palette.muted }}>
                            {durationMin} min - {distanceKm} km{" "}
                            {deltaMin ? `(${deltaMin > 0 ? "+" : ""}${deltaMin} min)` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectRoute(idx)}
                          style={{
                            background: isActive ? palette.primary : "transparent",
                            color: isActive ? palette.primaryContrast : palette.text,
                            border: `1px solid ${isActive ? palette.primary : palette.border}`,
                            borderRadius: 20,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {isActive ? "Selecionada" : "Selecionar"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { RouteResult } from "../services/api";
import { STORAGE_ROUTES } from "../services/storageKeys";

const palette = {
  surface: "#ffffff",
  border: "#d1d5db",
  primary: "#2563eb",
  primaryContrast: "#ffffff",
  text: "#111827",
  muted: "#4b5563",
  shadow: "rgba(15, 23, 42, 0.08)",
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    loadRoutes();
  }, []);

  const lastUpdatedText = useMemo(() => {
    const ts = localStorage.getItem(STORAGE_ROUTES.timestamp);
    if (!ts) return "";
    try {
      const date = new Date(ts);
      return date.toLocaleString();
    } catch {
      return "";
    }
  }, [routes]);

  function loadRoutes() {
    try {
      const stored = localStorage.getItem(STORAGE_ROUTES.routes);
      if (!stored) {
        setRoutes([]);
        return;
      }
      const parsed: RouteResult[] = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setRoutes([]);
        return;
      }
      setRoutes(parsed);
      const storedIndex = Number.parseInt(localStorage.getItem(STORAGE_ROUTES.activeIndex) || "0", 10);
      const safeIndex = Number.isFinite(storedIndex)
        ? Math.min(Math.max(storedIndex, 0), parsed.length - 1)
        : 0;
      setActiveIndex(safeIndex);
    } catch (err) {
      console.warn("failed to parse stored routes", err);
      setRoutes([]);
    }
  }

  function selectRoute(index: number) {
    if (index < 0 || index >= routes.length) return;
    setActiveIndex(index);
    localStorage.setItem(STORAGE_ROUTES.activeIndex, String(index));
    localStorage.setItem(STORAGE_ROUTES.routes, JSON.stringify(routes));
    setFeedback(`Rota ${index + 1} selecionada. Abra o mapa para visualizar.`);
    setTimeout(() => setFeedback(""), 2500);
  }

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: "0 auto", color: palette.text }}>
      <h2 style={{ marginBottom: 8 }}>Rotas salvas</h2>
      {feedback && (
        <div style={{ marginBottom: 12, background: "#dcfce7", color: "#166534", padding: "8px 12px", borderRadius: 8 }}>
          {feedback}
        </div>
      )}
      {lastUpdatedText && (
        <div style={{ fontSize: 12, color: palette.muted, marginBottom: 12 }}>
          Ultima atualizacao: {lastUpdatedText}
        </div>
      )}
      {routes.length === 0 ? (
        <div style={{ color: palette.muted, fontSize: 14 }}>
          Nenhuma rota calculada ainda. Gere uma rota pelo mapa e volte aqui para escolher entre as alternativas.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {routes.map((route, index) => {
            const durationMin = route.duration ? Math.round(route.duration / 60) : 0;
            const distanceKm = route.distance ? (route.distance / 1000).toFixed(1) : "0";
            const deltaMin = route.delta_sec && index !== 0 ? Math.round(route.delta_sec / 60) : 0;
            const isActive = index === activeIndex;
            return (
              <div
                key={route.id || index}
                style={{
                  border: `1px solid ${isActive ? palette.primary : palette.border}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  background: isActive ? "rgba(37, 99, 235, 0.12)" : palette.surface,
                  boxShadow: `0 2px 8px ${palette.shadow}`,
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Rota {index + 1} {index === 0 ? "- Principal" : ""}
                  </div>
                  <div style={{ fontSize: 13, color: palette.muted }}>
                    {durationMin} min - {distanceKm} km{" "}
                    {deltaMin ? `(${deltaMin > 0 ? "+" : ""}${deltaMin} min)` : ""}
                  </div>
                  {route.summary && (
                    <div style={{ fontSize: 12, color: palette.muted, marginTop: 4 }}>
                      {route.summary}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => selectRoute(index)}
                  style={{
                    background: isActive ? palette.primary : "transparent",
                    color: isActive ? palette.primaryContrast : palette.text,
                    border: `1px solid ${isActive ? palette.primary : palette.border}`,
                    borderRadius: 20,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 13,
                    minWidth: 140,
                  }}
                >
                  {isActive ? "Selecionada" : "Selecionar rota"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

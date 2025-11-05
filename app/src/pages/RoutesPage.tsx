import React, { useEffect, useMemo, useState } from "react";
import { fetchSavedRoutes, RouteResult, saveRoutes } from "../services/api";
import { STORAGE_ROUTES } from "../services/storageKeys";

const palette = {
  surface: "#111827",
  elevated: "#1f2937",
  border: "rgba(148, 163, 184, 0.2)",
  primary: "#38bdf8",
  primaryContrast: "#031525",
  text: "#e2e8f0",
  muted: "#94a3b8",
  shadow: "rgba(2, 6, 23, 0.6)",
  successBg: "rgba(34, 197, 94, 0.18)",
  successText: "#bbf7d0",
  errorBg: "rgba(248, 113, 113, 0.16)",
  errorText: "#fecaca",
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const lastUpdatedText = useMemo(() => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "";
    }
  }, [timestamp]);

  async function loadRoutes() {
    setLoading(true);
    setError("");
    try {
      const response = await fetchSavedRoutes();
      const serverRoutes = Array.isArray(response?.routes) ? response.routes : [];
      setRoutes(serverRoutes);
      const safeIndex = Number.isFinite(response?.activeIndex)
        ? Math.min(Math.max(response.activeIndex, 0), Math.max(serverRoutes.length - 1, 0))
        : 0;
      setActiveIndex(safeIndex);
      setTimestamp(response?.timestamp ?? null);
      localStorage.setItem(STORAGE_ROUTES.routes, JSON.stringify(serverRoutes));
      localStorage.setItem(STORAGE_ROUTES.activeIndex, String(safeIndex));
      if (response?.timestamp) {
      localStorage.setItem(STORAGE_ROUTES.timestamp, response.timestamp);
      }
    } catch (err) {
      console.error("failed to load saved routes", err);
      let fallbackLoaded = false;
      try {
        const stored = localStorage.getItem(STORAGE_ROUTES.routes);
        if (stored) {
          const parsed: RouteResult[] = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRoutes(parsed);
            const storedIndex = Number.parseInt(localStorage.getItem(STORAGE_ROUTES.activeIndex) || "0", 10);
            const safeIndex = Number.isFinite(storedIndex)
              ? Math.min(Math.max(storedIndex, 0), Math.max(parsed.length - 1, 0))
              : 0;
            setActiveIndex(safeIndex);
            const storedTimestamp = localStorage.getItem(STORAGE_ROUTES.timestamp);
            setTimestamp(storedTimestamp ?? null);
            fallbackLoaded = true;
          }
        }
      } catch (fallbackErr) {
        console.warn("failed to parse cached routes", fallbackErr);
      }
      if (!fallbackLoaded) {
        setError("Nao foi possivel carregar as rotas salvas.");
      } else {
        setError("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function selectRoute(index: number) {
    if (index < 0 || index >= routes.length) return;
    setActiveIndex(index);
    localStorage.setItem(STORAGE_ROUTES.activeIndex, String(index));
    localStorage.setItem(STORAGE_ROUTES.routes, JSON.stringify(routes));
    setFeedback(`Rota ${index + 1} selecionada. Abra o mapa para visualizar.`);
    setTimeout(() => setFeedback(""), 2500);
    try {
      const now = new Date().toISOString();
      await saveRoutes(routes, index, now);
      setTimestamp(now);
      localStorage.setItem(STORAGE_ROUTES.timestamp, now);
    } catch (err) {
      console.error("failed to persist selected route", err);
      setError("Nao foi possivel sincronizar a rota selecionada.");
    }
  }

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 640,
        margin: "0 auto",
        color: palette.text,
        background: "#0b1220",
        minHeight: "calc(100vh - 56px)",
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: 96,
      }}
    >
      <h2 style={{ marginBottom: 8, color: palette.text }}>Rotas salvas</h2>
      {error && (
        <div
          style={{
            marginBottom: 12,
            background: palette.errorBg,
            color: palette.errorText,
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid rgba(248, 113, 113, 0.35)`,
          }}
        >
          {error}
        </div>
      )}
      {feedback && (
        <div
          style={{
            marginBottom: 12,
            background: palette.successBg,
            color: palette.successText,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(34, 197, 94, 0.35)",
          }}
        >
          {feedback}
        </div>
      )}
      {lastUpdatedText && (
        <div style={{ fontSize: 12, color: palette.muted, marginBottom: 12 }}>
          Ultima atualizacao: {lastUpdatedText}
        </div>
      )}
      {loading ? (
        <div style={{ color: palette.muted, fontSize: 14 }}>Carregando rotas salvas...</div>
      ) : routes.length === 0 ? (
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
                  background: isActive ? "rgba(56, 189, 248, 0.1)" : palette.elevated,
                  boxShadow: `0 4px 12px ${palette.shadow}`,
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
                    cursor: "pointer",
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

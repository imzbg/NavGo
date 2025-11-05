import React, { useEffect, useState } from "react";
import { getPreferences, updatePreferences, Preferences } from "../services/api";

const defaultPrefs: Preferences = {
  theme: "dark",
  units: "km",
  avoidTolls: false,
};

const palette = {
  border: "rgba(148, 163, 184, 0.2)",
  primary: "#38bdf8",
  primaryContrast: "#031525",
  text: "#e2e8f0",
  muted: "#94a3b8",
  successBg: "rgba(34, 197, 94, 0.18)",
  successText: "#bbf7d0",
  errorBg: "rgba(248, 113, 113, 0.16)",
  errorText: "#fecaca",
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await getPreferences();
        if (response && typeof response === "object") {
          setPrefs((prev) => ({ ...prev, ...response }));
        }
      } catch (err) {
        console.warn("failed to load preferences", err);
        setError("Nao foi possivel carregar as preferencias.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updatePreferences({ ...prefs, theme: "dark" });
      setMessage("Preferencias salvas com sucesso.");
    } catch (err) {
      console.error("failed to save preferences", err);
      setError("Nao foi possivel salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 480,
        margin: "0 auto",
        color: palette.text,
        background: "#0b1220",
        minHeight: "calc(100vh - 56px)",
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: 96,
      }}
    >
      <h2 style={{ marginBottom: 16, color: palette.text }}>Configuracoes</h2>

      {loading ? (
        <div style={{ color: palette.muted }}>Carregando preferencias...</div>
      ) : (
        <>
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
          {message && (
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
              {message}
            </div>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
              <span>Unidades</span>
              <select
                value={prefs.units}
                onChange={(event) => setPrefs((prev) => ({ ...prev, units: event.target.value as Preferences["units"] }))}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${palette.border}`,
                  background: "#111827",
                  color: palette.text,
                }}
              >
                <option value="km">Quilometros</option>
                <option value="mi">Milhas</option>
              </select>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={prefs.avoidTolls}
                onChange={(event) => setPrefs((prev) => ({ ...prev, avoidTolls: event.target.checked }))}
              />
              Evitar pedagios (experimental)
            </label>
          </div>

          <button
            onClick={save}
            disabled={saving}
            style={{
              marginTop: 20,
              background: saving ? "rgba(56, 189, 248, 0.5)" : palette.primary,
              color: palette.primaryContrast,
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              width: "100%",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Salvando..." : "Salvar preferencias"}
          </button>
        </>
      )}
    </div>
  );
}

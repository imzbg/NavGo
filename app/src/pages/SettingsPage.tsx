import React, { useEffect, useState } from "react";
import { getPreferences, updatePreferences, Preferences } from "../services/api";

const defaultPrefs: Preferences = {
  theme: "light",
  units: "km",
  avoidTolls: false,
};

const palette = {
  border: "#d1d5db",
  primary: "#2563eb",
  primaryContrast: "#ffffff",
  muted: "#4b5563",
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
      await updatePreferences({ ...prefs, theme: "light" });
      setMessage("Preferencias salvas com sucesso.");
    } catch (err) {
      console.error("failed to save preferences", err);
      setError("Nao foi possivel salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", color: "#111827" }}>
      <h2 style={{ marginBottom: 16 }}>Configuracoes</h2>

      {loading ? (
        <div style={{ color: palette.muted }}>Carregando preferencias...</div>
      ) : (
        <>
          {error && (
            <div style={{ marginBottom: 12, background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 8 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ marginBottom: 12, background: "#dcfce7", color: "#166534", padding: "8px 12px", borderRadius: 8 }}>
              {message}
            </div>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
              <span>Unidades</span>
              <select
                value={prefs.units}
                onChange={(event) => setPrefs((prev) => ({ ...prev, units: event.target.value as Preferences["units"] }))}
                style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${palette.border}` }}
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
              background: saving ? "rgba(37,99,235,0.7)" : palette.primary,
              color: palette.primaryContrast,
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              width: "100%",
              fontWeight: 600,
            }}
          >
            {saving ? "Salvando..." : "Salvar preferencias"}
          </button>
        </>
      )}
    </div>
  );
}

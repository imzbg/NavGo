import React, { useEffect, useState } from "react";
import { geocode } from "../services/api";

const palette = {
  border: "rgba(148, 163, 184, 0.25)",
  surface: "#1f2937",
  muted: "#94a3b8",
  shadow: "rgba(2, 6, 23, 0.6)",
  text: "#e2e8f0",
  highlight: "rgba(56, 189, 248, 0.08)",
};

type LocationSuggestion = {
  label: string;
  lat: number;
  lng: number;
};

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (loc: LocationSuggestion) => void;
};

export default function AddressInput({ label, value, onChangeText, onSelectLocation }: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!value || value.length < 3) {
        setOpen(false);
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await geocode(value);
        const next = Array.isArray(res) ? res : [];
        setSuggestions(next);
        setOpen(next.length > 0);
      } catch (err) {
        console.warn("geocode fail", err);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={(event) => onChangeText(event.target.value)}
        placeholder="Digite um endereco..."
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: `1px solid ${palette.border}`,
          background: palette.surface,
          color: palette.text,
        }}
      />
      {isLoading && (
        <div style={{ fontSize: 11, color: palette.muted, marginTop: 4 }}>Buscando sugestoes...</div>
      )}
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 0,
            right: 0,
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 8,
            zIndex: 10,
            maxHeight: 220,
            overflow: "auto",
            boxShadow: `0 12px 24px ${palette.shadow}`,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.label}-${index}`}
              type="button"
              onClick={() => {
                onSelectLocation(suggestion);
                setOpen(false);
                setSuggestions([]);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                padding: "10px 12px",
                cursor: "pointer",
                color: palette.text,
                transition: "background 0.15s ease",
                borderRadius: 6,
              }}
              onMouseEnter={(event) => (event.currentTarget.style.background = palette.highlight)}
              onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
              onFocus={(event) => (event.currentTarget.style.background = palette.highlight)}
              onBlur={(event) => (event.currentTarget.style.background = "transparent")}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

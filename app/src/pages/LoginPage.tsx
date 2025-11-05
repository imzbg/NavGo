import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/api";
import logoImage from "../assets/logo.png";

type Mode = "login" | "register";

const palette = {
  border: "rgba(148, 163, 184, 0.2)",
  primary: "#38bdf8",
  primaryContrast: "#031525",
  text: "#e2e8f0",
  surface: "#131b2f",
  elevated: "#1f2937",
  shadow: "rgba(2, 6, 23, 0.6)",
  muted: "#94a3b8",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      window.dispatchEvent(new Event("authchange"));
      navigate("/map", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Falha ao autenticar. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        background: "#0b1220",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          padding: 24,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          boxShadow: `0 18px 28px ${palette.shadow}`,
          background: palette.elevated,
          color: palette.text,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src={logoImage} alt="Logo NavGo" style={{ width: 96, height: "auto" }} />
          <h2 style={{ margin: 0, color: palette.text }}>NavGo - {mode === "login" ? "Entrar" : "Criar conta"}</h2>
        </div>
        {error && (
          <div style={{ marginBottom: 12, color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          {mode === "register" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>Nome</span>
              <input
                value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Seu nome"
              style={{
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${palette.border}`,
                background: palette.surface,
                color: palette.text,
              }}
            />
          </label>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="voce@exemplo.com"
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: palette.surface,
              color: palette.text,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="********"
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: palette.surface,
              color: palette.text,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            border: "none",
            borderRadius: 8,
            background: loading ? "rgba(56,189,248,0.6)" : palette.primary,
            color: palette.primaryContrast,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Enviando..." : mode === "login" ? "Entrar" : "Registrar"}
        </button>
      </form>
        <div style={{ marginTop: 14, textAlign: "center" }}>
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              style={{
                color: palette.primary,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Nao tem conta? Registrar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              style={{
                color: palette.primary,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Ja tem conta? Entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

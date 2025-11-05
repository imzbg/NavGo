import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/api";
import logoImage from "../assets/logo.png";

type Mode = "login" | "register";

const palette = {
  border: "#d1d5db",
  primary: "#2563eb",
  primaryContrast: "#ffffff",
  text: "#111827",
  surface: "#ffffff",
  shadow: "rgba(15, 23, 42, 0.08)",
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
        maxWidth: 380,
        margin: "60px auto",
        padding: 20,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        boxShadow: `0 12px 24px ${palette.shadow}`,
        background: palette.surface,
        color: palette.text,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <img src={logoImage} alt="Logo NavGo" style={{ width: 96, height: "auto" }} />
        <h2 style={{ margin: 0 }}>NavGo - {mode === "login" ? "Entrar" : "Criar conta"}</h2>
      </div>
      {error && (
        <div style={{ marginBottom: 12, color: "#ef4444", fontSize: 13 }}>
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
              style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}` }}
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
            style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}` }}
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
            style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}` }}
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
            background: loading ? "rgba(37,99,235,0.7)" : palette.primary,
            color: palette.primaryContrast,
            fontWeight: 600,
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
            style={{ color: palette.primary, border: "none", background: "transparent", cursor: "pointer" }}
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
            style={{ color: palette.primary, border: "none", background: "transparent", cursor: "pointer" }}
          >
            Ja tem conta? Entrar
          </button>
        )}
      </div>
    </div>
  );
}

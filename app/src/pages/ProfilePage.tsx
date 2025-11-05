import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, UserProfile } from "../services/api";

const defaultProfile: UserProfile = { name: "", cpf: "", phone: "", email: "", password: "" };

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const response = await getProfile();
        if (response && typeof response === "object") {
          setProfile({ ...defaultProfile, ...response });
        }
      } catch (err) {
        console.warn("failed to load profile", err);
        setError("Nao foi possivel carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function updateField<T extends keyof UserProfile>(field: T, value: UserProfile[T]) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function logout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
    } catch (err) {
      console.warn("failed to clear auth data", err);
    }
    localStorage.removeItem("userProfile");
    window.dispatchEvent(new Event("authchange"));
    navigate("/login", { replace: true });
  }

  async function save() {
    setMessage("");
    setError("");
    try {
      await updateProfile(profile);
      setMessage("Perfil salvo com sucesso.");
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      console.error("failed to save profile", err);
      setError("Nao foi possivel salvar o perfil.");
    }
  }

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 420,
        margin: "0 auto",
        color: palette.text,
        background: "#0b1220",
        minHeight: "calc(100vh - 56px)",
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: 96,
      }}
    >
      <h2 style={{ marginBottom: 16, color: palette.text }}>Perfil</h2>
      {loading ? (
        <div style={{ color: palette.muted, marginBottom: 12 }}>Carregando perfil...</div>
      ) : null}
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

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Nome</span>
          <input
            value={profile.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Seu nome"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "#111827",
              color: palette.text,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>CPF</span>
          <input
            value={profile.cpf}
            onChange={(event) => updateField("cpf", event.target.value)}
            placeholder="000.000.000-00"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "#111827",
              color: palette.text,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Telefone</span>
          <input
            value={profile.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(00) 90000-0000"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "#111827",
              color: palette.text,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Email</span>
          <input
            value={profile.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="email@exemplo.com"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "#111827",
              color: palette.text,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Senha</span>
          <input
            type="password"
            value={profile.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="********"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "#111827",
              color: palette.text,
            }}
          />
        </label>
      </div>

      <button
        onClick={save}
        style={{
          marginTop: 20,
          background: palette.primary,
          color: palette.primaryContrast,
          border: "none",
          borderRadius: 10,
          padding: "12px 18px",
          width: "100%",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Salvar perfil
      </button>

      <button
        onClick={logout}
        style={{
          marginTop: 12,
          background: "#ef4444",
          color: "#fee2e2",
          border: "none",
          borderRadius: 10,
          padding: "12px 18px",
          width: "100%",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Sair da conta
      </button>
    </div>
  );
}

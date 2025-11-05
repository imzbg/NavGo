import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Profile = {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
};

const defaultProfile: Profile = {
  name: "",
  cpf: "",
  phone: "",
  email: "",
  password: "",
};

const palette = {
  border: "#d1d5db",
  primary: "#2563eb",
  primaryContrast: "#ffffff",
  text: "#111827",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...defaultProfile, ...parsed });
      }
    } catch (err) {
      console.warn("failed to load profile", err);
    }
  }, []);

  function updateField<T extends keyof Profile>(field: T, value: Profile[T]) {
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
    window.dispatchEvent(new Event("authchange"));
    navigate("/login", { replace: true });
  }

  function save() {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setMessage("Perfil salvo com sucesso.");
    setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: "0 auto", color: palette.text }}>
      <h2 style={{ marginBottom: 16 }}>Perfil</h2>
      {message && (
        <div style={{ marginBottom: 12, background: "#dcfce7", color: "#166534", padding: "8px 12px", borderRadius: 8 }}>
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
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${palette.border}` }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>CPF</span>
          <input
            value={profile.cpf}
            onChange={(event) => updateField("cpf", event.target.value)}
            placeholder="000.000.000-00"
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${palette.border}` }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Telefone</span>
          <input
            value={profile.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(00) 90000-0000"
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${palette.border}` }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Email</span>
          <input
            value={profile.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="email@exemplo.com"
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${palette.border}` }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Senha</span>
          <input
            type="password"
            value={profile.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="********"
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${palette.border}` }}
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
        }}
      >
        Salvar perfil
      </button>

      <button
        onClick={logout}
        style={{
          marginTop: 12,
          background: "#ef4444",
          color: "#ffffff",
          border: "none",
          borderRadius: 10,
          padding: "12px 18px",
          width: "100%",
          fontWeight: 600,
        }}
      >
        Sair da conta
      </button>
    </div>
  );
}

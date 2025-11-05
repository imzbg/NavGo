import React from "react";
import { NavLink } from "react-router-dom";
import { IonIcon } from "@ionic/react";
import { mapOutline, navigateOutline, personCircleOutline, settingsOutline } from "ionicons/icons";

type Tab = {
  to: string;
  label: string;
  icon: string;
};

const tabs: Tab[] = [
  { to: "/map", label: "Mapa", icon: mapOutline },
  { to: "/routes", label: "Rotas", icon: navigateOutline },
  { to: "/profile", label: "Perfil", icon: personCircleOutline },
  { to: "/settings", label: "Configurações", icon: settingsOutline },
];

const baseItemStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 600,
  height: "100%",
};

export default function BottomNav() {
  return (
    <nav
      style={{
        display: "flex",
        borderTop: "1px solid #e5e7eb",
        background: "#ffffff",
        height: 56,
        paddingBottom: "env(safe-area-inset-bottom)",
        position: "sticky",
        bottom: 0,
        zIndex: 1000,
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          aria-label={tab.label}
          style={({ isActive }) => ({
            ...baseItemStyle,
            color: isActive ? "#2563eb" : "#4b5563",
            background: isActive ? "rgba(37, 99, 235, 0.12)" : "transparent",
            borderBottom: isActive ? "3px solid #2563eb" : "3px solid transparent",
            transition: "background 0.2s ease, color 0.2s ease, border-bottom 0.2s ease",
          })}
        >
          <IonIcon icon={tab.icon} style={{ fontSize: 22, color: "inherit" }} />
        </NavLink>
      ))}
    </nav>
  );
}

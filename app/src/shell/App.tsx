import React, { useEffect, useMemo, useState } from "react";
import { IonApp } from "@ionic/react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import MapPage from "../pages/MapPage";
import SettingsPage from "../pages/SettingsPage";
import RoutesPage from "../pages/RoutesPage";
import BottomNav from "../components/BottomNav";
import ProfilePage from "../pages/ProfilePage";


export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncAuth = () => {
      try {
        setToken(localStorage.getItem("token"));
      } catch {
        setToken(null);
      }
    };
    const syncFromEvent = () => syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("authchange", syncFromEvent);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authchange", syncFromEvent);
    };
  }, []);

  const isAuthed = useMemo(() => !!token, [token]);

  return (
    <IonApp>
      <BrowserRouter>
        <AppShell isAuthed={isAuthed} />
      </BrowserRouter>
    </IonApp>
  );
}

function AppShell({ isAuthed }: { isAuthed: boolean }) {
  const location = useLocation();
  const showBottomNav = isAuthed && !location.pathname.startsWith("/login");
  const background = "#0b1220";

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "1fr auto",
        background,
        color: "#e2e8f0",
      }}
    >
      <div style={{ position: "relative", minHeight: 0, background }}>
        <Routes>
          <Route path="/login" element={isAuthed ? <Navigate to="/map" replace /> : <LoginPage />} />
          <Route path="/" element={<Navigate to={isAuthed ? "/map" : "/login"} replace />} />
          <Route path="/map" element={isAuthed ? <MapPage /> : <Navigate to="/login" replace />} />
          <Route path="/routes" element={isAuthed ? <RoutesPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isAuthed ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={isAuthed ? <SettingsPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={isAuthed ? "/map" : "/login"} replace />} />
        </Routes>
      </div>

      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}

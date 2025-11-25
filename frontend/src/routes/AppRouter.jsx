import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmpresasPage from "../components/EmpresasSection";
import Dashboard from "../pages/Dashboard";
import UsuariosPage from "../pages/UsuariosPage";
import FichajesSection from "../components/FichajesSection";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AppRouter() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fichajes" element={<FichajesSection />} />

        {/* SOLO admins global y admins normales */}
        <Route
          path="/usuarios"
          element={
            user?.role === "admin" || user?.role === "global_admin" ? (
              <UsuariosPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* SOLO admin global */}
        <Route
          path="/empresas"
          element={
            user?.role === "global_admin" ? (
              <EmpresasPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

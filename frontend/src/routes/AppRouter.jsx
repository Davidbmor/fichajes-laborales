import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmpresasPage from "../components/EmpresasSection";
import UsuariosPage from "../pages/UsuariosPage";
import FichajesSection from "../components/FichajesSection";
import Login from "../pages/Login";
import DashboardAdmin from "../pages/DashboardAdmin";
import DashboardGlobalAdmin from "../pages/DashboardGlobalAdmin";
import DashBoardTrabajador from "../pages/DashBoardTrabajador";
import AdminHome from "../pages/AdminHome";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AppRouter() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Raíz redirige según rol */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : user.role === "trabajador" ? (
              <Navigate to="/trabajador" />
            ) : user.role === "admin" ? (
              <Navigate to="/admin-home" />
            ) : user.role === "global_admin" ? (
              <Navigate to="/global-admin" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Página intermedia para admins de empresa */}
        <Route
          path="/admin-home"
          element={
            user?.role === "admin" ? (
              <AdminHome />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Panel Admin (empresa) */}
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <DashboardAdmin />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Panel Admin Global */}
        <Route
          path="/global-admin"
          element={
            user?.role === "global_admin" ? (
              <DashboardGlobalAdmin />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Panel Trabajador / Fichar */}
        <Route
          path="/trabajador"
          element={
            user ? (
              <DashBoardTrabajador />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Fichajes (para admins) */}
        <Route
          path="/fichajes"
          element={
            user?.role === "admin" || user?.role === "global_admin" ? (
              <FichajesSection />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Usuarios (para admins) */}
        <Route
          path="/usuarios"
          element={
            user?.role === "admin" || user?.role === "global_admin" ? (
              <UsuariosPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Empresas (solo admin global) */}
        <Route
          path="/empresas"
          element={
            user?.role === "global_admin" ? (
              <EmpresasPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

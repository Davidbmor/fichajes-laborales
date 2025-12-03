import { Routes, Route, Navigate } from "react-router-dom";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardTrabajador from "./pages/DashBoardTrabajador";
import DashboardGlobalAdmin from "./pages/DashboardGlobalAdmin";
import AdminHome from "./pages/AdminHome";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import EmpresaDetail from "./pages/EmpresaDetail";
import UserSection from "./components/UserSection";
import FichajesSection from "./components/FichajesSection";
import EmpresasSection from "./components/EmpresasSection";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
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
          <ProtectedRoute roles={["admin"]}>
            <AdminHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/empresas/:id"
        element={
          <ProtectedRoute roles={["global_admin"]}>
            <EmpresaDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/global-admin"
        element={
          <ProtectedRoute roles={["global_admin"]}>
            <DashboardGlobalAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trabajador"
        element={
          <ProtectedRoute roles={["trabajador", "admin", "global_admin"]}>
            <DashboardTrabajador />
          </ProtectedRoute>
        }
      />

      {/* Fichajes (para admins) - Renderiza el dashboard completo */}
      <Route
        path="/fichajes"
        element={
          <ProtectedRoute roles={["admin", "global_admin"]}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      {/* Fichajes filtrados por usuario - Renderiza el dashboard completo */}
      <Route
        path="/fichajes/:userId"
        element={
          <ProtectedRoute roles={["admin", "global_admin"]}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      {/* Usuarios (para admins) */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute roles={["admin", "global_admin"]}>
            <UserSection />
          </ProtectedRoute>
        }
      />

      {/* Empresas (solo admin global) */}
      <Route
        path="/empresas"
        element={
          <ProtectedRoute roles={["global_admin"]}>
            <EmpresasSection />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Login />} />
    </Routes>
  );
}

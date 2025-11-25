import { Routes, Route } from "react-router-dom";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardTrabajador from "./pages/DashBoardTrabajador";
import DashboardGlobalAdmin from "./pages/DashboardGlobalAdmin";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

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
          <ProtectedRoute roles={["trabajador"]}>
            <DashboardTrabajador />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Login />} />
    </Routes>
  );
}

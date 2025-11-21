import { Routes, Route } from "react-router-dom";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardTrabajador from "./pages/DashBoardTrabajador";
import Login from "./pages/Login";
import React from "react";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute rol="admin">
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trabajador"
        element={
          <ProtectedRoute rol="trabajador">
            <DashboardTrabajador />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;

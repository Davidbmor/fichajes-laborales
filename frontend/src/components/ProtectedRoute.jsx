// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


export default function ProtectedRoute({ children, rol }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (rol && user.role !== rol) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/trabajador"} />;
  }

  return children;
}

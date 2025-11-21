// src/components/Header.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">Sistema de Fichajes</h1>
      {user && (
        <div className="flex items-center gap-4">
          <span className="font-medium">{user.nombre}</span>
          <button
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}

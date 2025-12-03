import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminHome() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handlePanel = () => {
    navigate("/admin");
  };

  const handleFichar = () => {
    navigate("/trabajador");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-900 p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Bienvenido
        </h1>
        <p className="text-center text-gray-600 mb-8 text-lg">
          {user?.nombre}
        </p>

        {user?.empresa && (
          <p className="text-center text-gray-500 mb-8 text-sm">
            Empresa: {typeof user.empresa === "object" ? user.empresa.nombre : user.empresa}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {/* Botón Panel de Administración */}
          <button
            onClick={handlePanel}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-3"
          >
            <i className="fas fa-cog"></i>
            Panel de Administración
          </button>

          {/* Botón Fichar */}
          <button
            onClick={handleFichar}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-md flex items-center justify-center gap-3"
          >
            <i className="fas fa-clock"></i>
            Fichar
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={logout}
            className="w-full bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-gray-500 transition shadow-md flex items-center justify-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            Cerrar Sesión
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-8">
          Rol: {user?.role === "global_admin" ? "Administrador Global" : "Administrador de Empresa"}
        </p>
      </div>
    </div>
  );
}

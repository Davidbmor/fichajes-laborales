import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import UsersSection from "../components/UserSection";
import FichajesSection from "../components/FichajesSection";

export default function DashboardAdmin() {
  const { logout, user } = useContext(AuthContext);
  const [section, setSection] = useState("usuarios"); // default

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ==== SIDEBAR ==== */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-6 gap-6">

        <h2 className="text-2xl font-bold">Panel Admin</h2>
        <p className="text-sm opacity-70">Bienvenido {user?.nombre}</p>

        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => setSection("usuarios")}
            className={`p-3 rounded text-left ${
              section === "usuarios"
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >
            Usuarios
          </button>

          <button
            onClick={() => setSection("fichajes")}
            className={`p-3 rounded text-left ${
              section === "fichajes"
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >
            Fichajes
          </button>
        </nav>

        <button
          onClick={logout}
          className="mt-auto bg-red-600 py-2 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="flex-1 p-8">
        {section === "usuarios" && <UsersSection />}
        {section === "fichajes" && <FichajesSection />}
      </main>
    </div>
  );
}

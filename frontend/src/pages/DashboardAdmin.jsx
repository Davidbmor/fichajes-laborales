import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import UsersSection from "../components/UserSection";
import FichajesSection from "../components/FichajesSection";
import { useNavigate, useParams } from "react-router-dom";

export default function DashboardAdmin() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { userId } = useParams();
  const [section, setSection] = useState(userId ? "fichajes" : "usuarios");

  // Si viene userId en la ruta, establece la sección a fichajes
  useEffect(() => {
    if (userId) {
      setSection("fichajes");
    }
    // eslint-disable-next-line
  }, [userId]);

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

          <button
            onClick={() => navigate("/trabajador")}
            className="p-3 rounded text-left hover:bg-green-700 bg-green-600 flex items-center gap-2"
          >
            <i className="fas fa-clock"></i>
            Fichar
          </button>
        </nav>

        <button
          onClick={() => navigate("/admin-home")}
          className="bg-blue-600 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <i className="fas fa-home"></i>
          Inicio
        </button>

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

import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import UsersSection from "../components/UserSection";
import FichajesSection from "../components/FichajesSection";
import EmpresasSection from "../components/EmpresasSection";

export default function DashboardGlobalAdmin() {
  const { logout, user } = useContext(AuthContext);
  const [section, setSection] = useState("empresas");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* ==== SIDEBAR DESKTOP ==== */}
      <aside className={`hidden md:flex ${
        sidebarOpen ? "w-64" : "w-20"
      } bg-gray-900 text-white flex-col p-6 gap-6 fixed left-0 top-0 h-screen overflow-y-auto transition-all duration-300`}>
        
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="self-end text-xl hover:bg-gray-700 p-2 rounded"
        >
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        {sidebarOpen && (
          <>
            <h2 className="text-2xl font-bold">Admin Global</h2>
            <p className="text-sm opacity-70">Bienvenido {user?.nombre}</p>
          </>
        )}

        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => setSection("empresas")}
            className={`p-3 rounded flex items-center gap-3 ${
              section === "empresas" ? "bg-gray-700" : "hover:bg-gray-800"
            } ${!sidebarOpen && "justify-center"}`}
            title="Empresas"
          >
            <i className="fas fa-building text-lg"></i>
            {sidebarOpen && <span>Empresas</span>}
          </button>

          <button
            onClick={() => setSection("usuarios")}
            className={`p-3 rounded flex items-center gap-3 ${
              section === "usuarios" ? "bg-gray-700" : "hover:bg-gray-800"
            } ${!sidebarOpen && "justify-center"}`}
            title="Usuarios"
          >
            <i className="fas fa-users text-lg"></i>
            {sidebarOpen && <span>Usuarios</span>}
          </button>

          <button
            onClick={() => setSection("fichajes")}
            className={`p-3 rounded flex items-center gap-3 ${
              section === "fichajes" ? "bg-gray-700" : "hover:bg-gray-800"
            } ${!sidebarOpen && "justify-center"}`}
            title="Fichajes"
          >
            <i className="fas fa-clipboard-list text-lg"></i>
            {sidebarOpen && <span>Fichajes</span>}
          </button>
        </nav>

        <button
          onClick={() => setShowLogoutModal(true)}
          className={`mt-auto bg-red-600 py-2 rounded hover:bg-red-700 flex items-center gap-3 ${
            !sidebarOpen && "justify-center"
          }`}
          title="Cerrar sesión"
        >
          <i className="fas fa-sign-out-alt text-lg"></i>
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </aside>

      {/* ==== SIDEBAR MÓVIL (BOTTOM) ==== */}
      <nav className="md:hidden bg-gray-900 text-white fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <div className="flex justify-around items-center py-3 safe-area-inset-bottom">
          <button
            onClick={() => setSection("empresas")}
            className={`flex flex-col items-center gap-1 p-2 flex-1 relative ${
              section === "empresas" ? "text-white" : "text-gray-400"
            }`}
          >
            {section === "empresas" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            )}
            <i className="fas fa-building text-xl"></i>
            <span className="text-xs">Empresas</span>
          </button>

          <button
            onClick={() => setSection("usuarios")}
            className={`flex flex-col items-center gap-1 p-2 flex-1 relative ${
              section === "usuarios" ? "text-white" : "text-gray-400"
            }`}
          >
            {section === "usuarios" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            )}
            <i className="fas fa-users text-xl"></i>
            <span className="text-xs">Usuarios</span>
          </button>

          <button
            onClick={() => setSection("fichajes")}
            className={`flex flex-col items-center gap-1 p-2 flex-1 relative ${
              section === "fichajes" ? "text-white" : "text-gray-400"
            }`}
          >
            {section === "fichajes" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            )}
            <i className="fas fa-clipboard-list text-xl"></i>
            <span className="text-xs">Fichajes</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex flex-col items-center gap-1 p-2 flex-1 text-gray-400"
          >
            <i className="fas fa-sign-out-alt text-xl"></i>
            <span className="text-xs">Salir</span>
          </button>
        </div>
      </nav>

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className={`flex-1 p-4 md:p-8 transition-all duration-300 pb-20 md:pb-8 ${
        sidebarOpen ? "md:ml-64" : "md:ml-20"
      }`}>
        {section === "empresas" && <EmpresasSection />}
        {section === "usuarios" && <UsersSection />}
        {section === "fichajes" && <FichajesSection />}
      </main>

      {/* Modal de confirmación de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-sign-out-alt text-yellow-600 text-lg md:text-xl"></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                Cerrar sesión
              </h3>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              ¿Estás seguro de que quieres salir? Tu sesión actual se cerrará.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-100 text-gray-700 px-4 md:px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 md:px-5 py-2.5 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-sign-out-alt"></i>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

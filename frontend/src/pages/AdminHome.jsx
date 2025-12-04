import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminHome() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handlePanel = () => {
    navigate("/admin");
  };

  const handleFichar = () => {
    navigate("/trabajador");
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <i className="fas fa-user-shield text-white text-xl md:text-2xl"></i>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 break-words">
                  Bienvenido, {user?.nombre}
                </h1>
                <p className="text-gray-500 flex items-center gap-2 mt-1 text-sm md:text-base">
                  <i className="fas fa-id-badge text-xs md:text-sm"></i>
                  <span className="text-xs md:text-base">
                    {user?.role === "global_admin" ? "Administrador Global" : "Administrador de Empresa"}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition flex items-center gap-2 shadow-md text-sm md:text-base w-full md:w-auto justify-center"
            >
              <i className="fas fa-sign-out-alt"></i>
              Cerrar Sesión
            </button>
          </div>
          
          {user?.empresa && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 text-sm md:text-base flex-wrap">
                <i className="fas fa-building"></i>
                <span className="font-semibold">Empresa:</span>
                <span className="break-words">{typeof user.empresa === "object" ? user.empresa.nombre : user.empresa}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas de acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Panel de Administración */}
          <div
            onClick={handlePanel}
            className="bg-white rounded-2xl shadow-lg p-6 md:p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                <i className="fas fa-cog text-white text-2xl md:text-3xl"></i>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Panel de Administración
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                Gestiona tus trabajadores y fichajes
              </p>
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm md:text-base">
                <span>Acceder al panel</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>

          {/* Fichar */}
          <div
            onClick={handleFichar}
            className="bg-white rounded-2xl shadow-lg p-6 md:p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                <i className="fas fa-clock text-white text-2xl md:text-3xl"></i>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Registrar Fichaje
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                Registra tu entrada, salida o ausencia
              </p>
              <div className="flex items-center gap-2 text-green-600 font-semibold text-sm md:text-base">
                <span>Ir a fichar</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 md:mt-6 bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-start md:items-center gap-3 text-gray-600">
            <i className="fas fa-info-circle text-indigo-500 mt-1 md:mt-0 flex-shrink-0"></i>
            <p className="text-xs md:text-sm">
              Selecciona una opción para continuar. Desde el panel de administración podrás gestionar todos los aspectos del sistema.
            </p>
          </div>
        </div>
      </div>

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

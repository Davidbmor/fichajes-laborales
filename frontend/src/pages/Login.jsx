// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [disabledModal, setDisabledModal] = useState(false);
  const [showAppInfoModal, setShowAppInfoModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);

      login(data.user, data.token);

      // Navegación será manejada por AppRouter según el rol del usuario
      // Solo navegar a la raíz, AppRouter redirigirá al lugar correcto
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Error al iniciar sesión";
      setMensaje(msg);
      if (err.response?.status === 403 && /deshabilad/i.test(msg)) {
        setDisabledModal(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-4 relative">
      {/* Botón de información solo visible en móviles/tablets */}
      <button
        onClick={() => setShowAppInfoModal(true)}
        className="lg:hidden fixed top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition z-10"
        title="¿Cómo agregar acceso directo?"
      >
        <i className="fas fa-info text-xl"></i>
      </button>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8">
          <div className="flex flex-col items-center text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-user-lock text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-center">Bienvenido</h2>
            <p className="text-indigo-100 mt-2">Inicia sesión para continuar</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8">
          {mensaje && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              <span className="text-sm">{mensaje}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-envelope text-gray-400 mr-2"></i>
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-lock text-gray-400 mr-2"></i>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              <i className="fas fa-sign-in-alt"></i>
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 text-center text-gray-500 text-sm">
            <i className="fas fa-shield-alt mr-1"></i>
            Sistema de fichajes seguro
          </div>
        </div>
      </div>
      {disabledModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-ban text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold">Acceso denegado</h3>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 leading-relaxed">
                  Tu usuario o la empresa asociada se encuentra <strong>deshabilitada</strong>. 
                  Contacta con un administrador para más información.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setDisabledModal(false)} 
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition font-semibold shadow-md flex items-center gap-2"
                >
                  <i className="fas fa-check"></i>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de información de acceso directo */}
      {showAppInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 md:p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-mobile-alt text-xl md:text-2xl"></i>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">Acceso Directo</h3>
                </div>
                <button
                  onClick={() => setShowAppInfoModal(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-4 md:p-6 space-y-6">
              <p className="text-gray-700 text-sm md:text-base">
                Puedes agregar esta página web como un acceso directo en tu dispositivo móvil o tablet para acceder rápidamente.
              </p>

              {/* iOS/Safari */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fab fa-apple text-2xl text-blue-600"></i>
                  <h4 className="font-bold text-gray-800 text-base md:text-lg">iOS / Safari</h4>
                </div>
                <ol className="space-y-2 text-sm md:text-base text-gray-700 list-decimal list-inside">
                  <li>Abre esta página en <strong>Safari</strong></li>
                  <li>Pulsa el botón de <strong>Compartir</strong> <i className="fas fa-share text-blue-600"></i></li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Confirma pulsando <strong>"Añadir"</strong></li>
                </ol>
              </div>

              {/* Android/Chrome */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fab fa-android text-2xl text-green-600"></i>
                  <h4 className="font-bold text-gray-800 text-base md:text-lg">Android / Chrome</h4>
                </div>
                <ol className="space-y-2 text-sm md:text-base text-gray-700 list-decimal list-inside">
                  <li>Abre esta página en <strong>Chrome</strong></li>
                  <li>Pulsa el menú <i className="fas fa-ellipsis-v text-green-600"></i> (tres puntos)</li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong></li>
                  <li>Confirma pulsando <strong>"Añadir"</strong></li>
                </ol>
              </div>

              {/* Samsung Internet */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-mobile-alt text-2xl text-purple-600"></i>
                  <h4 className="font-bold text-gray-800 text-base md:text-lg">Samsung Internet</h4>
                </div>
                <ol className="space-y-2 text-sm md:text-base text-gray-700 list-decimal list-inside">
                  <li>Abre esta página en <strong>Samsung Internet</strong></li>
                  <li>Pulsa el menú <i className="fas fa-bars text-purple-600"></i></li>
                  <li>Selecciona <strong>"Añadir página a"</strong></li>
                  <li>Elige <strong>"Pantalla de inicio"</strong></li>
                </ol>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <i className="fas fa-lightbulb text-indigo-600 text-xl mt-1"></i>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-1">Consejo</h5>
                    <p className="text-sm text-gray-700">
                      Una vez agregado, el acceso directo aparecerá como un icono en tu pantalla de inicio, 
                      permitiéndote abrir la aplicación con un solo toque.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAppInfoModal(false)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-md flex items-center gap-2"
                >
                  <i className="fas fa-check"></i>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


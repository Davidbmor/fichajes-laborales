import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { fichar, getFichajes, BACKEND_URL } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function DashboardTrabajador() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const [fichajes, setFichajes] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [puedeFicharEntrada, setPuedeFicharEntrada] = useState(true);
  const [puedeFicharSalida, setPuedeFicharSalida] = useState(false);
  const [puedeRegistrarAusencia, setPuedeRegistrarAusencia] = useState(true);
  
  // Estados para confirmación
  const [confirmarEntrada, setConfirmarEntrada] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [confirmarAusencia, setConfirmarAusencia] = useState(false);
  
  // Referencias para los timeouts
  const timeoutEntrada = useRef(null);
  const timeoutSalida = useRef(null);
  const timeoutAusencia = useRef(null);

  const cargarFichajes = async (fechaISO) => {
    try {
      setError("");
      setLoading(true);
      setFichajes([]);

      if (!token) throw new Error("No autorizado");

      const d = new Date(fechaISO);
      if (isNaN(d.getTime())) throw new Error("Fecha inválida");

      const anio = d.getFullYear();
      const mes = d.getMonth() + 1;
      const dia = d.getDate();

      const query = `?anio=${anio}&mes=${mes}&dia=${dia}`;

      const data = await getFichajes(token, query);

      // Solo los fichajes de este usuario
      const misFichajes = data.filter((f) => f.userId?._id === user._id);
      setFichajes(misFichajes);

      // Contar entradas y salidas sin emparejar
      const entradasSinSalida = [];
      const salidasSinEntrada = [];

      misFichajes.forEach((f) => {
        if (f.tipo === "entrada") entradasSinSalida.push(f);
        if (f.tipo === "salida") {
          if (entradasSinSalida.length > 0) entradasSinSalida.pop();
          else salidasSinEntrada.push(f);
        }
      });

      // Lógica de botones
      setPuedeFicharEntrada(entradasSinSalida.length === 0); // Entrada si no hay entrada sin salida
      setPuedeFicharSalida(entradasSinSalida.length > 0);     // Salida si hay entrada sin salida
      setPuedeRegistrarAusencia(misFichajes.length === 0);   // Ausencia solo si no hay fichajes
    } catch (err) {
      console.error("Error cargando fichajes", err);
      setError(err.response?.data?.message || err.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFichajes(fechaFiltro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modalOpen) cargarFichajes(fechaFiltro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen) cargarFichajes(fechaFiltro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaFiltro]);

  const handleFichar = async (tipo) => {
    try {
      // Cancelar los timeouts pendientes
      if (tipo === "entrada" && timeoutEntrada.current) {
        clearTimeout(timeoutEntrada.current);
        timeoutEntrada.current = null;
      } else if (tipo === "salida" && timeoutSalida.current) {
        clearTimeout(timeoutSalida.current);
        timeoutSalida.current = null;
      } else if (tipo === "ausencia" && timeoutAusencia.current) {
        clearTimeout(timeoutAusencia.current);
        timeoutAusencia.current = null;
      }
      
      const res = await fichar(token, tipo);
      setMensajeExito(res.mensaje || `Fichaje de ${tipo} registrado correctamente`);
      setMensajeError("");
      
      // Resetear confirmaciones
      setConfirmarEntrada(false);
      setConfirmarSalida(false);
      setConfirmarAusencia(false);
      
      // Ocultar mensaje después de 4 segundos
      setTimeout(() => setMensajeExito(""), 4000);
      
      cargarFichajes(fechaFiltro);
    } catch (err) {
      console.error(err);
      setMensajeError("Error al fichar. Inténtalo de nuevo.");
      setMensajeExito("");
      
      // Ocultar mensaje de error después de 4 segundos
      setTimeout(() => setMensajeError(""), 4000);
    }
  };

  const handleClickFichar = (tipo) => {
    if (tipo === "entrada") {
      if (confirmarEntrada) {
        handleFichar(tipo);
      } else {
        setConfirmarEntrada(true);
        timeoutEntrada.current = setTimeout(() => {
          setConfirmarEntrada(false);
          setMensajeError("No se realizó el fichaje de entrada. Debes pulsar dos veces para confirmar.");
          setTimeout(() => setMensajeError(""), 4000);
        }, 3000);
      }
    } else if (tipo === "salida") {
      if (confirmarSalida) {
        handleFichar(tipo);
      } else {
        setConfirmarSalida(true);
        timeoutSalida.current = setTimeout(() => {
          setConfirmarSalida(false);
          setMensajeError("No se realizó el fichaje de salida. Debes pulsar dos veces para confirmar.");
          setTimeout(() => setMensajeError(""), 4000);
        }, 3000);
      }
    } else if (tipo === "ausencia") {
      if (confirmarAusencia) {
        handleFichar(tipo);
      } else {
        setConfirmarAusencia(true);
        timeoutAusencia.current = setTimeout(() => {
          setConfirmarAusencia(false);
          setMensajeError("No se registró la ausencia. Debes pulsar dos veces para confirmar.");
          setTimeout(() => setMensajeError(""), 4000);
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold break-words">¡Hola, {user?.nombre}!</h2>
              <p className="text-indigo-100 mt-1 text-sm md:text-base">Sistema de fichaje</p>
            </div>
            {user?.empresa?.imagenUrl && (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center p-2 flex-shrink-0">
                <img
                  src={`${BACKEND_URL}${user.empresa.imagenUrl}`}
                  alt={user.empresa.nombre}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-8 space-y-4 md:space-y-6">

          {/* Botones de fichaje */}
          <div className="space-y-4">
            {/* Entrada */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-sign-in-alt text-green-500 mr-2"></i>
                Fichar Entrada
              </label>
              <button
                onClick={() => handleClickFichar("entrada")}
                disabled={!puedeFicharEntrada}
                className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
                  puedeFicharEntrada
                    ? confirmarEntrada
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white scale-105 animate-pulse"
                      : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <i className="fas fa-sign-in-alt mr-2 md:mr-3"></i>
                {confirmarEntrada ? "Confirmar Entrada" : "Fichar Entrada"}
              </button>
              {confirmarEntrada && (
                <p className="text-xs md:text-sm text-green-600 mt-2 animate-pulse">
                  <i className="fas fa-info-circle mr-1"></i>
                  Haz clic nuevamente para confirmar
                </p>
              )}
            </div>

            {/* Salida */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-sign-out-alt text-red-500 mr-2"></i>
                Fichar Salida
              </label>
              <button
                onClick={() => handleClickFichar("salida")}
                disabled={!puedeFicharSalida}
                className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
                  puedeFicharSalida
                    ? confirmarSalida
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white scale-105 animate-pulse"
                      : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <i className="fas fa-sign-out-alt mr-2 md:mr-3"></i>
                {confirmarSalida ? "Confirmar Salida" : "Fichar Salida"}
              </button>
              {confirmarSalida && (
                <p className="text-xs md:text-sm text-red-600 mt-2 animate-pulse">
                  <i className="fas fa-info-circle mr-1"></i>
                  Haz clic nuevamente para confirmar
                </p>
              )}
            </div>

            {/* Ausencia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-ban text-yellow-500 mr-2"></i>
                Registrar Ausencia
              </label>
              <button
                onClick={() => handleClickFichar("ausencia")}
                disabled={!puedeRegistrarAusencia}
                className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
                  puedeRegistrarAusencia
                    ? confirmarAusencia
                      ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white scale-105 animate-pulse"
                      : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <i className="fas fa-ban mr-2 md:mr-3"></i>
                {confirmarAusencia ? "Confirmar Ausencia" : "Registrar Ausencia"}
              </button>
              {confirmarAusencia && (
                <p className="text-xs md:text-sm text-yellow-600 mt-2 animate-pulse">
                  <i className="fas fa-info-circle mr-1"></i>
                  Haz clic nuevamente para confirmar
                </p>
              )}
            </div>
          </div>

          {/* Mensaje de éxito */}
          {mensajeExito && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 mt-4 shadow-md">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-lg"></i>
              </div>
              <span className="font-semibold">{mensajeExito}</span>
            </div>
          )}

          {/* Mensaje de error */}
          {mensajeError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 mt-4 shadow-md">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-circle text-red-600 text-lg"></i>
              </div>
              <span className="font-semibold">{mensajeError}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setModalOpen(true)}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-md flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <i className="fas fa-clock"></i>
              Ver Fichajes
            </button>

            {(user?.role === "admin") && (
              <button
                onClick={() => navigate("/admin-home")}
                className="bg-blue-100 text-blue-700 px-4 md:px-6 py-3 rounded-lg hover:bg-blue-200 transition font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-arrow-left"></i>
                Panel
              </button>
            )}
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-gray-100 text-gray-700 px-4 md:px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <i className="fas fa-sign-out-alt"></i>
            Cerrar sesión
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-2xl overflow-hidden">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold">Mis Fichajes</h3>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-calendar text-gray-400 mr-2"></i>
                  Filtrar por fecha
                </label>
                <input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {loading && (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin text-3xl text-indigo-500 mb-2"></i>
                  <p className="text-gray-600">Cargando fichajes...</p>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {!loading && (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                      <tr>
                        <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">
                          <i className="fas fa-calendar-day mr-2"></i>
                          Fecha y Hora
                        </th>
                        <th className="p-4 font-semibold text-gray-700 border-b-2 border-gray-200">
                          <i className="fas fa-list-ul mr-2"></i>
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fichajes.length === 0 ? (
                        <tr>
                          <td className="p-8 text-center text-gray-500" colSpan="2">
                            <i className="fas fa-inbox text-4xl text-gray-300 mb-2"></i>
                            <p>No hay fichajes registrados para esta fecha.</p>
                          </td>
                        </tr>
                      ) : (
                        fichajes.map((f) => (
                          <tr key={f._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-clock text-indigo-500"></i>
                                <span>{new Date(f.fecha).toLocaleString('es-ES', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                f.tipo === "entrada"
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : f.tipo === "salida"
                                  ? "bg-red-100 text-red-700 border border-red-300"
                                  : "bg-gray-100 text-gray-700 border border-gray-300"
                              }`}>
                                <i className={`fas ${
                                  f.tipo === "entrada" ? "fa-sign-in-alt" : 
                                  f.tipo === "salida" ? "fa-sign-out-alt" : 
                                  "fa-ban"
                                }`}></i>
                                {f.tipo.charAt(0).toUpperCase() + f.tipo.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold flex items-center justify-center gap-2"
                >
                  <i className="fas fa-times"></i>
                  Cerrar
                </button>
                <button
                  onClick={() => cargarFichajes(fechaFiltro)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  <i className="fas fa-sync-alt"></i>
                  Refrescar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

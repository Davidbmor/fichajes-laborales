import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { fichar, getFichajes } from "../api/api";

export default function DashboardTrabajador() {
  const { token, user, logout } = useContext(AuthContext);
  const [mensaje, setMensaje] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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
      await fichar(token, tipo);
      setMensaje(`Fichaje ${tipo} registrado!`);
      cargarFichajes(fechaFiltro);
    } catch (err) {
      console.error(err);
      setMensaje("Error al fichar");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center">
          Bienvenido {user?.nombre}
        </h2>

        <button
          onClick={() => handleFichar("entrada")}
          disabled={!puedeFicharEntrada}
          className={`text-white py-2 rounded transition ${
            puedeFicharEntrada ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Fichar Entrada
        </button>

        <button
          onClick={() => handleFichar("salida")}
          disabled={!puedeFicharSalida}
          className={`text-white py-2 rounded transition ${
            puedeFicharSalida ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Fichar Salida
        </button>

        <button
          onClick={() => handleFichar("ausencia")}
          disabled={!puedeRegistrarAusencia}
          className={`text-white py-2 rounded transition ${
            puedeRegistrarAusencia ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Registrar Ausencia
        </button>

        {mensaje && <p className="text-center text-blue-600">{mensaje}</p>}

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Ver mis fichajes
        </button>

        <button
          onClick={logout}
          className="mt-2 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Cerrar sesión
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-11/12 max-w-xl relative">
            <h3 className="text-xl font-bold mb-4">Mis Fichajes</h3>

            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="border border-gray-300 p-2 rounded mb-4 w-full"
            />

            {loading && <p className="text-gray-600 mb-2">Cargando...</p>}
            {error && <p className="text-red-500 mb-2">{error}</p>}

            <div className="max-h-80 overflow-y-auto border rounded">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 border-b">Fecha</th>
                    <th className="p-3 border-b">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && fichajes.length === 0 ? (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan="2">
                        No hay fichajes registrados este día.
                      </td>
                    </tr>
                  ) : (
                    fichajes.map((f) => (
                      <tr key={f._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{new Date(f.fecha).toLocaleString()}</td>
                        <td
                          className={`p-3 font-semibold ${
                            f.tipo === "entrada"
                              ? "text-green-600"
                              : f.tipo === "salida"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {f.tipo}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
              <button
                onClick={() => cargarFichajes(fechaFiltro)}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Refrescar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getFichajes, getUsers } from "../api/api";
import * as XLSX from "xlsx";

export default function FichajesSection() {
  const { token } = useContext(AuthContext);
  const [fichajes, setFichajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [fecha, setFecha] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("dia");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar lista de usuarios (solo trabajadores)
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await getUsers(token);
        // Excluir admins
        const trabajadores = data.filter((u) => u.role !== "admin");
        setUsuarios(trabajadores);
      } catch (err) {
        console.error("Error cargando usuarios", err);
      }
    };
    cargarUsuarios();
  }, [token]);

  // Cargar fichajes cuando cambian fecha, tipo de filtro o usuario
  useEffect(() => {
    cargarFichajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, tipoFiltro, usuarioFiltro]);

  const cargarFichajes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (fecha) {
        const d = new Date(fecha);
        params.append("anio", d.getFullYear());
        params.append("mes", d.getMonth() + 1);

        if (tipoFiltro === "dia") {
          params.append("dia", d.getDate());
        }

        
      }

      if (usuarioFiltro) {
        params.append("userId", usuarioFiltro);
      }

      const query = `?${params.toString()}`;

      const data = await getFichajes(token, query);
      setFichajes(data);
    } catch (err) {
      console.error("Error cargando fichajes", err);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    if (fichajes.length === 0) return alert("No hay datos para exportar.");

    const worksheet = XLSX.utils.json_to_sheet(
      fichajes.map((f) => ({
        Nombre: f.userId?.nombre || "Desconocido",
        Email: f.userId?.email || "—",
        Fecha: new Date(f.fecha).toLocaleString(),
        Tipo: f.tipo,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fichajes");
    XLSX.writeFile(workbook, `fichajes_${tipoFiltro}_${fecha || "todos"}.xlsx`);
  };

  return (
    <div className="w-full p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-bold mb-4">Fichajes</h2>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg p-2"
        >
          <option value="dia">Por día</option>
          <option value="mes">Por mes</option>
          <option value="año">Por año</option>
        </select>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg p-2"
        />

        <select
          value={usuarioFiltro}
          onChange={(e) => setUsuarioFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg p-2"
        >
          <option value="">Todos los trabajadores</option>
          {usuarios.map((u) => (
            <option key={u._id} value={u._id}>
              {u.nombre} ({u.email})
            </option>
          ))}
        </select>

        <button
          onClick={cargarFichajes}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Buscar
        </button>

        <button
          onClick={exportarExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          📤 Exportar Excel
        </button>
      </div>

      {/* TABLA DE FICHAJES */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-gray-600 text-center">Cargando fichajes...</p>
        ) : fichajes.length === 0 ? (
          <p className="text-gray-600 text-center">
            No hay fichajes para mostrar.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border-b">Nombre</th>
                <th className="p-3 border-b">Email</th>
                <th className="p-3 border-b">Fecha</th>
                <th className="p-3 border-b">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {fichajes.map((f) => (
                <tr key={f._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{f.userId?.nombre}</td>
                  <td className="p-3">{f.userId?.email}</td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

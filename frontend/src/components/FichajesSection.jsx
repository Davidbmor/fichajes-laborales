// frontend/src/components/FichajesSection.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getFichajes, getUsers } from "../api/api";
import * as XLSX from "xlsx";

export default function FichajesSection() {
  const { token } = useAuth();
  const [fichajes, setFichajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [fecha, setFecha] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("dia");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await getUsers(token);
        const trabajadores = data.filter((u) => u.role !== "global_admin"); // exclude globals if desired
        setUsuarios(trabajadores);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) cargarUsuarios();
  }, [token]);

  const cargarFichajes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (fecha) {
        const d = new Date(fecha);
        params.append("anio", d.getFullYear());
        params.append("mes", d.getMonth() + 1);
        if (tipoFiltro === "dia") params.append("dia", d.getDate());
      }

      if (usuarioFiltro) params.append("usuario", usuarioFiltro);

      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await getFichajes(token, query);
      setFichajes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOnDeps(); /* avoid eslint complaining */
  }, [fecha, tipoFiltro, usuarioFiltro]);

  const carregarOnDeps = () => {
    cargarFichajes();
  };

  const exportarExcel = () => {
    if (fichajes.length === 0) return alert("No hay datos para exportar.");
    const worksheet = XLSX.utils.json_to_sheet(
      fichajes.map((f) => ({
        Nombre:
          `${f.userId?.nombre || ""} ${f.userId?.apellidos || ""}`.trim() ||
          "Desconocido",
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

      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="dia">Por día</option>
          <option value="mes">Por mes</option>
          <option value="año">Por año</option>
        </select>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={usuarioFiltro}
          onChange={(e) => setUsuarioFiltro(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Todos los trabajadores</option>
          {usuarios.map((u) => (
            <option key={u._id} value={u._id}>
              {u.nombre} {u.apellidos} ({u.email})
            </option>
          ))}
        </select>

        <button
          onClick={cargarFichajes}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
        <button
          onClick={exportarExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          📤 Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <p>Cargando...</p>
        ) : fichajes.length === 0 ? (
          <p>No hay fichajes</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {fichajes.map((f) => (
                <tr key={f._id} className="border-b">
                  <td className="p-3">
                    {f.userId
                      ? `${f.userId.nombre} ${f.userId.apellidos}`
                      : "Desconocido"}
                  </td>
                  <td className="p-3">{f.userId?.email}</td>
                  <td className="p-3">{new Date(f.fecha).toLocaleString()}</td>
                  <td className="p-3">{f.tipo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

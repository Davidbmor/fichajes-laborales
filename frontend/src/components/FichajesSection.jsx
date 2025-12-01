// frontend/src/components/FichajesSection.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getFichajes, getUsers, getEmpresas } from "../api/api";
import * as XLSX from "xlsx";

export default function FichajesSection() {
  const { token, user } = useAuth();
  const [fichajes, setFichajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]); // hoy por defecto
  const [tipoFiltro, setTipoFiltro] = useState("dia"); // 'dia'|'mes'|'año'|'rango'
  const [usuarioFiltro, setUsuarioFiltro] = useState([]); // array ids
  const [empresaFiltro, setEmpresaFiltro] = useState(user?.role === "admin" ? (user.empresa?._id || user.empresa) : ""); // group filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarMeta = async () => {
      try {
        const [uData, eData] = await Promise.all([
          getUsers(token),
          getEmpresas(token),
        ]);
        setUsuarios(uData);
        setEmpresas(eData);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) cargarMeta();
    // eslint-disable-next-line
  }, [token]);

  const construirQuery = () => {
    const params = new URLSearchParams();

    // fechas
    if (tipoFiltro === "rango") {
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
    } else if (fecha) {
      const d = new Date(fecha);
      params.append("anio", d.getFullYear());
      params.append("mes", d.getMonth() + 1);
      if (tipoFiltro === "dia") params.append("dia", d.getDate());
    }

    // empresa (grupo) tiene prioridad sobre usuario list si se desea
    if (empresaFiltro) {
      params.append("empresa", empresaFiltro);
    }

    // usuarios: si hay selección de usuarios -> csv, si no -> enviar 'all' para que backend aplique rol/empresa
    if (Array.isArray(usuarioFiltro) && usuarioFiltro.length > 0) {
      params.append("usuarios", usuarioFiltro.join(","));
    } else {
      params.append("usuarios", "all");
    }

    const q = params.toString() ? `?${params.toString()}` : "";
    return q;
  };

  const cargarFichajes = async () => {
    try {
      setLoading(true);
      const query = construirQuery();
      const data = await getFichajes(token, query);
      setFichajes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // cargar por defecto al montar (día actual) y cuando cambian filtros importantes
  useEffect(() => {
    cargarFichajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFiltro, fecha, fromDate, toDate, usuarioFiltro, empresaFiltro]);

  const exportarExcel = () => {
    if (fichajes.length === 0) return alert("No hay datos para exportar.");
    const worksheet = XLSX.utils.json_to_sheet(
      fichajes.map((f) => ({
        Nombre: `${f.userId?.nombre || ""} ${f.userId?.apellidos || ""}`.trim() || "Desconocido",
        Email: f.userId?.email || "—",
        Fecha: new Date(f.fecha).toLocaleString(),
        Tipo: f.tipo,
        Empresa: f.userId?.empresa ? f.userId.empresa : "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fichajes");
    XLSX.writeFile(workbook, `fichajes_${tipoFiltro}_${fecha || fromDate || "todos"}.xlsx`);
  };

  return (
    <div className="w-full p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-bold mb-4">Fichajes</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="border p-2 rounded">
          <option value="dia">Por día</option>
          <option value="mes">Por mes</option>
          <option value="año">Por año</option>
          <option value="rango">Rango de fechas</option>
        </select>

        {tipoFiltro !== "rango" && (
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="border p-2 rounded" />
        )}

        {tipoFiltro === "rango" && (
          <>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border p-2 rounded" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border p-2 rounded" />
          </>
        )}

        {/* Grupo / Empresa (solo global_admin puede elegir; admin empresa ve su empresa fijada) */}
        <select
          value={empresaFiltro || ""}
          onChange={(e) => setEmpresaFiltro(e.target.value)}
          className="border p-2 rounded"
          disabled={user?.role === "admin"}
        >
          <option value="">Todos los grupos</option>
          {empresas.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nombre}
            </option>
          ))}
        </select>

        {/* multi-select usuarios */}
        <select
          multiple
          value={usuarioFiltro}
          onChange={(e) => setUsuarioFiltro(Array.from(e.target.selectedOptions).map((o) => o.value))}
          className="border p-2 rounded max-h-48 overflow-auto"
        >
          {/* Mostrar opción para "Todos" */}
          <option value="">Todos los trabajadores</option>
          {usuarios
            .filter((u) => {
              // si hay empresaFiltro, mostrar solo usuarios de esa empresa en la lista
              if (empresaFiltro) return u.empresa && (u.empresa._id || u.empresa) === empresaFiltro;
              if (user?.role === "admin") return u.empresa && (u.empresa._id || u.empresa) === (user.empresa?._id || user.empresa);
              return true;
            })
            .map((u) => (
              <option key={u._id} value={u._id}>
                {u.nombre} {u.apellidos} ({u.email})
              </option>
            ))}
        </select>

        <button onClick={cargarFichajes} className="bg-indigo-600 text-white px-4 py-2 rounded">Buscar</button>
        <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded">📤 Exportar Excel</button>
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
                  <td className="p-3">{f.userId ? `${f.userId.nombre} ${f.userId.apellidos}` : "Desconocido"}</td>
                  <td className="p-3">{f.userId?.email}</td>
                  <td className="p-3">{new Date(f.fecha).toLocaleString()}</td>
                  <td className={`p-3 font-semibold ${f.tipo === "entrada" ? "text-green-600" : f.tipo === "salida" ? "text-red-600" : "text-yellow-600"}`}>
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

// frontend/src/components/FichajesSection.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useParams } from "react-router-dom";
import { getFichajes, getUsers, getEmpresas, BACKEND_URL } from "../api/api";
import * as XLSX from "xlsx";

export default function FichajesSection() {
  const { token, user } = useAuth();
  const { userId } = useParams();
  const [fichajes, setFichajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [tipoFiltro, setTipoFiltro] = useState("dia");
  const [usuarioFiltro, setUsuarioFiltro] = useState(userId ? [userId] : []);
  const [empresaFiltro, setEmpresaFiltro] = useState(user?.role === "admin" ? (user.empresa?._id || user.empresa) : "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosDropdownAbierto, setUsuariosDropdownAbierto] = useState(false);
  const itemsPorPagina = 30;

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

  // Pre-selecciona usuario si viene en la ruta
  useEffect(() => {
    if (userId) {
      setUsuarioFiltro([userId]);
      setPaginaActual(1);
    }
    // eslint-disable-next-line
  }, [userId]);

  // Limpiar filtro de usuarios cuando cambia la empresa (para evitar usuarios de otras empresas)
  useEffect(() => {
    setUsuarioFiltro([]);
    // eslint-disable-next-line
  }, [empresaFiltro]);

  const construirQuery = () => {
    const params = new URLSearchParams();

    if (tipoFiltro === "rango") {
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
    } else if (fecha) {
      const d = new Date(fecha);
      params.append("anio", d.getFullYear());
      params.append("mes", d.getMonth() + 1);
      if (tipoFiltro === "dia") params.append("dia", d.getDate());
    }

    if (empresaFiltro) {
      params.append("empresa", empresaFiltro);
    }

    if (Array.isArray(usuarioFiltro) && usuarioFiltro.length > 0) {
      params.append("usuarios", usuarioFiltro.join(","));
      console.log("Query con usuarios filtrados:", usuarioFiltro);
    } else {
      params.append("usuarios", "all");
      console.log("Query con todos los usuarios");
    }

    const q = params.toString() ? `?${params.toString()}` : "";
    console.log("URL completa:", `/api/fichajes${q}`);
    return q;
  };

  const cargarFichajes = async () => {
    try {
      setLoading(true);
      setPaginaActual(1); // resetear paginación al cargar nuevos datos
      const query = construirQuery();
      const data = await getFichajes(token, query);
      setFichajes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFichajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFiltro, fecha, fromDate, toDate, usuarioFiltro, empresaFiltro]);

  // Agrupar fichajes por usuario y día, acumulando todos los tipos (entrada, salida, ausencia, etc)
  const agruparFichajes = () => {
    const agrupado = {};

    fichajes.forEach((f) => {
      const userId = f.userId?._id;
      const dateKey = new Date(f.fecha).toLocaleDateString("es-ES");
      const key = `${userId}-${dateKey}`;

      if (!agrupado[key]) {
        agrupado[key] = {
          userId: f.userId,
          fecha: f.fecha,
          registros: [], // array de todos los fichajes del día
        };
      }

      agrupado[key].registros.push(f);
    });

    // ordenar registros dentro de cada día por hora y luego ordenar por fecha descendente
    Object.values(agrupado).forEach((item) => {
      item.registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    });

    return Object.values(agrupado).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const getIconoYColor = (tipo) => {
    switch (tipo) {
      case "entrada":
        return { icono: "✓", color: "bg-green-100 text-green-700", label: "Entrada" };
      case "salida":
        return { icono: "✗", color: "bg-red-100 text-red-700", label: "Salida" };
      case "ausencia":
        return { icono: "—", color: "bg-gray-100 text-gray-700", label: "Ausencia" };
      default:
        return { icono: "?", color: "bg-yellow-100 text-yellow-700", label: tipo };
    }
  };

  const exportarExcel = () => {
    if (fichajes.length === 0) return alert("No hay datos para exportar.");

    const agrupado = agruparFichajes();
    const filas = [];

    agrupado.forEach((item) => {
      const nombreCompleto = `${item.userId?.nombre || ""} ${item.userId?.apellidos || ""}`.trim() || "Desconocido";
      const email = item.userId?.email || "—";
      const fecha = new Date(item.fecha).toLocaleDateString("es-ES");

      item.registros.forEach((reg, idx) => {
        filas.push({
          Nombre: idx === 0 ? nombreCompleto : "",
          Email: idx === 0 ? email : "",
          Fecha: idx === 0 ? fecha : "",
          Tipo: reg.tipo,
          Hora: new Date(reg.fecha).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fichajes");

    // Obtener nombre de empresa
    const empresaSeleccionada = empresas.find(e => e._id === empresaFiltro);
    const empresaNombre = empresaSeleccionada?.nombre || "todos";
    
    // Formato de fecha para el nombre
    const dateObj = fecha ? new Date(fecha) : new Date();
    const fechaFormato = dateObj.toLocaleDateString("es-ES").replace(/\//g, "-");
    
    const nombreArchivo = `fichajes_${empresaNombre}_${tipoFiltro}_${fechaFormato}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  const agrupado = agruparFichajes();

  // Paginación
  const totalPaginas = Math.ceil(agrupado.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const agrupadoPaginado = agrupado.slice(inicio, fin);

  const generarNumeroPaginas = () => {
    const nums = [];
    const rango = 5; // mostrar ±5 páginas alrededor de la actual

    let start = Math.max(1, paginaActual - rango);
    let end = Math.min(totalPaginas, paginaActual + rango);

    // ajustar si estamos cerca de los extremos
    if (paginaActual <= rango) {
      end = Math.min(totalPaginas, 2 * rango + 1);
    } else if (paginaActual > totalPaginas - rango) {
      start = Math.max(1, totalPaginas - 2 * rango);
    }

    for (let i = start; i <= end; i++) {
      nums.push(i);
    }
    return nums;
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
          <option value="rango">Rango de fechas</option>
        </select>

        {tipoFiltro !== "rango" && (
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border p-2 rounded"
          />
        )}

        {tipoFiltro === "rango" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border p-2 rounded"
            />
          </>
        )}

        {/* Grupo / Empresa (solo visible para global_admin) */}
        {user?.role === "global_admin" && (
          <select
            value={empresaFiltro || ""}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Todos los grupos</option>
            {empresas.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}

        {/* Filtro de usuarios con dropdown de checkboxes */}
        <div className="relative">
          <button
            onClick={() => setUsuariosDropdownAbierto(!usuariosDropdownAbierto)}
            className="border p-2 rounded bg-white hover:bg-gray-50 w-64"
          >
            {usuarioFiltro.length === 0 ? "Todos los trabajadores" : `${usuarioFiltro.length} seleccionado(s)`} ▼
          </button>
          {usuariosDropdownAbierto && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg z-10 w-64 max-h-60 overflow-y-auto">
              <div className="p-2 border-b">
                <button
                  onClick={() => {
                    setUsuarioFiltro([]);
                    setUsuariosDropdownAbierto(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 w-full text-left px-2 py-1"
                >
                  Limpiar selección
                </button>
              </div>
              {usuarios
                .filter((u) => {
                  const userEmpresaId = u.empresa ? (typeof u.empresa === "object" ? String(u.empresa._id) : String(u.empresa)) : null;
                  if (empresaFiltro) return userEmpresaId === String(empresaFiltro);
                  if (user?.role === "admin") {
                    const adminEmpresaId = user.empresa ? (typeof user.empresa === "object" ? String(user.empresa._id) : String(user.empresa)) : null;
                    return userEmpresaId === adminEmpresaId;
                  }
                  return true;
                })
                .map((u) => (
                  <label key={u._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usuarioFiltro.includes(u._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const nuevoFiltro = [...usuarioFiltro, u._id];
                          setUsuarioFiltro(nuevoFiltro);
                          console.log("Usuario seleccionado:", u._id, "Filtro actualizado:", nuevoFiltro);
                        } else {
                          const nuevoFiltro = usuarioFiltro.filter((id) => id !== u._id);
                          setUsuarioFiltro(nuevoFiltro);
                          console.log("Usuario deseleccionado:", u._id, "Filtro actualizado:", nuevoFiltro);
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      {u.nombre} {u.apellidos}
                    </span>
                  </label>
                ))}
            </div>
          )}
        </div>

        {/* multi-select usuarios */}
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
        ) : agrupado.length === 0 ? (
          <p>No hay fichajes</p>
        ) : (
          <>
            {/* Paginación arriba: formato 1-50 /700   < > */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="text-sm text-gray-700">
                {agrupado.length > 0
                  ? `${inicio + 1}-${Math.min(agrupado.length, fin)} / ${agrupado.length}`
                  : "0-0 / 0"}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  &lt;
                </button>

                <button
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas || totalPaginas === 0}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  &gt;
                </button>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300 table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border border-gray-300 text-left w-28">Perfil</th>
                  <th className="p-3 border border-gray-300 text-left w-64">Nombre</th>
                  <th className="p-3 border border-gray-300 text-left w-36">Fecha</th>
                  <th className="p-3 border border-gray-300 text-left">Fichajes del día</th>
                </tr>
              </thead>
              <tbody>
                {agrupadoPaginado.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {/* Imagen de perfil (de la base de datos o placeholder) */}
                  <td className="p-3 border border-gray-300 align-top">
                    {(() => {
                      // item.userId puede ser objeto (populado) o solo id (string)
                      let usuarioDatos = null;
                      if (item.userId && typeof item.userId === "object") {
                        usuarioDatos = item.userId;
                      } else if (item.userId) {
                        // buscar en la lista de usuarios cargada por el componente
                        usuarioDatos = usuarios.find((u) => String(u._id) === String(item.userId)) || null;
                      }

                      const nombreCompleto = usuarioDatos
                        ? `${usuarioDatos.nombre || ""} ${usuarioDatos.apellidos || ""}`.trim()
                        : "Desconocido";

                      const imagenPerfil = usuarioDatos?.imagenPerfil;

                      // determinar URL final: si es absolute (http/https) usarla tal cual, si es relativa (empieza por /) prefijar BACKEND_URL
                      let urlImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto || "-")}&background=ddd&color=333&size=128`;
                      if (imagenPerfil && typeof imagenPerfil === "string" && imagenPerfil.trim() !== "") {
                        if (/^https?:\/\//i.test(imagenPerfil)) {
                          urlImg = imagenPerfil;
                        } else {
                          // ruta relativa en servidor
                          urlImg = `${BACKEND_URL}${imagenPerfil}`;
                        }
                      }

                      return (
                        <img
                          src={urlImg}
                          alt={nombreCompleto}
                          className="w-20 h-20 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto || "-")}&background=ddd&color=333&size=128`;
                          }}
                        />
                      );
                    })()}
                  </td>

                  {/* Nombre y apellidos */}
                  <td className="p-3 border border-gray-300 align-top break-words whitespace-normal">
                    <div className="font-semibold">
                      {item.userId
                        ? `${item.userId.nombre} ${item.userId.apellidos}`
                        : "Desconocido"}
                    </div>
                    <div className="text-sm text-gray-600">{item.userId?.email}</div>
                  </td>

                  {/* Fecha */}
                  <td className="p-3 border border-gray-300 align-top whitespace-normal">
                    {new Date(item.fecha).toLocaleDateString("es-ES")}
                  </td>

                  {/* Todos los fichajes del día */}
                  <td className="p-3 border border-gray-300 align-top break-words whitespace-normal">
                    <div className="flex flex-wrap gap-2">
                      {item.registros.map((reg, regIdx) => {
                        const { icono, color, label } = getIconoYColor(reg.tipo);
                        const hora = new Date(reg.fecha).toLocaleTimeString(
                          "es-ES",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        );
                        return (
                          <div
                            key={regIdx}
                            className={`${color} px-3 py-1 rounded text-sm font-semibold flex items-center gap-1`}
                          >
                            <span>{icono}</span>
                            <span>{label}</span>
                            <span className="text-gray-700 ml-1">{hora}</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>

            {/* Paginación abajo */}
            <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                &lt;
              </button>

              {generarNumeroPaginas().map((num) => (
                <button
                  key={num}
                  onClick={() => setPaginaActual(num)}
                  className={`px-2 py-1 border rounded ${
                    paginaActual === num
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}

              <span className="text-sm text-gray-600">-</span>

              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                &gt;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

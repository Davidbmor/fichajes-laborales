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
        return { icono: <i className="fas fa-sign-in-alt"></i>, color: "bg-green-100 text-green-700 border border-green-300", label: "Entrada" };
      case "salida":
        return { icono: <i className="fas fa-sign-out-alt"></i>, color: "bg-red-100 text-red-700 border border-red-300", label: "Salida" };
      case "ausencia":
        return { icono: <i className="fas fa-ban"></i>, color: "bg-gray-100 text-gray-700 border border-gray-300", label: "Ausencia" };
      default:
        return { icono: <i className="fas fa-question"></i>, color: "bg-yellow-100 text-yellow-700 border border-yellow-300", label: tipo };
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
    <div className="p-4 md:p-6">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
          <i className="fas fa-clock"></i>
          Fichajes
        </h2>
      </div>

      {/* Sección de filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2">
          <i className="fas fa-filter text-indigo-500"></i>
          Filtros
        </h3>
        <div className="flex gap-2 md:gap-3 flex-wrap">
          {/* Tipo filtro (día/mes/año/rango) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <i className="fas fa-calendar-alt text-gray-400 text-sm md:text-base"></i>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm md:text-base flex-1 sm:flex-initial"
            >
              <option value="dia">Por día</option>
              <option value="mes">Por mes</option>
              <option value="año">Por año</option>
              <option value="rango">Rango de fechas</option>
            </select>
          </div>

          {tipoFiltro !== "rango" && (
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base w-full sm:w-auto"
            />
          )}

        {tipoFiltro === "rango" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base w-full sm:w-auto"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base w-full sm:w-auto"
            />
          </>
        )}

        {/* Grupo / Empresa (solo visible para global_admin) */}
        {user?.role === "global_admin" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <i className="fas fa-building text-gray-400 text-sm md:text-base"></i>
            <select
              value={empresaFiltro || ""}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm md:text-base flex-1 sm:flex-initial"
            >
              <option value="">Todos los grupos</option>
              {empresas.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro de usuarios con dropdown de checkboxes */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setUsuariosDropdownAbierto(!usuariosDropdownAbierto)}
            className="border border-gray-300 p-2 rounded-lg bg-white hover:bg-gray-50 w-full sm:w-64 flex items-center justify-between gap-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-users text-gray-400"></i>
              <span className="truncate">{usuarioFiltro.length === 0 ? "Todos los trabajadores" : `${usuarioFiltro.length} seleccionado(s)`}</span>
            </div>
            <i className={`fas fa-chevron-${usuariosDropdownAbierto ? 'up' : 'down'} text-gray-400`}></i>
          </button>
          {usuariosDropdownAbierto && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-10 w-full sm:w-64 max-h-60 overflow-y-auto">
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

          {/* Botones de acción */}
          <button
            onClick={cargarFichajes}
            className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md text-sm md:text-base w-full sm:w-auto"
          >
            <i className="fas fa-search"></i>
            <span className="hidden sm:inline">Buscar</span>
          </button>
          <button
            onClick={exportarExcel}
            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md text-sm md:text-base w-full sm:w-auto"
          >
            <i className="fas fa-file-excel"></i>
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Tabla de fichajes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-indigo-500 mb-3"></i>
            <p className="text-gray-600">Cargando fichajes...</p>
          </div>
        ) : agrupado.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-3"></i>
            <p className="text-gray-600 text-lg">No hay fichajes para mostrar</p>
          </div>
        ) : (
          <>
            {/* Paginación arriba */}
            <div className="flex items-center justify-between gap-2 md:gap-4 p-3 md:p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-700">
                <i className="fas fa-info-circle text-indigo-500"></i>
                <span className="font-semibold">
                  {agrupado.length > 0
                    ? `${inicio + 1}-${Math.min(agrupado.length, fin)} / ${agrupado.length}`
                    : "0-0 / 0"}
                </span>
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm md:text-base"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                <button
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas || totalPaginas === 0}
                  className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm md:text-base"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full table-fixed min-w-[600px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="p-2 md:p-4 text-left w-20 md:w-28 font-semibold text-gray-700 border-b-2 border-gray-200 text-xs md:text-sm">
                      <i className="fas fa-user-circle mr-1 md:mr-2"></i><span className="hidden sm:inline">Perfil</span>
                    </th>
                    <th className="p-2 md:p-4 text-left w-48 md:w-64 font-semibold text-gray-700 border-b-2 border-gray-200 text-xs md:text-sm">
                      <i className="fas fa-user mr-1 md:mr-2"></i>Nombre
                    </th>
                    <th className="p-2 md:p-4 text-left w-28 md:w-36 font-semibold text-gray-700 border-b-2 border-gray-200 text-xs md:text-sm">
                      <i className="fas fa-calendar-day mr-1 md:mr-2"></i>Fecha
                    </th>
                    <th className="p-2 md:p-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200 text-xs md:text-sm">
                      <i className="fas fa-clock mr-1 md:mr-2"></i>Fichajes
                    </th>
                  </tr>
                </thead>
              <tbody>
                {agrupadoPaginado.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {/* Imagen de perfil (de la base de datos o placeholder) */}
                  <td className="p-2 md:p-4 align-top">
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
                          className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover border-2 md:border-4 border-white shadow-md"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto || "-")}&background=ddd&color=333&size=128`;
                          }}
                        />
                      );
                    })()}
                  </td>

                  {/* Nombre y apellidos */}
                  <td className="p-2 md:p-4 align-top break-words whitespace-normal">
                    <div className="font-bold text-gray-800 text-sm md:text-lg">
                      {item.userId
                        ? `${item.userId.nombre} ${item.userId.apellidos}`
                        : "Desconocido"}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <i className="fas fa-envelope text-xs"></i>
                      <span className="truncate">{item.userId?.email}</span>
                    </div>
                  </td>

                  {/* Fecha */}
                  <td className="p-2 md:p-4 align-top whitespace-normal">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-gray-700">
                      <i className="fas fa-calendar text-indigo-500 text-sm"></i>
                      <span className="font-semibold text-xs md:text-sm">{new Date(item.fecha).toLocaleDateString("es-ES")}</span>
                    </div>
                  </td>

                  {/* Todos los fichajes del día */}
                  <td className="p-2 md:p-4 align-top break-words whitespace-normal">
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
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
                            className={`${color} px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2 shadow-sm`}
                          >
                            {icono}
                            <span className="hidden sm:inline">{label}</span>
                            <span className="font-mono">{hora}</span>
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
            <div className="flex justify-center items-center gap-1 md:gap-2 p-3 md:p-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm md:text-base"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {generarNumeroPaginas().map((num) => (
                <button
                  key={num}
                  onClick={() => setPaginaActual(num)}
                  className={`px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg transition-colors text-sm md:text-base ${
                    paginaActual === num
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}

              {totalPaginas > generarNumeroPaginas()[generarNumeroPaginas().length - 1] && (
                <span className="text-gray-400 px-1 md:px-2 text-sm">...</span>
              )}

              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm md:text-base"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// frontend/src/components/FichajesSection.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getFichajes, getUsers, getEmpresas, BACKEND_URL } from "../api/api";
import * as XLSX from "xlsx";

export default function FichajesSection() {
  const { token, user } = useAuth();
  const [fichajes, setFichajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [tipoFiltro, setTipoFiltro] = useState("dia");
  const [usuarioFiltro, setUsuarioFiltro] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState(user?.role === "admin" ? (user.empresa?._id || user.empresa) : "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
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
    } else {
      params.append("usuarios", "all");
    }

    const q = params.toString() ? `?${params.toString()}` : "";
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
    XLSX.writeFile(workbook, `fichajes_${tipoFiltro}_${fecha || fromDate || "todos"}.xlsx`);
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

        {/* multi-select usuarios */}
        <select
          multiple
          value={usuarioFiltro}
          onChange={(e) =>
            setUsuarioFiltro(
              Array.from(e.target.selectedOptions).map((o) => o.value)
            )
          }
          className="border p-2 rounded max-h-48 overflow-auto"
        >
          <option value="">Todos los trabajadores</option>
          {usuarios
            .filter((u) => {
              // normalizar empresaId
              const userEmpresaId = u.empresa ? (typeof u.empresa === "object" ? String(u.empresa._id) : String(u.empresa)) : null;
              
              if (empresaFiltro)
                return userEmpresaId === String(empresaFiltro);
              
              if (user?.role === "admin") {
                const adminEmpresaId = user.empresa ? (typeof user.empresa === "object" ? String(user.empresa._id) : String(user.empresa)) : null;
                return userEmpresaId === adminEmpresaId;
              }
              
              return true;
            })
            .map((u) => (
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
        ) : agrupado.length === 0 ? (
          <p>No hay fichajes</p>
        ) : (
          <>
            {/* Paginación arriba */}
            <div className="flex justify-center items-center gap-2 mb-4 flex-wrap">
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

              <span className="text-sm text-gray-600 ml-2">
                {totalPaginas > 0 ? `${agrupadoPaginado.length}/${agrupado.length}` : "0/0"}
              </span>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border border-gray-300 text-left">Perfil</th>
                  <th className="p-3 border border-gray-300 text-left">Nombre</th>
                  <th className="p-3 border border-gray-300 text-left">Fecha</th>
                  <th className="p-3 border border-gray-300 text-left">Fichajes del día</th>
                </tr>
              </thead>
              <tbody>
                {agrupadoPaginado.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {/* Imagen de perfil (de la base de datos o placeholder) */}
                  <td className="p-3 border border-gray-300">
                    {(() => {
                      const nombreCompleto = `${item.userId?.nombre || ""} ${item.userId?.apellidos || ""}`.trim();

                      // item.userId puede ser objeto (populado) o solo id (string)
                      let usuarioDatos = null;
                      if (item.userId && typeof item.userId === "object") {
                        usuarioDatos = item.userId;
                      } else if (item.userId) {
                        // buscar en la lista de usuarios cargada por el componente
                        usuarioDatos = usuarios.find((u) => String(u._id) === String(item.userId)) || null;
                      }

                      const imagenPerfil = usuarioDatos?.imagenPerfil;

                      // determinar URL final: si es absolute (http/https) usarla tal cual, si es relativa (empieza por /) prefijar BACKEND_URL
                      let urlImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto || "-")}&background=ddd&color=333&size=64`;
                      if (imagenPerfil && typeof imagenPerfil === "string" && imagenPerfil.trim() !== "") {
                        if (/^https?:\/\//i.test(imagenPerfil)) {
                          urlImg = imagenPerfil;
                        } else {
                          // ruta relativa en servidor
                          urlImg = `${BACKEND_URL}${imagenPerfil}`;
                        }
                      }

                      // console.debug para inspección rápida (puedes quitarlo después)
                      console.debug("Fichajes - img", { nombreCompleto, imagenPerfil, urlImg });

                      return (
                        <img
                          src={urlImg}
                          alt={nombreCompleto}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto || "-")}&background=ddd&color=333&size=64`;
                          }}
                        />
                      );
                    })()}
                  </td>

                  {/* Nombre y apellidos */}
                  <td className="p-3 border border-gray-300">
                    <div className="font-semibold">
                      {item.userId
                        ? `${item.userId.nombre} ${item.userId.apellidos}`
                        : "Desconocido"}
                    </div>
                    <div className="text-sm text-gray-600">{item.userId?.email}</div>
                  </td>

                  {/* Fecha */}
                  <td className="p-3 border border-gray-300">
                    {new Date(item.fecha).toLocaleDateString("es-ES")}
                  </td>

                  {/* Todos los fichajes del día */}
                  <td className="p-3 border border-gray-300">
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

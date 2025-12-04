import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  BACKEND_URL,
  toggleEmpresaEnabled,
  exportarEmpresa,
  importarEmpresa,
} from "../api/api";
import { useNavigate } from "react-router-dom";

export default function EmpresasSection() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [modoEditar, setModoEditar] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    imagen: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [modalEliminar, setModalEliminar] = useState(null); // estado para modal de confirmación
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    const res = await getEmpresas(token);
    setEmpresas(res);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const fd = new FormData();
    fd.append("nombre", form.nombre);
    if (form.imagen) fd.append("imagenPerfil", form.imagen);

    try {
      if (modoEditar) {
        await actualizarEmpresa(token, modoEditar, fd);
      } else {
        await crearEmpresa(token, fd);
      }

      setForm({ nombre: "", imagen: null });
      setModoEditar(null);
      cargarEmpresas();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Error al crear/actualizar empresa";
      setErrorMessage(msg);
    }
  };

  const handleEliminar = async (id) => {
    await eliminarEmpresa(token, id);
    setModalEliminar(null);
    cargarEmpresas();
  };

  const cargarParaEditar = (empresa) => {
    setModoEditar(empresa._id);
    setForm({
      nombre: empresa.nombre,
      imagen: null,
    });
  };

  const handleExportar = async (empresaId) => {
    try {
      await exportarEmpresa(token, empresaId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error exportando empresa");
    }
  };

  const handleImportar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportando(true);
      setErrorMessage("");
      const result = await importarEmpresa(token, file);
      alert(`Empresa importada: ${result.empresa.nombre}\n${result.usuariosCreados} usuarios\n${result.fichajesToCreate} fichajes`);
      cargarEmpresas();
      e.target.value = ""; // limpiar input
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Error importando empresa";
      setErrorMessage(msg);
      e.target.value = "";
    } finally {
      setImportando(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">Gestión de Empresas</h1>
        <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50">
          {importando ? "Importando..." : "📥 Importar"}
          <input
            type="file"
            accept=".json"
            onChange={handleImportar}
            disabled={importando}
            className="hidden"
          />
        </label>
      </div>
      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded shadow mb-6 flex gap-4 flex-wrap"
      >
        {errorMessage && <div className="text-red-600 w-full">{errorMessage}</div>}
        <input
          type="text"
          placeholder="Nombre empresa"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[200px]"
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })}
          className="border p-2 rounded"
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {modoEditar ? "Guardar cambios" : "Crear Empresa"}
        </button>

        {modoEditar && (
          <button
            type="button"
            onClick={() => {
              setModoEditar(null);
              setForm({ nombre: "", imagen: null });
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}
      </form>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {empresas.map((e) => (
          <div
            key={e._id}
            onClick={() => navigate(`/empresas/${e._id}`)}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer"
            aria-label={`Ver empresa ${e.nombre}`}
          >
            {/* IMAGEN (logo) */}
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
              <img
                src={
                  e.imagenUrl
                    ? `${BACKEND_URL}${e.imagenUrl}`
                    : "https://via.placeholder.com/96?text=No+Logo"
                }
                alt={e.nombre}
                className="w-full h-full object-contain p-5"
              />
            </div>

            {/* NOMBRE */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800 text-center mb-4">
                {e.nombre}
              </h3>

              {/* ICONOS DE ACCIONES (detener propagación para que no navegue) */}
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    cargarParaEditar(e);
                  }}
                  className="text-yellow-500 hover:text-yellow-600 text-2xl transition"
                  title="Editar"
                  aria-label={`Editar ${e.nombre}`}
                >
                  <i className="fas fa-pen"></i>
                </button>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleExportar(e._id);
                  }}
                  className="text-blue-500 hover:text-blue-600 text-2xl transition"
                  title="Exportar"
                  aria-label={`Exportar ${e.nombre}`}
                >
                  📥
                </button>

                <button
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    const confirmar = window.confirm(
                      e.habilitado !== false
                        ? `Deshabilitar empresa ${e.nombre} y todos sus usuarios?`
                        : `Habilitar empresa ${e.nombre}?`
                    );
                    if (!confirmar) return;
                    try {
                      await toggleEmpresaEnabled(token, e._id, !(e.habilitado !== false));
                      cargarEmpresas();
                    } catch (err) {
                      console.error(err);
                      alert(err.response?.data?.message || "Error cambiando estado de empresa");
                    }
                  }}
                  className={`text-sm ${e.habilitado !== false ? 'text-green-600' : 'text-gray-400'}`}
                  title={e.habilitado !== false ? 'Deshabilitar empresa' : 'Habilitar empresa'}
                >
                  {e.habilitado !== false ? 'Activa' : 'Deshabilitada'}
                </button>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setModalEliminar(e._id);
                  }}
                  className="text-red-500 hover:text-red-600 text-2xl transition"
                  title="Eliminar"
                  aria-label={`Eliminar ${e.nombre}`}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              ⚠️ Confirmar eliminación
            </h3>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar esta empresa? Esta acción eliminará
              todos los usuarios asociados a la empresa y no se podrá deshacer.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setModalEliminar(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(modalEliminar)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

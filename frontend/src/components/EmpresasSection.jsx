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
  const [modalToggleEmpresa, setModalToggleEmpresa] = useState(null); // estado para modal de habilitar/deshabilitar
  const [importando, setImportando] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);

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
      setFormAbierto(false);
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
    setFormAbierto(true);
    // Scroll hacia arriba para mostrar el formulario en móviles
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="p-4 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestión de Empresas</h1>
        <label className="bg-blue-600 text-white px-4 md:px-5 py-2.5 rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 transition flex items-center gap-2 shadow-md text-sm md:text-base">
          <i className="fas fa-file-import"></i>
          {importando ? "Importando..." : "Importar"}
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
      <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
        {/* Header colapsable */}
        <button
          onClick={() => setFormAbierto(!formAbierto)}
          className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-building text-white text-sm md:text-base"></i>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              {modoEditar ? "Editar Empresa" : "Nueva Empresa"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <i className={`fas fa-chevron-${formAbierto ? 'up' : 'down'} text-gray-400 text-lg md:text-xl transition-transform`}></i>
          </div>
        </button>

        {/* Contenido del formulario */}
        {formAbierto && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 text-sm md:text-base">
                <i className="fas fa-exclamation-circle"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-briefcase text-gray-400 mr-2"></i>
              Nombre de la empresa
            </label>
            <input
              type="text"
              placeholder="Ej: Mi Empresa S.A."
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-image text-gray-400 mr-2"></i>
              Logo de la empresa
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-md flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <i className="fas fa-save"></i>
              {modoEditar ? "Guardar cambios" : "Crear Empresa"}
            </button>

            {modoEditar && (
              <button
                type="button"
                onClick={() => {
                  setModoEditar(null);
                  setForm({ nombre: "", imagen: null });
                  setErrorMessage("");
                  setFormAbierto(false);
                }}
                className="px-4 md:px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-times"></i>
                Cancelar
              </button>
            )}
          </div>
            </form>
          </div>
        )}
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {empresas.map((e) => (
          <div
            key={e._id}
            onClick={() => navigate(`/empresas/${e._id}`)}
            className="bg-white rounded-xl shadow hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden group"
            aria-label={`Ver empresa ${e.nombre}`}
          >
            {/* IMAGEN (logo) */}
            <div className="w-full h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <img
                src={
                  e.imagenUrl
                    ? `${BACKEND_URL}${e.imagenUrl}`
                    : "https://via.placeholder.com/96?text=No+Logo"
                }
                alt={e.nombre}
                className="w-full h-full object-contain p-6 relative z-10"
              />
            </div>

            {/* CONTENIDO */}
            <div className="p-5">
              {/* NOMBRE Y ESTADO */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
                  {e.nombre}
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  e.habilitado !== false 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <i className={`fas ${e.habilitado !== false ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  {e.habilitado !== false ? 'Activa' : 'Deshabilitada'}
                </span>
              </div>

              {/* SEPARADOR */}
              <div className="border-t border-gray-100 mb-4"></div>

              {/* ACCIONES */}
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    cargarParaEditar(e);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-2 rounded-lg transition text-sm font-medium"
                  title="Editar"
                  aria-label={`Editar ${e.nombre}`}
                >
                  <i className="fas fa-edit"></i>
                  Editar
                </button>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleExportar(e._id);
                  }}
                  className="flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 w-10 h-10 rounded-lg transition"
                  title="Exportar"
                  aria-label={`Exportar ${e.nombre}`}
                >
                  <i className="fas fa-download"></i>
                </button>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setModalToggleEmpresa(e);
                  }}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition ${
                    e.habilitado !== false
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  title={e.habilitado !== false ? 'Deshabilitar empresa' : 'Habilitar empresa'}
                >
                  <i className={`fas ${e.habilitado !== false ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                </button>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setModalEliminar(e._id);
                  }}
                  className="flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 w-10 h-10 rounded-lg transition"
                  title="Eliminar"
                  aria-label={`Eliminar ${e.nombre}`}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE HABILITAR/DESHABILITAR */}
      {modalToggleEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                modalToggleEmpresa.habilitado !== false 
                  ? 'bg-yellow-100' 
                  : 'bg-green-100'
              }`}>
                <i className={`fas fa-toggle-${modalToggleEmpresa.habilitado !== false ? 'off' : 'on'} text-lg md:text-xl ${
                  modalToggleEmpresa.habilitado !== false
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                {modalToggleEmpresa.habilitado !== false ? 'Deshabilitar empresa' : 'Habilitar empresa'}
              </h3>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              {modalToggleEmpresa.habilitado !== false
                ? `¿Estás seguro de que deseas deshabilitar la empresa "${modalToggleEmpresa.nombre}"? Todos los usuarios asociados también serán deshabilitados.`
                : `¿Estás seguro de que deseas habilitar la empresa "${modalToggleEmpresa.nombre}"?`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setModalToggleEmpresa(null)}
                className="bg-gray-100 text-gray-700 px-4 md:px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await toggleEmpresaEnabled(token, modalToggleEmpresa._id, !(modalToggleEmpresa.habilitado !== false));
                    setModalToggleEmpresa(null);
                    cargarEmpresas();
                  } catch (err) {
                    console.error(err);
                    setErrorMessage(err.response?.data?.message || "Error cambiando estado de empresa");
                    setModalToggleEmpresa(null);
                  }
                }}
                className={`px-4 md:px-5 py-2.5 rounded-lg transition font-medium flex items-center justify-center gap-2 text-sm md:text-base ${
                  modalToggleEmpresa.habilitado !== false
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <i className={`fas fa-toggle-${modalToggleEmpresa.habilitado !== false ? 'off' : 'on'}`}></i>
                {modalToggleEmpresa.habilitado !== false ? 'Deshabilitar' : 'Habilitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Confirmar eliminación
              </h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar esta empresa? Esta acción eliminará
              todos los usuarios y fichajes asociados a la empresa y <strong>no se podrá deshacer</strong>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalEliminar(null)}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(modalEliminar)}
                className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
              >
                <i className="fas fa-trash-alt"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
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
  const [modalEliminar, setModalEliminar] = useState(null); // estado para modal de confirmación

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    const res = await getEmpresas(token);
    setEmpresas(res);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("nombre", form.nombre);
    if (form.imagen) fd.append("imagenPerfil", form.imagen);

    if (modoEditar) {
      await actualizarEmpresa(token, modoEditar, fd);
    } else {
      await crearEmpresa(token, fd);
    }

    setForm({ nombre: "", imagen: null });
    setModoEditar(null);
    cargarEmpresas();
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-5">Gestión de Empresas</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded shadow mb-6 flex gap-4 flex-wrap"
      >
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
                    ? `http://localhost:4000${e.imagenUrl}`
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
              <div className="flex justify-center gap-6">
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

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
} from "../api/api";

export default function EmpresasSection() {
  const { token } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [modoEditar, setModoEditar] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    imagen: null,
  });

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
    if (form.imagen) fd.append("imagenPerfil", form.imagen); // <-- changed

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
        className="bg-white p-5 rounded shadow mb-6 flex gap-4"
      >
        <input
          type="text"
          placeholder="Nombre empresa"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="border p-2 rounded w-1/3"
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {modoEditar ? "Guardar cambios" : "Crear Empresa"}
        </button>
      </form>

      {/* LISTADO */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-3">Logo</th>
            <th className="p-3">Nombre</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((e) => (
            <tr key={e._id} className="border-b">
              <td className="p-3">
                {/* Mostrar imagen desde el backend; usar placeholder si no existe */}
                <img
                  src={
                    e.imagenUrl
                      ? `http://localhost:4000${e.imagenUrl}`
                      : "https://via.placeholder.com/64?text=No+Logo"
                  }
                  alt={e.nombre}
                  className="w-16 h-16 object-cover"
                />
              </td>
              <td className="p-3">{e.nombre}</td>
              <td className="p-3 flex gap-3">
                <button
                  onClick={() => cargarParaEditar(e)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>

                <button
                  onClick={() => handleEliminar(e._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

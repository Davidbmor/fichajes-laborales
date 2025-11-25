import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getEmpresas, crearEmpresa, eliminarEmpresa } from "../api/api";

export default function EmpresasPage() {
  const { token } = useContext(AuthContext);
  const [empresas, setEmpresas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");

  const cargar = async () => {
    const data = await getEmpresas(token);
    setEmpresas(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async () => {
    await crearEmpresa(token, { nombre, imagenUrl });
    setNombre("");
    setImagenUrl("");
    cargar();
  };

  const eliminar = async (id) => {
    await eliminarEmpresa(token, id);
    cargar();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Empresas</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Nombre empresa"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="URL imagen"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={crear}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Crear
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Logo</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((e) => (
            <tr key={e._id} className="border">
              <td className="p-2 border">
                <img
                  src={e.imagenUrl}
                  alt="logo"
                  className="w-12 h-12 object-cover rounded"
                />
              </td>
              <td className="p-2 border">{e.nombre}</td>
              <td className="p-2 border">
                <button
                  onClick={() => eliminar(e._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
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

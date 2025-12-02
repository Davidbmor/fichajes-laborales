import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import UserFormModal from "./UserFormModal";
import { getUsers, deleteUser, BACKEND_URL } from "../api/api";

export default function UsersSection() {
  const { token } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Filtrar usuarios por nombre, apellidos o email
    const filtrados = usuarios.filter((u) => {
      const textoCompleto = `${u.nombre} ${u.apellidos} ${u.email}`.toLowerCase();
      return textoCompleto.includes(busqueda.toLowerCase());
    });
    setUsuariosFiltrados(filtrados);
  }, [busqueda, usuarios]);

  const cargarUsuarios = async () => {
    const res = await getUsers(token);
    setUsuarios(res);
  };

  const handleDelete = async (id) => {
    await deleteUser(token, id);
    setConfirmDelete(null);
    cargarUsuarios();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>

        <button
          onClick={() => setModalData({})}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Añadir usuario
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, apellidos o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {busqueda && (
          <p className="text-sm text-gray-600 mt-2">
            Se encontraron {usuariosFiltrados.length} usuario(s)
          </p>
        )}
      </div>

      {/* CARDS*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuariosFiltrados.map((u) => (
          <div key={u._id} className="bg-white p-4 rounded shadow flex items-center gap-4">
            <img
              src={
                u.imagenPerfil
                  ? `${BACKEND_URL}${u.imagenPerfil}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre + " " + u.apellidos)}&background=ddd&color=333&size=128`
              }
              alt={u.nombre}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 text-left">
              <div className="font-semibold text-lg">{u.nombre} {u.apellidos}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
              <div className="text-sm text-gray-500 capitalize">{u.role}</div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => setModalData(u)} className="text-yellow-500 hover:text-yellow-600">✏️</button>
              <button onClick={() => setConfirmDelete(u._id)} className="text-red-500 hover:text-red-600">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {usuariosFiltrados.length === 0 && busqueda && (
        <div className="text-center text-gray-500 mt-6">
          <p>No se encontraron usuarios con esa búsqueda</p>
        </div>
      )}

      {modalData && (
        <UserFormModal
          user={modalData}
          onClose={() => {
            setModalData(null);
            cargarUsuarios();
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold text-red-600 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar este usuario?</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 text-white px-4 py-2 rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

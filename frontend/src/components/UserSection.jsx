import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import UserFormModal from "./UserFormModal";

export default function UsersSection() {
  const { token } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const res = await fetch("http://localhost:4000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsuarios(await res.json());
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

      {/* TABLA */}
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border-b">Nombre</th>
              <th className="p-3 border-b">Email</th>
              <th className="p-3 border-b">Rol</th>
              <th className="p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.nombre}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">
                  <button
                    onClick={() => setModalData(u)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded mr-2"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalData && (
        <UserFormModal
          user={modalData}
          onClose={() => {
            setModalData(null);
            cargarUsuarios();
          }}
        />
      )}
    </div>
  );
}

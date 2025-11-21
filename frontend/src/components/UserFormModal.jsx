import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function UserFormModal({ user, onClose }) {
  const { token } = useContext(AuthContext);

  const [form, setForm] = useState({
    nombre: user.nombre || "",
    email: user.email || "",
    password: "",
    role: user.role || "trabajador",
  });

  const isEdit = !!user._id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isEdit
      ? `http://localhost:4000/api/users/${user._id}`
      : "http://localhost:4000/api/auth/register";

    const method = isEdit ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96 shadow">
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? "Editar usuario" : "Crear usuario"}
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border p-2 rounded"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2 rounded"
            required
          />

          {!isEdit && (
            <input
              type="password"
              placeholder="Contraseña"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border p-2 rounded"
              required
            />
          )}

          <select
            className="border p-2 rounded"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="trabajador">Trabajador</option>
            <option value="admin">Administrador</option>
          </select>

          <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Guardar
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

// frontend/src/components/UserFormModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmpresas, createUser } from "../api/api";

export default function UserFormModal({ user = {}, onClose, onSaved }) {
  const { token, user: me } = useAuth();
  const isEdit = !!user._id;

  const [empresas, setEmpresas] = useState([]);

  const [form, setForm] = useState({
    nombre: user.nombre || "",
    apellidos: user.apellidos || "",
    email: user.email || "",
    password: "",
    role: user.role || "trabajador",
    empresa: user.empresa?._id || "",
    imagenPerfil: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getEmpresas(token); // ← YA ES UN ARRAY
        setEmpresas(data); // ← OK
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) =>
      key === "imagenPerfil"
        ? val && fd.append("imagen", val)
        : fd.append(key, val)
    );

    // Si es admin normal, forzar empresa
    if (me.role === "admin") {
      fd.set("empresa", me.empresa?._id || me.empresa);
    }

    await createUser(token, fd);

    onSaved && onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-96">
        <h3 className="text-lg font-bold mb-4">
          {isEdit ? "Editar usuario" : "Crear usuario"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
            required
            className="p-2 border rounded"
          />

          <input
            value={form.apellidos}
            onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            placeholder="Apellidos"
            required
            className="p-2 border rounded"
          />

          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            required
            className="p-2 border rounded"
          />

          {!isEdit && (
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder="Contraseña"
              required
              className="p-2 border rounded"
            />
          )}

          {/* Empresa SOLO visible para global_admin */}
          {me.role === "global_admin" && (
            <select
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="">Selecciona empresa</option>
              {empresas.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          )}

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="trabajador">Trabajador</option>
            <option value="admin">Admin empresa</option>
            {me.role === "global_admin" && (
              <option value="global_admin">Global Admin</option>
            )}
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({ ...form, imagenPerfil: e.target.files[0] })
            }
          />

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-2 rounded"
            >
              Guardar
            </button>
            <button
              type="button"
              className="flex-1 bg-gray-300 p-2 rounded"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

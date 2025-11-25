// frontend/src/components/UserFormModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmpresas } from "../api/api";

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
    imagenPerfil: user.imagenPerfil || "",
    empresa: user.empresa?._id || user.empresa || "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getEmpresas(token);
        setEmpresas(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) load();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEdit
        ? `http://localhost:4000/api/users/${user._id}`
        : "http://localhost:4000/api/users";
      const method = isEdit ? "PUT" : "POST";

      // Si editor es admin (no global), forzar empresa
      if (me.role === "admin") {
        form.empresa = me.empresa?._id || me.empresa || null;
      }

      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    }
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
              placeholder="Contraseña"
              type="password"
              required
              className="p-2 border rounded"
            />
          )}
          <input
            value={form.imagenPerfil}
            onChange={(e) => setForm({ ...form, imagenPerfil: e.target.value })}
            placeholder="URL imagen perfil"
            className="p-2 border rounded"
          />
          {me.role === "global_admin" && (
            <select
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="">Sin empresa</option>
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
            <option value="admin">Admin</option>
            {me.role === "global_admin" && (
              <option value="global_admin">Global Admin</option>
            )}
          </select>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-2 rounded"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 p-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

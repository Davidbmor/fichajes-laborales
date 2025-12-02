// frontend/src/components/UserFormModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmpresas, createUser, updateUser } from "../api/api";

export default function UserFormModal({ user = {}, onClose, onSaved, empresaId = null }) {
  const { token, user: me } = useAuth();
  const isEdit = !!user._id;

  const [empresas, setEmpresas] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    nombre: user.nombre || "",
    apellidos: user.apellidos || "",
    email: user.email || "",
    password: "",
    role: user.role || "trabajador",
    empresa: user.empresa?._id || empresaId || "",
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
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    // cuando cambia el prop user o empresaId, actualizar el form
    setForm((s) => {
      const newForm = {
        ...s,
        nombre: user.nombre || "",
        apellidos: user.apellidos || "",
        email: user.email || "",
        role: user.role || "trabajador",
        empresa: user.empresa?._id || empresaId || "",
        imagenPerfil: null,
      };

      // Si el rol es global_admin, limpiar empresa
      if (newForm.role === "global_admin") {
        newForm.empresa = "";
      }

      return newForm;
    });
    // eslint-disable-next-line
  }, [user, empresaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) =>
      key === "imagenPerfil"
        ? val && fd.append("imagen", val)
        : fd.append(key, val)
    );

    // Si el creador es admin normal, forzar empresa
    if (me.role === "admin") {
      fd.set("empresa", me.empresa?._id || me.empresa);
    }

    // Si estamos en vista de empresa y hay empresaId, forzarlo
    if (empresaId) fd.set("empresa", empresaId);

    try {
      if (isEdit) {
        await updateUser(token, user._id, fd);
      } else {
        await createUser(token, fd);
      }

      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Error creando/actualizando usuario";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-96">
        <h3 className="text-lg font-bold mb-4">
          {isEdit ? "Editar usuario" : "Crear usuario"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {errorMessage && <div className="text-red-600 mb-2">{errorMessage}</div>}
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

          {/* Empresa SOLO visible para global_admin SI NO ES global_admin el que se crea */}
          {me.role === "global_admin" && form.role !== "global_admin" && (
            <select
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              className="p-2 border rounded"
              required
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

// frontend/src/components/UserFormModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmpresas, createUser, updateUser } from "../api/api";

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarNombre = (nombre) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/.test(nombre);
const validarPassword = (pwd) => pwd.length >= 6;

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

    // Validaciones cliente
    if (!validarNombre(form.nombre.trim())) {
      setErrorMessage("Nombre inválido: solo letras, espacios, guiones y apóstrofes");
      return;
    }
    if (!validarNombre(form.apellidos.trim())) {
      setErrorMessage("Apellidos inválidos: solo letras, espacios, guiones y apóstrofes");
      return;
    }
    if (!validarEmail(form.email.trim())) {
      setErrorMessage("Email inválido: debe contener @ y tener terminacion .ejemplo");
      return;
    }
    if (!isEdit && !validarPassword(form.password)) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (isEdit && form.password && !validarPassword(form.password)) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres");
      return;
    }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-t-xl">
          <div className="flex items-center gap-2 md:gap-3 text-white">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-edit text-xl md:text-2xl"></i>
            </div>
            <h3 className="text-xl md:text-2xl font-bold">
              {isEdit ? "Editar usuario" : "Crear nuevo usuario"}
            </h3>
          </div>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-sm"></i>
              <span className="text-xs md:text-sm">{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              <i className="fas fa-user text-gray-400 mr-2"></i>
              Nombre
            </label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Juan"
              required
              className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm md:text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Solo letras, espacios y guiones</p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              <i className="fas fa-user text-gray-400 mr-2"></i>
              Apellidos
            </label>
            <input
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              placeholder="Ej: Pérez García"
              required
              className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              <i className="fas fa-envelope text-gray-400 mr-2"></i>
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              type="email"
              required
              className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              <i className="fas fa-lock text-gray-400 mr-2"></i>
              Contraseña
            </label>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
              required={!isEdit}
              className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm md:text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              {isEdit ? "Solo si deseas cambiarla" : "Mínimo 6 caracteres"}
            </p>
          </div>

          {/* Empresa SOLO visible para global_admin SI NO ES global_admin el que se crea */}
          {me.role === "global_admin" && form.role !== "global_admin" && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                <i className="fas fa-building text-gray-400 mr-2"></i>
                Empresa
              </label>
              <select
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-sm md:text-base"
                required
              >
                <option value="">Selecciona una empresa</option>
                {empresas.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              <i className="fas fa-user-tag text-gray-400 mr-2"></i>
              Rol
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-sm md:text-base"
            >
              <option value="trabajador">👤 Trabajador</option>
              <option value="admin">🛡️ Admin empresa</option>
              {me.role === "global_admin" && (
                <option value="global_admin">👑 Global Admin</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              <i className="fas fa-camera text-gray-400 mr-2"></i>
              Foto de perfil
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, imagenPerfil: e.target.files[0] })
              }
              className="w-full border border-gray-300 p-2.5 md:p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm md:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 md:pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-md flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <i className="fas fa-check"></i>
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
            <button
              type="button"
              className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

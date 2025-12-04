// frontend/src/components/CreateUserForm.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getEmpresas, createUser } from "../api/api";

export default function CreateUserForm({ onCreated }) {
  const { token, user } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    role: "trabajador",
    imagenPerfil: "",
    empresa: "",
  });
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getEmpresas(token);
        setEmpresas(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) cargar();
  }, [token]);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Si el creador es admin normal, no permitir elegir empresa distinta
      let payload = { ...formData };
      if (user.role === "admin") {
        payload.empresa = user.empresa?._id || user.empresa || null;
      }
      const res = await createUser(token, payload);
      setMensaje("Usuario creado!");
      setFormData({
        nombre: "",
        apellidos: "",
        email: "",
        password: "",
        role: "trabajador",
        imagenPerfil: "",
        empresa: "",
      });
      if (onCreated) onCreated(res);
    } catch (err) {
      setMensaje(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <i className="fas fa-user-plus text-white"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Crear nuevo usuario</h3>
      </div>

      {mensaje && (
        <div className={`px-4 py-3 rounded-lg mb-4 flex items-center gap-2 ${
          mensaje.includes("creado") 
            ? "bg-green-50 border border-green-200 text-green-700" 
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          <i className={`fas ${
            mensaje.includes("creado") ? "fa-check-circle" : "fa-exclamation-circle"
          }`}></i>
          <span className="text-sm">{mensaje}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-user text-gray-400 mr-2"></i>
            Nombre
          </label>
          <input
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Juan"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-user text-gray-400 mr-2"></i>
            Apellidos
          </label>
          <input
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            placeholder="Ej: Pérez García"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-envelope text-gray-400 mr-2"></i>
            Email
          </label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="usuario@ejemplo.com"
            type="email"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-lock text-gray-400 mr-2"></i>
            Contraseña
          </label>
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            type="password"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-image text-gray-400 mr-2"></i>
            URL imagen perfil (opcional)
          </label>
          <input
            name="imagenPerfil"
            value={formData.imagenPerfil}
            onChange={handleChange}
            placeholder="https://ejemplo.com/foto.jpg"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Empresa: solo visible para global_admin; admin tendrá su propia empresa forzada en backend */}
        {user?.role === "global_admin" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-building text-gray-400 mr-2"></i>
              Empresa
            </label>
            <select
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            >
              <option value="">Sin empresa</option>
              {empresas.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-user-tag text-gray-400 mr-2"></i>
            Rol
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
          >
            <option value="trabajador">👤 Trabajador</option>
            <option value="admin">🛡️ Admin empresa</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold shadow-md flex items-center justify-center gap-2 mt-6"
        >
          <i className="fas fa-user-plus"></i>
          Crear usuario
        </button>
      </form>
    </div>
  );
}

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
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow-md w-full max-w-md"
    >
      <h3 className="text-lg font-bold mb-4">Crear usuario</h3>
      {mensaje && <p className="text-sm mb-2">{mensaje}</p>}
      <input
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Nombre"
        required
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        name="apellidos"
        value={formData.apellidos}
        onChange={handleChange}
        placeholder="Apellidos"
        required
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        type="email"
        required
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Contraseña"
        type="password"
        required
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        name="imagenPerfil"
        value={formData.imagenPerfil}
        onChange={handleChange}
        placeholder="URL imagen perfil (opcional)"
        className="mb-2 p-2 border rounded w-full"
      />

      {/* Empresa: solo visible para global_admin; admin tendrá su propia empresa forzada en backend */}
      {user?.role === "global_admin" && (
        <select
          name="empresa"
          value={formData.empresa}
          onChange={handleChange}
          className="mb-2 p-2 border rounded w-full"
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
        name="role"
        value={formData.role}
        onChange={handleChange}
        className="mb-2 p-2 border rounded w-full"
      >
        <option value="trabajador">Trabajador</option>
        <option value="admin">Admin (empresa)</option>
      </select>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Crear
      </button>
    </form>
  );
}

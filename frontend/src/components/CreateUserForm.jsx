import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function CreateUserForm() {
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "trabajador",
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error creando usuario");

      setMensaje("Usuario creado correctamente!");
      setFormData({ nombre: "", email: "", password: "", role: "trabajador" });
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Crear nuevo usuario</h2>

      <form onSubmit={crearUsuario} className="flex flex-col gap-4">
        <input
          name="nombre"
          type="text"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Correo"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="trabajador">Trabajador</option>
          <option value="admin">Administrador</option>
        </select>

        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Crear usuario
        </button>

        {mensaje && (
          <p className="text-center text-sm font-semibold text-blue-600">
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}

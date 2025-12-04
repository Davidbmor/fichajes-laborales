// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [disabledModal, setDisabledModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);

      login(data.user, data.token);

      // Navegación será manejada por AppRouter según el rol del usuario
      // Solo navegar a la raíz, AppRouter redirigirá al lugar correcto
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Error al iniciar sesión";
      setMensaje(msg);
      if (err.response?.status === 403 && /deshabilad/i.test(msg)) {
        setDisabledModal(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        {mensaje && <p className="text-red-500 mb-4">{mensaje}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
      {disabledModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-3">Acceso denegado</h3>
            <p className="mb-4">Tu usuario o la empresa asociada se encuentra deshabilitada. Contacta con un administrador para más información.</p>
            <div className="flex justify-end">
              <button onClick={() => setDisabledModal(false)} className="bg-indigo-600 text-white px-4 py-2 rounded">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


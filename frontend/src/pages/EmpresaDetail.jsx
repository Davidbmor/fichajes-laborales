import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getEmpresas, getUsers, deleteUser, BACKEND_URL } from "../api/api";
import UserFormModal from "../components/UserFormModal";
import FichajesSection from "../components/FichajesSection";
import { useParams, useNavigate } from "react-router-dom";

export default function EmpresaDetail() {
  const { id } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [modalUser, setModalUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [section, setSection] = useState("usuarios");
  const [busqueda, setBusqueda] = useState("");
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const empresas = await getEmpresas(token);
        setEmpresa(empresas.find((e) => e._id === id) || null);
        const users = await getUsers(token);
        setUsuarios(users.filter((u) => u.empresa && u.empresa._id === id));
      } catch (err) {
        console.error(err);
      }
    };
    if (token) load();
    // eslint-disable-next-line
  }, [id, token]);

  useEffect(() => {
    // Filtrar usuarios de la empresa
    const filtrados = usuarios.filter((u) => {
      const textoCompleto = `${u.nombre} ${u.apellidos} ${u.email}`.toLowerCase();
      return textoCompleto.includes(busqueda.toLowerCase());
    });
    setUsuariosFiltrados(filtrados);
  }, [busqueda, usuarios]);

  const refresh = async () => {
    const users = await getUsers(token);
    setUsuarios(users.filter((u) => u.empresa && u.empresa._id === id));
  };

  const handleDelete = async (userId) => {
    await deleteUser(token, userId);
    setConfirmDelete(null);
    refresh();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR (igual que DashboardGlobalAdmin) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-6 gap-6">
        <h2 className="text-2xl font-bold">Admin Global</h2>
        <p className="text-sm opacity-70">Bienvenido {user?.nombre}</p>

        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => navigate("/global-admin")}
            className={`p-3 rounded text-left`}
          >
            Empresas
          </button>

          <button
            onClick={() => setSection("usuarios")}
            className={`p-3 rounded text-left ${
              section === "usuarios" ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
          >
            Usuarios
          </button>

          <button
            onClick={() => setSection("fichajes")}
            className={`p-3 rounded text-left ${
              section === "fichajes" ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
          >
            Fichajes
          </button>
        </nav>

        <button
          onClick={logout}
          className="mt-auto bg-red-600 py-2 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-indigo-600"
        >
          ← Volver
        </button>

        <h2 className="text-2xl font-bold mb-4">
          {empresa?.nombre || "Empresa"}
        </h2>

        {section === "usuarios" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Usuarios</h3>
              <button
                onClick={() => setModalUser({ empresa: id })}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                + Añadir usuario
              </button>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nombre, apellidos o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {busqueda && (
                <p className="text-sm text-gray-600 mt-2">
                  Se encontraron {usuariosFiltrados.length} usuario(s)
                </p>
              )}
            </div>

            {/* GRID: 1 / 2 / 3 columnas (responsive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuariosFiltrados.map((u) => (
                <div
                  key={u._id}
                  className="bg-white p-4 rounded shadow flex items-center gap-4"
                >
                  <img
                    src={
                      u.imagenPerfil
                        ? `${BACKEND_URL}${u.imagenPerfil}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.nombre + " " + u.apellidos
                          )}&background=ddd&color=333&size=128`
                    }
                    alt={u.nombre}
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-lg">
                      {u.nombre} {u.apellidos}
                    </div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                    <div className="text-sm text-gray-500 capitalize">{u.role}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setModalUser(u)}
                      className="text-yellow-500 hover:text-yellow-600"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u._id)}
                      className="text-red-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {section === "fichajes" && (
          <div className="mt-4">
            <FichajesSection />
          </div>
        )}

        {/* modal edición/creación */}
        {modalUser && (
          <UserFormModal
            user={modalUser._id ? modalUser : { empresa: id }}
            onClose={() => {
              setModalUser(null);
              refresh();
            }}
            empresaId={id}
          />
        )}

        {/* modal confirmación borrado */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg font-bold text-red-600 mb-4">
                Confirmar eliminación
              </h3>
              <p className="mb-6">¿Seguro que quieres eliminar este usuario?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

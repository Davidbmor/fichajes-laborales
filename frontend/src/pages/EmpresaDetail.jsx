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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden md:flex ${
        sidebarOpen ? "w-64" : "w-20"
      } bg-gray-900 text-white flex-col p-6 gap-6 fixed left-0 top-0 h-screen overflow-y-auto transition-all duration-300`}>
        
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="self-end text-xl hover:bg-gray-700 p-2 rounded"
        >
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        {sidebarOpen && (
          <>
            <h2 className="text-2xl font-bold">Admin Global</h2>
            <p className="text-sm opacity-70">Bienvenido {user?.nombre}</p>
          </>
        )}

        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => navigate("/global-admin")}
            className={`p-3 rounded flex items-center gap-3 hover:bg-gray-800 ${
              !sidebarOpen && "justify-center"
            }`}
            title="Empresas"
          >
            <i className="fas fa-building text-lg"></i>
            {sidebarOpen && <span>Empresas</span>}
          </button>

          <button
            onClick={() => setSection("usuarios")}
            className={`p-3 rounded flex items-center gap-3 ${
              section === "usuarios" ? "bg-gray-700" : "hover:bg-gray-800"
            } ${!sidebarOpen && "justify-center"}`}
            title="Usuarios"
          >
            <i className="fas fa-users text-lg"></i>
            {sidebarOpen && <span>Usuarios</span>}
          </button>

          <button
            onClick={() => setSection("fichajes")}
            className={`p-3 rounded flex items-center gap-3 ${
              section === "fichajes" ? "bg-gray-700" : "hover:bg-gray-800"
            } ${!sidebarOpen && "justify-center"}`}
            title="Fichajes"
          >
            <i className="fas fa-clipboard-list text-lg"></i>
            {sidebarOpen && <span>Fichajes</span>}
          </button>
        </nav>

        <button
          onClick={() => setShowLogoutModal(true)}
          className={`mt-auto bg-red-600 py-2 rounded hover:bg-red-700 flex items-center gap-3 ${
            !sidebarOpen && "justify-center"
          }`}
          title="Cerrar sesión"
        >
          <i className="fas fa-sign-out-alt text-lg"></i>
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </aside>

      {/* SIDEBAR MÓVIL (BOTTOM) */}
      <nav className="md:hidden bg-gray-900 text-white fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <div className="flex justify-around items-center py-3 safe-area-inset-bottom">
          <button
            onClick={() => navigate("/global-admin")}
            className="flex flex-col items-center gap-1 p-2 flex-1 text-gray-400"
          >
            <i className="fas fa-building text-xl"></i>
            <span className="text-xs">Empresas</span>
          </button>

          <button
            onClick={() => setSection("usuarios")}
            className={`flex flex-col items-center gap-1 p-2 flex-1 relative ${
              section === "usuarios" ? "text-white" : "text-gray-400"
            }`}
          >
            {section === "usuarios" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            )}
            <i className="fas fa-users text-xl"></i>
            <span className="text-xs">Usuarios</span>
          </button>

          <button
            onClick={() => setSection("fichajes")}
            className={`flex flex-col items-center gap-1 p-2 flex-1 relative ${
              section === "fichajes" ? "text-white" : "text-gray-400"
            }`}
          >
            {section === "fichajes" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            )}
            <i className="fas fa-clipboard-list text-xl"></i>
            <span className="text-xs">Fichajes</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex flex-col items-center gap-1 p-2 flex-1 text-gray-400"
          >
            <i className="fas fa-sign-out-alt text-xl"></i>
            <span className="text-xs">Salir</span>
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className={`flex-1 p-4 md:p-8 transition-all duration-300 pb-20 md:pb-8 ${
        sidebarOpen ? "md:ml-64" : "md:ml-20"
      }`}>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition font-medium flex items-center gap-2 shadow-sm text-sm md:text-base"
        >
          <i className="fas fa-arrow-left"></i>
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-4">
          {empresa?.nombre || "Empresa"}
        </h2>

        {section === "usuarios" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Usuarios</h3>
              <button
                onClick={() => setModalUser({ empresa: id })}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md font-medium"
              >
                <i className="fas fa-user-plus"></i>
                Añadir usuario
              </button>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="mb-6 bg-white p-4 rounded-xl shadow">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellidos o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {busqueda && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-500"></i>
                  Se encontraron <strong>{usuariosFiltrados.length}</strong> usuario(s)
                </p>
              )}
            </div>

            {/* GRID: 1 / 2 / 3 columnas (responsive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {usuariosFiltrados.map((u) => (
                <div
                  key={u._id}
                  className="bg-white rounded-xl shadow hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden"
                >
                  {/* Header con imagen de fondo */}
                  <div className="relative h-24 bg-gradient-to-br from-blue-500 to-blue-600">
                    <div className="absolute inset-0 bg-black opacity-10"></div>
                  </div>

                  {/* Avatar centrado sobre el header */}
                  <div className="relative px-5 pb-5">
                    <div className="flex justify-center -mt-12 mb-4">
                      <img
                        src={
                          u.imagenPerfil
                            ? `${BACKEND_URL}${u.imagenPerfil}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                u.nombre + " " + u.apellidos
                              )}&background=4F46E5&color=fff&size=128`
                        }
                        alt={u.nombre}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    </div>

                    {/* Info del usuario */}
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">
                        {u.nombre} {u.apellidos}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{u.email}</p>
                      
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <i className={`fas ${u.role === 'admin' ? 'fa-user-shield' : u.role === 'global_admin' ? 'fa-crown' : 'fa-user'}`}></i>
                          {u.role === 'admin' ? 'Admin' : u.role === 'global_admin' ? 'Global Admin' : 'Trabajador'}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          u.habilitado 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <i className={`fas ${u.habilitado ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                          {u.habilitado ? 'Activo' : 'Deshabilitado'}
                        </span>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-100 mb-4"></div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModalUser(u)}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-2 rounded-lg transition text-sm font-medium"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                        Editar
                      </button>

                      <button
                        onClick={() => setConfirmDelete(u._id)}
                        className="flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 w-10 h-10 rounded-lg transition"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Confirmar eliminación
                </h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas eliminar este usuario? Esta acción <strong>no se podrá deshacer</strong>.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
                >
                  <i className="fas fa-trash-alt"></i>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de confirmación de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-sign-out-alt text-yellow-600 text-lg md:text-xl"></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                Cerrar sesión
              </h3>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              ¿Estás seguro de que quieres salir? Tu sesión actual se cerrará.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-100 text-gray-700 px-4 md:px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 md:px-5 py-2.5 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-sign-out-alt"></i>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

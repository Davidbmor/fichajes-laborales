import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import UserFormModal from "./UserFormModal";
import { getUsers, deleteUser, BACKEND_URL, toggleUserEnabled } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function UsersSection() {
  const { token, user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Filtrar usuarios por nombre, apellidos o email
    const filtrados = usuarios.filter((u) => {
      const textoCompleto = `${u.nombre} ${u.apellidos} ${u.email}`.toLowerCase();
      return textoCompleto.includes(busqueda.toLowerCase());
    });
    setUsuariosFiltrados(filtrados);
  }, [busqueda, usuarios]);

  const cargarUsuarios = async () => {
    const res = await getUsers(token);
    setUsuarios(res);
  };

  const handleDelete = async (id) => {
    await deleteUser(token, id);
    setConfirmDelete(null);
    cargarUsuarios();
  };

  return (
    <div className="p-4 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Usuarios</h1>

        <button
          onClick={() => setModalData({})}
          className="bg-green-600 text-white px-4 md:px-5 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md font-medium text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <i className="fas fa-user-plus"></i>
          Añadir usuario
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="mb-6 bg-white p-3 md:p-4 rounded-xl shadow">
        <div className="relative">
          <i className="fas fa-search absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm md:text-base"></i>
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
          />
        </div>
        {busqueda && (
          <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-500"></i>
            Se encontraron <strong>{usuariosFiltrados.length}</strong> usuario(s)
          </p>
        )}
      </div>

      {/* CARDS*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {usuariosFiltrados.map((u) => (
          <div 
            key={u._id} 
            className="bg-white rounded-xl shadow hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden group"
            onClick={() => navigate(`/fichajes/${u._id}`)}
          >
            {/* Header con imagen de fondo */}
            <div className="relative h-24 bg-gradient-to-br from-blue-500 to-blue-600">
              <div className="absolute inset-0 bg-black opacity-10"></div>
            </div>

            {/* Avatar centrado sobre el header */}
            <div className="relative px-4 md:px-5 pb-4 md:pb-5">
              <div className="flex justify-center -mt-10 md:-mt-12 mb-3 md:mb-4">
                <img
                  src={
                    u.imagenPerfil
                      ? `${BACKEND_URL}${u.imagenPerfil}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre + " " + u.apellidos)}&background=4F46E5&color=fff&size=128`
                  }
                  alt={u.nombre}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>

              {/* Info del usuario */}
              <div className="text-center mb-3 md:mb-4">
                <h3 className="font-bold text-base md:text-lg text-gray-800 mb-1">
                  {u.nombre} {u.apellidos}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2 truncate px-2">{u.email}</p>
                
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
              <div className="flex gap-1.5 md:gap-2">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setModalData(u); 
                  }} 
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2 md:px-3 py-2 rounded-lg transition text-xs md:text-sm font-medium"
                  title="Editar"
                >
                  <i className="fas fa-edit"></i>
                  <span className="hidden sm:inline">Editar</span>
                </button>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (currentUser?._id === u._id) return;
                    try {
                      await toggleUserEnabled(token, u._id, !u.habilitado);
                      cargarUsuarios();
                    } catch (err) {
                      console.error(err);
                      alert(err.response?.data?.message || "Error cambiando estado de usuario");
                    }
                  }}
                  className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg transition text-sm md:text-base ${
                    currentUser?._id === u._id 
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                      : u.habilitado
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  disabled={currentUser?._id === u._id}
                  title={currentUser?._id === u._id ? 'No puedes deshabilitarte a ti mismo' : (u.habilitado ? 'Deshabilitar usuario' : 'Habilitar usuario')}
                >
                  <i className={`fas ${u.habilitado ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                </button>

                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (currentUser?._id === u._id) return;
                    setConfirmDelete(u._id); 
                  }} 
                  className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg transition text-sm md:text-base ${
                    currentUser?._id === u._id
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                  disabled={currentUser?._id === u._id}
                  title={currentUser?._id === u._id ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {usuariosFiltrados.length === 0 && busqueda && (
        <div className="text-center py-12">
          <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">No se encontraron usuarios con esa búsqueda</p>
        </div>
      )}

      {modalData && (
        <UserFormModal
          user={modalData}
          onClose={() => {
            setModalData(null);
            cargarUsuarios();
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-lg md:text-xl"></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                Confirmar eliminación
              </h3>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción <strong>no se podrá deshacer</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => setConfirmDelete(null)} 
                className="bg-gray-100 text-gray-700 px-4 md:px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm md:text-base"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(confirmDelete)} 
                className="bg-red-600 text-white px-4 md:px-5 py-2.5 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-trash-alt"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

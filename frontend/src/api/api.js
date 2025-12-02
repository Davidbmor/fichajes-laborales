// frontend/src/api/api.js
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const BASE_URL = `${BACKEND_URL}/api`;

export { BACKEND_URL };

// ---------------------- AUTENTICACIÓN ----------------------
export const loginUser = async (email, password) => {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return res.data;
};

// ---------------------- FICHAJES ----------------------
export const fichar = async (token, tipo) => {
  const res = await axios.post(
    `${BASE_URL}/fichajes`,
    { tipo },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getFichajes = async (token, query = "") => {
  const res = await axios.get(`${BASE_URL}/fichajes${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ---------------------- USUARIOS ----------------------
export const getUsers = async (token) => {
  const res = await axios.get(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Crear usuario con imagen (FORM DATA)
export const createUser = async (token,userData) => {
  const res = await axios.post(`${BASE_URL}/users`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// Actualizar usuario (FORM DATA)
export const updateUser = async (token, id, formData) => {
  const res = await axios.put(`${BASE_URL}/users/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Eliminar usuario
export const deleteUser = async (token, id) => {
  const res = await axios.delete(`${BASE_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ---------------------- EMPRESAS ----------------------

// Obtener todas las empresas
export const getEmpresas = async (token) => {
  const res = await axios.get(`${BASE_URL}/empresas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Crear empresa con imagen (FORM DATA)
export const crearEmpresa = async (token, formData) => {
  const res = await axios.post(`${BASE_URL}/empresas`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // "Content-Type": "multipart/form-data", // <-- remove this
    },
  });
  return res.data;
};

// Actualizar empresa (FORM DATA)
export const actualizarEmpresa = async (token, id, formData) => {
  const res = await axios.put(`${BASE_URL}/empresas/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // "Content-Type": "multipart/form-data", // <-- remove this
    },
  });
  return res.data;
};

// Eliminar empresa
export const eliminarEmpresa = async (token, id) => {
  return axios.delete(`${BASE_URL}/empresas/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

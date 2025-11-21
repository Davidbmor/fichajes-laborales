// src/services/api.js
import axios from "axios";

const BASE_URL = "http://localhost:4000/api";

export const loginUser = async (email, password) => {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return res.data;
};

export const fichar = async (token, tipo) => {
  const res = await axios.post(
    `${BASE_URL}/fichajes`,
    { tipo },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getUsers = async (token) => {
  const res = await axios.get(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getFichajes = async (token, query = "") => {
  const res = await axios.get(`${BASE_URL}/fichajes${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};



export const createUser = async (token, userData) => {
  const res = await axios.post(`${BASE_URL}/users`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
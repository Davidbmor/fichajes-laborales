import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Fichar from '../pages/Fichar.jsx';
import AdminDashboard from '../pages/DashboardAdmin.jsx';
import NotFound from '../pages/NotFound.jsx';
import PrivateRoute from '../components/PrivateRoute.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route path="/fichar" element={<Fichar />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

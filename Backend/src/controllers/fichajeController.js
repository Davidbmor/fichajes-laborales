// backend/controllers/fichajeController.js
import Fichaje from "../models/Fichaje.js";

export const registrarFichaje = async (req, res) => {
  try {
    const { tipo } = req.body;
    const fichaje = await Fichaje.create({ userId: req.user._id, tipo });
    res.status(201).json({ message: "Fichaje registrado", fichaje });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint: GET /api/fichajes?anio=...&mes=...&dia=...&usuario=...
export const obtenerFichajesFiltrados = async (req, res) => {
  try {
    const { dia, mes, anio, usuario } = req.query;
    let filtro = {};

    // Si es admin normal => solo fichajes de su empresa (filtrando por userId.company)
    // Filtro por usuario si llega
    if (usuario) {
      filtro.userId = usuario;
    }

    // Filtrado por fecha (anio/mes/dia)
    if (anio) {
      const year = parseInt(anio);
      const month = mes ? parseInt(mes) - 1 : null;
      const day = dia ? parseInt(dia) : null;

      if (year && month !== null && day) {
        filtro.fecha = {
          $gte: new Date(year, month, day, 0, 0, 0),
          $lte: new Date(year, month, day, 23, 59, 59),
        };
      } else if (year && month !== null) {
        filtro.fecha = {
          $gte: new Date(year, month, 1, 0, 0, 0),
          $lte: new Date(year, month + 1, 0, 23, 59, 59),
        };
      } else if (year) {
        filtro.fecha = {
          $gte: new Date(year, 0, 1, 0, 0, 0),
          $lte: new Date(year, 11, 31, 23, 59, 59),
        };
      }
    }

    // Si el usuario que pide es admin normal, limitar resultados a su empresa
    // Hacemos la query y luego filtramos por populate.match o manualmente:
    let fichajes = await Fichaje.find(filtro).populate("userId", "nombre apellidos email empresa");

    if (req.user.role === "admin") {
      const empresaId = String(req.user.empresa);
      fichajes = fichajes.filter((f) => f.userId && String(f.userId.empresa) === empresaId);
    }

    res.json(fichajes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener fichajes", error: error.message });
  }
};

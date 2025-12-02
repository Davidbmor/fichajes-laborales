// backend/controllers/fichajeController.js
import Fichaje from "../models/Fichaje.js";
import User from "../models/User.js";

export const registrarFichaje = async (req, res) => {
  try {
    const { tipo } = req.body;
    const fichaje = await Fichaje.create({ userId: req.user._id, tipo });
    res.status(201).json({ message: "Fichaje registrado", fichaje });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint: GET /api/fichajes?from=YYYY-MM-DD&to=YYYY-MM-DD&anio=&mes=&dia=&usuarios=csv&empresa=
export const obtenerFichajesFiltrados = async (req, res) => {
  try {
    const { dia, mes, anio, usuario, usuarios, from, to, empresa } = req.query;
    let filtro = {};

    // --- Fechas: prioridad from/to, si no hay parámetros usar día actual ---
    if (from || to) {
      const gte = from ? new Date(from) : new Date(0);
      const lte = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date();
      filtro.fecha = { $gte: gte, $lte: lte };
    } else if (anio) {
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
    } else {
      // por defecto: hoy
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
      filtro.fecha = { $gte: inicio, $lte: fin };
    }

    // --- Usuarios / grupos ---
    // prioridad: 'usuarios' param, luego 'usuario' legacy, luego 'empresa' param, luego role del requester
    const usuariosParam = (usuarios || usuario || "").toString().trim();

    // Si piden filtrar por empresa (grupo)
    if (empresa) {
      // obtener ids de usuarios de esa empresa
      const usersCompany = await User.find({ empresa }).select("_id");
      const ids = usersCompany.map((u) => u._id);
      filtro.userId = { $in: ids };
    } else if (usuariosParam && usuariosParam !== "all") {
      const arr = usuariosParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (arr.length === 1) filtro.userId = arr[0];
      else filtro.userId = { $in: arr };
    } else {
      // usuariosParam es "all" o vacío -> aplicar restricción según rol del requester
      if (req.user.role === "admin") {
        // limitar a todos los usuarios de la empresa del admin
        const usersCompany = await User.find({ empresa: req.user.empresa }).select("_id");
        const ids = usersCompany.map((u) => u._id);
        filtro.userId = { $in: ids };
      }
      // si es global_admin y no se especificó nada, dejamos sin filtro de usuario (todos)
    }

    // Ejecutar consulta con populate
    const fichajes = await Fichaje.find(filtro).populate("userId", "nombre apellidos email empresa imagenPerfil").sort({ fecha: 1 });

    res.json(fichajes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener fichajes", error: error.message });
  }
};

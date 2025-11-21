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

export const obtenerFichajes = async (req, res) => {
  try {
    const { fecha, usuario, tipo } = req.query;

    let filtro = {};

    if (fecha) {
      const inicio = new Date(fecha);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59);
      filtro.fecha = { $gte: inicio, $lte: fin };
    }

    if (usuario) filtro.userId = usuario; 
    if (tipo) filtro.tipo = tipo;

    const fichajes = await Fichaje
      .find(filtro)
      .populate("userId", "nombre email");

    res.json(fichajes);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener fichajes" });
  }
};




export const obtenerFichajesFiltrados = async (req, res) => {
  try {
    const { dia, mes, anio } = req.query;
    let filtro = {};

    if (anio) {
      const start = new Date(anio, (mes ? mes - 1 : 0), dia ? dia : 1);
      let end;

      if (dia) {
        end = new Date(anio, (mes ? mes - 1 : 0), Number(dia) + 1);
      } else if (mes) {
        end = new Date(anio, mes, 1);
      } else {
        end = new Date(Number(anio) + 1, 0, 1);
      }

      filtro.fecha = { $gte: start, $lt: end };
    }

    const fichajes = await Fichaje.find(filtro).populate("userId", "nombre email");

    res.json(fichajes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener fichajes", error: error.message });
  }
};
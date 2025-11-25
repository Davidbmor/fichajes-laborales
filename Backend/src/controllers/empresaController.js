// backend/controllers/empresaController.js
import Empresa from "../models/Empresa.js";

export const crearEmpresa = async (req, res) => {
  try {
    const { nombre, imagenUrl } = req.body;
    const empresa = await Empresa.create({ nombre, imagenUrl });
    res.status(201).json(empresa);
  } catch (err) {
    res.status(500).json({ message: "Error creando empresa", error: err.message });
  }
};

export const obtenerEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.find();
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo empresas" });
  }
};

import Empresa from "../models/Empresa.js";

export const crearEmpresa = async (req, res) => {
  try {
    const imagenUrl = req.file ? `/uploads/companies/${req.file.filename}` : null;

    const { nombre } = req.body;

    const empresa = await Empresa.create({
      nombre,
      imagenUrl
    });

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

export const actualizarEmpresa = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.imagenUrl = `/uploads/companies/${req.file.filename}`;
    }

    const empresa = await Empresa.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json(empresa);

  } catch (err) {
    res.status(500).json({ message: "Error actualizando empresa" });
  }
};

export const eliminarEmpresa = async (req, res) => {
  try {
    await Empresa.findByIdAndDelete(req.params.id);
    res.json({ message: "Empresa eliminada" });
  } catch (err) {
    res.status(500).json({ message: "Error eliminando empresa" });
  }
};

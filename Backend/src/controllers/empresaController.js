import Empresa from "../models/Empresa.js";
import User from "../models/User.js";
import fs from "fs/promises";
import path from "path";

export const crearEmpresa = async (req, res) => {
  try {
    const imagenUrl = req.file ? `/uploads/companies/${req.file.filename}` : null;

    let { nombre } = req.body;
    if (!nombre || typeof nombre !== 'string') return res.status(400).json({ message: 'Nombre inválido' });

    nombre = nombre.trim();
    if (nombre.length === 0) return res.status(400).json({ message: 'Nombre inválido' });

    // escape regex metacharacters to avoid injection when building regex
    const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nombreEsc = escapeForRegex(nombre);

    // comprobar duplicados por nombre (case-insensitive, trimmed)
    const existe = await Empresa.findOne({ nombre: { $regex: `^${nombreEsc}$`, $options: 'i' } });
    if (existe) return res.status(400).json({ message: 'Empresa ya existe' });

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

    if (updates.nombre && typeof updates.nombre === 'string') {
      const nuevoNombre = updates.nombre.trim();
      if (nuevoNombre.length === 0) return res.status(400).json({ message: 'Nombre inválido' });

      const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nombreEsc = escapeForRegex(nuevoNombre);

      // comprobar duplicados por nombre (case-insensitive), excluyendo la propia empresa
      const existe = await Empresa.findOne({
        _id: { $ne: req.params.id },
        nombre: { $regex: `^${nombreEsc}$`, $options: 'i' }
      });
      if (existe) return res.status(400).json({ message: 'Otra empresa con ese nombre ya existe' });

      updates.nombre = nuevoNombre;
    }

    const empresa = await Empresa.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json(empresa);

  } catch (err) {
    res.status(500).json({ message: "Error actualizando empresa" });
  }
};

export const eliminarEmpresa = async (req, res) => {
  try {
    const empresaId = req.params.id;

    const empresa = await Empresa.findById(empresaId);
    if (!empresa) return res.status(404).json({ message: "Empresa no encontrada" });

    // borrar imagen de la empresa si es local
    if (empresa.imagenUrl && typeof empresa.imagenUrl === "string" && empresa.imagenUrl.startsWith("/uploads")) {
      try {
        const rel = empresa.imagenUrl.replace(/^\//, "");
        const filePath = path.join(process.cwd(), rel);
        await fs.unlink(filePath);
      } catch (err) {
        console.warn("No se pudo borrar imagen de empresa:", err.message);
      }
    }

    // obtener usuarios asociados (para borrar sus imágenes)
    const usuarios = await User.find({ empresa: empresaId });
    for (const u of usuarios) {
      if (u.imagenPerfil && typeof u.imagenPerfil === "string" && u.imagenPerfil.startsWith("/uploads")) {
        try {
          const rel = u.imagenPerfil.replace(/^\//, "");
          const filePath = path.join(process.cwd(), rel);
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`No se pudo borrar imagen de usuario ${u._id}:`, err.message);
        }
      }
    }

    // eliminar usuarios y empresa de la base
    const result = await User.deleteMany({ empresa: empresaId });
    await Empresa.findByIdAndDelete(empresaId);

    res.json({
      message: "Empresa eliminada",
      usuariosEliminados: result.deletedCount || usuarios.length || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Error eliminando empresa" });
  }
};

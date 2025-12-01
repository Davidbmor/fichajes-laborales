import Empresa from "../models/Empresa.js";
import User from "../models/User.js";
import fs from "fs/promises";
import path from "path";

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

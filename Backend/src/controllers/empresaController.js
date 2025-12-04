import Empresa from "../models/Empresa.js";
import User from "../models/User.js";
import Fichaje from "../models/Fichaje.js";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

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
      imagenUrl,
      habilitado: true,
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

    // Propagar cambio de habilitado a todos los usuarios de la empresa
    if (typeof updates.habilitado !== "undefined") {
      try {
        if (updates.habilitado === false) {
          // Deshabilitar todos los usuarios
          await User.updateMany({ empresa: req.params.id }, { habilitado: false });
        } else {
          // Habilitar todos los usuarios
          await User.updateMany({ empresa: req.params.id }, { habilitado: true });
        }
      } catch (err) {
        console.warn("No se pudo propagar habilitado a usuarios:", err.message);
      }
    }

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
    const usuariosIds = usuarios.map((u) => u._id);
    
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

    // Importar Fichaje model para borrar fichajes asociados (Ya importado al inicio)
    
    // eliminar fichajes de los usuarios
    const fichajeResult = await Fichaje.deleteMany({ userId: { $in: usuariosIds } });
    
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

// Exportar empresa con todos sus usuarios y fichajes
export const exportarEmpresa = async (req, res) => {
  try {
    const empresaId = req.params.id;

    const empresa = await Empresa.findById(empresaId);
    if (!empresa) return res.status(404).json({ message: "Empresa no encontrada" });

    // Obtener todos los usuarios de la empresa
    const usuarios = await User.find({ empresa: empresaId }).select("-password");

    // Obtener todos los fichajes de los usuarios de la empresa
    const usuariosIds = usuarios.map((u) => u._id);
    const fichajes = await Fichaje.find({ userId: { $in: usuariosIds } });

    // Construir objeto de exportación
    const exportData = {
      empresa: empresa.toObject(),
      usuarios: usuarios.map((u) => u.toObject()),
      fichajes: fichajes.map((f) => f.toObject()),
      exportDate: new Date().toISOString(),
      version: 1,
    };

    // Enviar como descarga
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="empresa_${empresa.nombre}_${new Date().toISOString().split("T")[0]}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ message: "Error exportando empresa", error: err.message });
  }
};

// Importar empresa con todos sus usuarios y fichajes
export const importarEmpresa = async (req, res) => {
  let nuevaEmpresa = null;
  let usuariosCreados = [];
  
  try {
    if (!req.file) return res.status(400).json({ message: "No se proporcionó archivo" });

    // Leer y parsear el JSON
    const fileContent = await fs.readFile(req.file.path, "utf-8");
    const exportData = JSON.parse(fileContent);

    // Validar estructura básica
    if (!exportData.empresa || !Array.isArray(exportData.usuarios) || !Array.isArray(exportData.fichajes)) {
      await fs.unlink(req.file.path); // limpiar archivo temporal
      return res.status(400).json({ message: "Formato de archivo inválido" });
    }

    // Verificar que no existe una empresa con el mismo nombre
    const empresaExiste = await Empresa.findOne({ nombre: exportData.empresa.nombre });
    if (empresaExiste) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ message: "Una empresa con ese nombre ya existe" });
    }

    // Crear la empresa (sin _id para que MongoDB genere uno nuevo)
    const { _id: _, ...empresaData } = exportData.empresa;
    nuevaEmpresa = await Empresa.create({
      ...empresaData,
      habilitado: true,
    });

    // Mapeo de IDs antiguos a nuevos (para usuarios y fichajes)
    const idMap = {}; // oldUserId -> newUserId

    // Crear usuarios
    for (const usuario of exportData.usuarios) {
      const { _id: oldId, password, ...userData } = usuario;
      
      // Si no hay password (fue omitido en la exportación), generar uno temporal
      let userPassword;
      if (password) {
        userPassword = password; // Si por alguna razón existe, usarlo
      } else {
        // Generar password temporal: email_timestamp (hash)
        const tempPassword = `${usuario.email}_${Date.now()}`;
        userPassword = await bcrypt.hash(tempPassword, 10);
      }
      
      const nuevoUsuario = await User.create({
        ...userData,
        password: userPassword,
        empresa: nuevaEmpresa._id,
        habilitado: true,
      });
      idMap[oldId] = nuevoUsuario._id;
      usuariosCreados.push(nuevoUsuario);
    }

    // Crear fichajes con los nuevos IDs
    const fichajesToCreate = exportData.fichajes.map((f) => ({
      ...f,
      _id: undefined, // MongoDB generará nuevo _id
      userId: idMap[f.userId], // mapear al nuevo ID de usuario
    }));

    let fichajosCreados = 0;
    if (fichajesToCreate.length > 0) {
      await Fichaje.insertMany(fichajesToCreate);
      fichajosCreados = fichajesToCreate.length;
    }

    // Limpiar archivo temporal
    await fs.unlink(req.file.path);

    res.status(201).json({
      message: "Empresa importada exitosamente",
      empresa: nuevaEmpresa,
      usuariosCreados: usuariosCreados.length,
      fichajosCreados: fichajosCreados,
    });
  } catch (err) {
    console.error("Error importando empresa:", err);
    
    // Rollback: Si hay error y se creó la empresa, borrarla junto con usuarios y fichajes
    if (nuevaEmpresa) {
      try {
        const usuariosIds = usuariosCreados.map((u) => u._id);
        
        // Borrar fichajes
        await Fichaje.deleteMany({ userId: { $in: usuariosIds } });
        // Borrar usuarios
        await User.deleteMany({ _id: { $in: usuariosIds } });
        // Borrar empresa
        await Empresa.findByIdAndDelete(nuevaEmpresa._id);
        
        console.warn("Rollback completado: empresa y datos asociados eliminados");
      } catch (rollbackErr) {
        console.error("Error en rollback:", rollbackErr);
      }
    }
    
    // Limpiar archivo temporal en caso de error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.warn("No se pudo borrar archivo temporal");
      }
    }
    res.status(500).json({ message: "Error importando empresa", error: err.message });
  }
};

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarNombre = (nombre) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/.test(nombre);

export const obtenerUsuarios = async (req, res) => {
  try {
    let filtro = {};

    if (req.user.role === "admin") {
      // req.user.empresa podría ser un ObjectId o un objeto poblado; extraer el _id si es necesario
      filtro.empresa = req.user.empresa?._id || req.user.empresa;
    }

    const usuarios = await User
      .find(filtro)
      .select("-password")
      .populate("empresa", "nombre imagenUrl habilitado");

    res.json(usuarios);

  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios", error: err.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, role, empresa } = req.body;

    // Validar campos requeridos y formato
    if (!nombre || !apellidos || !email || !password) {
      return res.status(400).json({ message: "Campos requeridos: nombre, apellidos, email, contraseña" });
    }

    if (!validarNombre(nombre.trim())) {
      return res.status(400).json({ message: "Nombre inválido: solo letras, espacios, guiones y apóstrofes" });
    }
    if (!validarNombre(apellidos.trim())) {
      return res.status(400).json({ message: "Apellidos inválidos: solo letras, espacios, guiones y apóstrofes" });
    }
    if (!validarEmail(email.trim())) {
      return res.status(400).json({ message: "Email inválido: debe tener formato usuario@dominio.com" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Contraseña debe tener al menos 6 caracteres" });
    }

    let empresaAsignada = empresa || null;
    
    // Si es admin normal, forzar su propia empresa
    if (req.user.role === "admin") {
      empresaAsignada = req.user.empresa;
    }
    
    // Si el nuevo usuario es global_admin, NO asignar empresa
    if (role === "global_admin") {
      empresaAsignada = null;
    }

    // DEBUG ampliado: comprobar qué llega exactamente
    console.log("crearUsuario - Content-Type:", req.headers["content-type"]);
    console.log("crearUsuario - req.file:", req.file);
    console.log("crearUsuario - req.files:", req.files);
    console.log("crearUsuario - req.body:", req.body);

    // soportar tanto req.file (single) como req.files (fields: 'imagen' o 'imagenPerfil')
    const file =
      req.file ||
      (req.files && (req.files.imagenPerfil?.[0] || req.files.imagen?.[0]));

    // Normalizar la ruta de la imagen y evitar nulls/literales "null"
    let imagenPerfil;
    if (file) {
      imagenPerfil = `/uploads/users/${file.filename}`;
    } else {
      const bodyVal = req.body.imagenPerfil;
      if (bodyVal === null || bodyVal === "null" || typeof bodyVal === "undefined") {
        imagenPerfil = "";
      } else {
        imagenPerfil = String(bodyVal || "");
      }
    }

    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ message: "Email ya registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevo = await User.create({
      nombre,
      apellidos,
      email,
      password: hashedPassword,
      role,
      empresa: empresaAsignada,
      imagenPerfil: imagenPerfil || "" // forzar cadena
    });

    res.status(201).json(
      await User.findById(nuevo._id).select("-password").populate("empresa", "nombre imagenUrl")
    );

  } catch (err) {
    res.status(500).json({ message: "Error al crear usuario", error: err.message });
  }
};

// Habilitar / deshabilitar usuario (admin de empresa o global)
export const toggleUsuario = async (req, res) => {
  try {
    const { habilitado } = req.body;
    if (typeof habilitado === "undefined") return res.status(400).json({ message: "Debe indicar 'habilitado'" });

    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // No permitir deshabilitar un admin global
    if (usuario.role === "global_admin") return res.status(403).json({ message: "No se puede modificar el estado de un admin global" });

    // Impedir que un admin se deshabilite a sí mismo
    if (req.user.role === "admin" && String(req.user._id) === String(usuario._id)) {
      return res.status(403).json({ message: "No puedes deshabilitarte a ti mismo" });
    }

    // Si el que realiza la acción es admin de empresa, asegurar que pertenece a la misma empresa
    if (req.user.role === "admin") {
      const usuarioEmpresaId = String(usuario.empresa || "");
      const adminEmpresaId = String(req.user.empresa?._id || req.user.empresa || "");
      if (usuarioEmpresaId !== adminEmpresaId) {
        return res.status(403).json({ message: "No autorizado para modificar usuarios de otra empresa" });
      }
    }

    usuario.habilitado = !!habilitado;
    await usuario.save();

    const usuarioSafe = await User.findById(usuario._id).select("-password").populate("empresa", "nombre imagenUrl habilitado");
    res.json(usuarioSafe);
  } catch (err) {
    res.status(500).json({ message: "Error actualizando estado de usuario", error: err.message });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Validar nombre y apellidos si vienen en la solicitud
    if (updates.nombre && !validarNombre(updates.nombre.trim())) {
      return res.status(400).json({ message: "Nombre inválido: solo letras, espacios, guiones y apóstrofes" });
    }
    if (updates.apellidos && !validarNombre(updates.apellidos.trim())) {
      return res.status(400).json({ message: "Apellidos inválidos: solo letras, espacios, guiones y apóstrofes" });
    }
    if (updates.email && !validarEmail(updates.email.trim())) {
      return res.status(400).json({ message: "Email inválido: debe tener formato usuario@dominio.com" });
    }

    console.log("actualizarUsuario - Content-Type:", req.headers["content-type"]);
    console.log("actualizarUsuario - req.file:", req.file);
    console.log("actualizarUsuario - req.files:", req.files);
    console.log("actualizarUsuario - req.body:", req.body);

    const file =
      req.file ||
      (req.files && (req.files.imagenPerfil?.[0] || req.files.imagen?.[0]));

    if (file) {
      updates.imagenPerfil = `/uploads/users/${file.filename}`;
    } else {
      const bodyVal = req.body.imagenPerfil;
      if (bodyVal === null || bodyVal === "null" || typeof bodyVal === "undefined") {
        // no tocar si no viene intención de cambiar la imagen, o forzar vacío si quieres
        if (typeof updates.imagenPerfil !== "undefined") updates.imagenPerfil = "";
      } else if (bodyVal) {
        updates.imagenPerfil = String(bodyVal);
      }
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User
      .findByIdAndUpdate(req.params.id, updates, { new: true })
      .select("-password");

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Error actualizando usuario", error: err.message });
  }
};

// Nuevo: eliminar usuario
export const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // impedir borrar global_admin
    if (usuario.role === "global_admin") {
      return res.status(403).json({ message: "No se puede eliminar un admin global" });
    }

    // impedir que un admin se elimine a sí mismo
    if (req.user.role === "admin" && String(req.user._id) === String(usuario._id)) {
      return res.status(403).json({ message: "No puedes eliminarte a ti mismo" });
    }

    // borrar fichero de imagen si es local (ruta que comienza por /uploads)
    const imagen = usuario.imagenPerfil;
    if (imagen && typeof imagen === "string" && imagen.startsWith("/uploads")) {
      try {
        const rel = imagen.replace(/^\//, ""); // "uploads/users/xxx"
        const filePath = path.join(process.cwd(), rel);
        await fs.unlink(filePath);
      } catch (err) {
        // no bloquear la eliminación si el fichero no existe, solo loguear
        console.warn("No se pudo borrar imagen de usuario:", err.message);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error eliminando usuario", error: err.message });
  }
};

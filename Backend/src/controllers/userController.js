import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const obtenerUsuarios = async (req, res) => {
  try {
    let filtro = {};

    if (req.user.role === "admin") {
      filtro.empresa = req.user.empresa;
    }

    const usuarios = await User
      .find(filtro)
      .select("-password")
      .populate("empresa", "nombre imagenUrl");

    res.json(usuarios);

  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios", error: err.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, role, empresa } = req.body;

    let empresaAsignada = empresa;
    if (req.user.role === "admin") empresaAsignada = req.user.empresa;

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

export const actualizarUsuario = async (req, res) => {
  try {
    const updates = { ...req.body };

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

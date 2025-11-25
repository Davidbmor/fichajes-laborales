// backend/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const obtenerUsuarios = async (req, res) => {
  try {
    let filtro = {};

    // Si el usuario es admin normal, solo ver usuarios de su empresa
    if (req.user.role === "admin") {
      filtro.empresa = req.user.empresa;
    }

    const usuarios = await User.find(filtro).select("-password").populate("empresa", "nombre imagenUrl");
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios", error: err.message });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Si se incluye password, hashearla
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, role, imagenPerfil, empresa } = req.body;

    // si el creador es admin normal, forzar empresa = su empresa
    let empresaAsignada = empresa || null;
    if (req.user.role === "admin") {
      empresaAsignada = req.user.empresa;
    }

    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ message: "Email ya registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await User.create({
      nombre,
      apellidos,
      email,
      password: hashedPassword,
      role,
      imagenPerfil,
      empresa: empresaAsignada,
    });

    const userSafe = await User.findById(nuevoUsuario._id).select("-password").populate("empresa", "nombre imagenUrl");
    res.status(201).json(userSafe);
  } catch (err) {
    res.status(500).json({ message: "Error al crear usuario", error: err.message });
  }
};

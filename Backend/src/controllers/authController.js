// backend/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const register = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, role, imagenPerfil, empresa } = req.body;

    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) return res.status(400).json({ message: "Usuario ya existe" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      nombre,
      apellidos,
      email,
      password: hashed,
      role,
      imagenPerfil,
      empresa: empresa || null,
    });

    const userSafe = await User.findById(user._id).select("-password").populate("empresa", "nombre imagenUrl");

    res.status(201).json({
      user: userSafe,
      token: generarToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password").populate("empresa", "nombre imagenUrl");
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    // Si el usuario está deshabilitado o su empresa está deshabilitada, no permitir login
    if (user.habilitado === false || (user.empresa && user.empresa.habilitado === false)) {
      return res.status(403).json({ message: "Usuario deshabilitado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    const userSafe = await User.findById(user._id).select("-password").populate("empresa", "nombre imagenUrl");

    res.json({
      user: userSafe,
      token: generarToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

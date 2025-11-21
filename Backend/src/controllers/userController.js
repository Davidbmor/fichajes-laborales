import User from "../models/User.js";
import bcrypt from "bcryptjs";


export const obtenerUsuarios = async (req, res) => {
  const usuarios = await User.find().select("-password");
  res.json(usuarios);
};

export const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, { new: true });
  res.json(user);
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body;

    // Comprobar si ya existe
    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ message: "Email ya registrado" });

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json(nuevoUsuario);
  } catch (err) {
    res.status(500).json({ message: "Error al crear usuario", error: err.message });
  }
};
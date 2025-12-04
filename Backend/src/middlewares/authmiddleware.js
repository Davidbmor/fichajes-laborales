import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // populate empresa to be able to check its status
      req.user = await User.findById(decoded.id).select("-password").populate("empresa", "nombre imagenUrl habilitado");

      // bloquear si el usuario o su empresa están deshabilitados
      if (req.user && req.user.habilitado === false) return res.status(403).json({ message: "Usuario deshabilitado" });
      if (req.user && req.user.empresa && req.user.empresa.habilitado === false) return res.status(403).json({ message: "Empresa deshabilitada" });
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token no válido" });
    }
  } else {
    return res.status(401).json({ message: "No autorizado, sin token" });
  }
};

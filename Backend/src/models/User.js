// backend/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["trabajador", "admin", "global_admin"], default: "trabajador" },
    imagenPerfil: { type: String, default: "" },
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);

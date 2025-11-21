import mongoose from "mongoose";

const fichajeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tipo: { type: String, enum: ["entrada", "salida", "ausencia"], required: true },
  fecha: { type: Date, default: Date.now },
});

export default mongoose.model("Fichaje", fichajeSchema);

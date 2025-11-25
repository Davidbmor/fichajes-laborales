// backend/models/Empresa.js
import mongoose from "mongoose";

const EmpresaSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true, trim: true },
        imagenUrl: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("Empresa", EmpresaSchema);

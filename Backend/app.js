// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./src/config/db.js";
import fichajeRoutes from "./src/routes/fichajeRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";

import empresaRoutes from "./src/routes/empresaRoutes.js";



dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


app.use("/api/auth", authRoutes);
app.use("/api/fichajes", fichajeRoutes);
app.use("/api/users", userRoutes);

app.use("/api/empresas", empresaRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(` Servidor corriendo en puerto ${PORT}`));


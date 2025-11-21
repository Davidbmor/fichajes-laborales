import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";
import Fichaje from "./src/models/Fichaje.js";
import dotenv from "dotenv";

dotenv.config();

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fichajes";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error("Error conectando a MongoDB:", err));

const NUM_TRABAJADORES = 5; // puedes cambiar
const MESES_ATRAS = 3; // últimos 3 meses

const seed = async () => {
  try {
    // Limpiar DB
    await User.deleteMany();
    await Fichaje.deleteMany();
    console.log("DB limpiada");

    const usuarios = [];

    // Crear trabajadores
    for (let i = 1; i <= NUM_TRABAJADORES; i++) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      const user = await User.create({
        nombre: `Trabajador ${i}`,
        email: `trabajador${i}@test.com`,
        password: hashedPassword,
        role: "trabajador",
      });
      usuarios.push(user);
    }

    console.log(`${usuarios.length} usuarios creados`);

    // Crear fichajes para los últimos MESES_ATRAS meses
    const today = new Date();
    for (let m = 0; m < MESES_ATRAS; m++) {
      const date = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

      for (let d = 1; d <= lastDay; d++) {
        for (const user of usuarios) {
          const entrada = new Date(date.getFullYear(), date.getMonth(), d, 9, Math.floor(Math.random() * 30));
          const salida = new Date(date.getFullYear(), date.getMonth(), d, 17, Math.floor(Math.random() * 30));

          await Fichaje.create({ userId: user._id, tipo: "entrada", fecha: entrada });
          await Fichaje.create({ userId: user._id, tipo: "salida", fecha: salida });
        }
      }
    }

    console.log("Fichajes generados para los últimos 3 meses");
    process.exit();
  } catch (err) {
    console.error("Error en seed:", err);
    process.exit(1);
  }
};

seed();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Fichaje from "./src/models/Fichaje.js";
import Empresa from "./src/models/Empresa.js";

dotenv.config();

// Conexión DB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fichajes";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error conectando MongoDB:", err));

const NUM_TRABAJADORES = 6; // Totales (se repartirán entre empresas)
const MESES_ATRAS = 3;

const seed = async () => {
  try {
    console.log("🧹 Limpiando base de datos...");
    await User.deleteMany();
    await Empresa.deleteMany();
    await Fichaje.deleteMany();

    console.log("✅ Colecciones limpiadas");

    // ✅ 1️⃣ Crear Empresas
    const empresa1 = await Empresa.create({
      nombre: "TechNova",
      imagenUrl: "https://picsum.photos/200/200?random=1",
    });

    const empresa2 = await Empresa.create({
      nombre: "LogistiPro",
      imagenUrl: "https://picsum.photos/200/200?random=2",
    });

    console.log("🏢 Empresas creadas:", empresa1.nombre, empresa2.nombre);

    // ✅ 2️⃣ Crear Admin Global
    const hashedPassword = await bcrypt.hash("123456", 10);

    const adminGlobal = await User.create({
      nombre: "Juan",
      apellidos: "SuperAdmin",
      email: "admin@global.com",
      password: hashedPassword,
      role: "global_admin",
      imagenUrl: "https://picsum.photos/200/200?random=3",
      empresa: null,
    });

    console.log("🌍 Admin Global creado:", adminGlobal.email);

    // ✅ 3️⃣ Crear Admins de Empresa
    const adminEmpresa1 = await User.create({
      nombre: "Laura",
      apellidos: "Tech",
      email: "admin1@empresa.com",
      password: hashedPassword,
      role: "admin",
      empresa: empresa1._id,
      imagenUrl: "https://picsum.photos/200/200?random=4",
    });

    const adminEmpresa2 = await User.create({
      nombre: "Pedro",
      apellidos: "Logistic",
      email: "admin2@empresa.com",
      password: hashedPassword,
      role: "admin",
      empresa: empresa2._id,
      imagenUrl: "https://picsum.photos/200/200?random=5",
    });

    console.log("👨‍💼 Admins empresa creados");

    // ✅ 4️⃣ Crear trabajadores
    const trabajadores = [];

    for (let i = 1; i <= NUM_TRABAJADORES; i++) {
      const empresaAsignada = i % 2 === 0 ? empresa1 : empresa2;

      const user = await User.create({
        nombre: `Trabajador${i}`,
        apellidos: `Apellido${i}`,
        email: `trabajador${i}@test.com`,
        password: hashedPassword,
        role: "trabajador",
        empresa: empresaAsignada._id,
        imagenUrl: `https://picsum.photos/200/200?random=${10 + i}`,
      });

      trabajadores.push(user);
    }

    console.log(`👷‍♂️ ${trabajadores.length} trabajadores creados`);

    // ✅ 5️⃣ Crear fichajes últimos 3 meses
    console.log("🕒 Generando fichajes...");

    const today = new Date();
    for (let m = 0; m < MESES_ATRAS; m++) {
      const date = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      for (let d = 1; d <= lastDay; d++) {
        for (const user of trabajadores) {
          const entrada = new Date(date.getFullYear(), date.getMonth(), d, 8, Math.floor(Math.random() * 40));
          const salida = new Date(date.getFullYear(), date.getMonth(), d, 17, Math.floor(Math.random() * 40));

          await Fichaje.create({ userId: user._id, tipo: "entrada", fecha: entrada });
          await Fichaje.create({ userId: user._id, tipo: "salida", fecha: salida });
        }
      }
    }

    console.log("✅ Fichajes creados para los últimos 3 meses");

    console.log("🎉 Seed completado con éxito");
    process.exit();
  } catch (err) {
    console.error("❌ Error en seed:", err);
    process.exit(1);
  }
};

seed();

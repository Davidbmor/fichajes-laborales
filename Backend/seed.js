// ...existing code...
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Fichaje from "./src/models/Fichaje.js";
import Empresa from "./src/models/Empresa.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fichaje_laboral";

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB conectado");
}

const NUM_TRABAJADORES_POR_EMPRESA = 15;
const MESES_ATRAS = 3;

const empresasData = [
  { nombre: "AlphaCorp", imagenUrl: "https://picsum.photos/200/200?random=11" },
  { nombre: "BetaLogistics", imagenUrl: "https://picsum.photos/200/200?random=12" },
  { nombre: "GammaTech", imagenUrl: "https://picsum.photos/200/200?random=13" },
];

const seed = async () => {
  try {
    await connect();

    console.log("🧹 Limpiando colecciones...");
    await Promise.all([User.deleteMany(), Empresa.deleteMany(), Fichaje.deleteMany()]);
    console.log("✅ Colecciones limpiadas");

    // crear empresas
    const empresas = [];
    for (const e of empresasData) {
      const created = await Empresa.create(e);
      empresas.push(created);
    }
    console.log(`🏢 ${empresas.length} empresas creadas`);

    const hashedPassword = await bcrypt.hash("123456", 10);

    // crear admin global
    const globalAdmin = await User.create({
      nombre: "Global",
      apellidos: "Admin",
      email: "global@admin.com",
      password: hashedPassword,
      role: "global_admin",
      imagenPerfil: "https://picsum.photos/200/200?random=20",
      empresa: null,
    });
    console.log("🌍 Admin global creado:", globalAdmin.email);

    // crear admins y trabajadores por empresa
    const trabajadoresAll = [];
    for (let i = 0; i < empresas.length; i++) {
      const emp = empresas[i];

      // admin de empresa
      const adminEmpresa = await User.create({
        nombre: `Admin${i + 1}`,
        apellidos: emp.nombre,
        email: `admin${i + 1}@${emp.nombre.toLowerCase()}.com`,
        password: hashedPassword,
        role: "admin",
        imagenPerfil: `https://picsum.photos/200/200?random=${30 + i}`,
        empresa: emp._id,
      });
      console.log(`👨‍💼 Admin creado para ${emp.nombre}: ${adminEmpresa.email}`);

      // trabajadores
      for (let t = 1; t <= NUM_TRABAJADORES_POR_EMPRESA; t++) {
        const idx = i * NUM_TRABAJADORES_POR_EMPRESA + t;
        const trabajador = await User.create({
          nombre: `Trabajador${idx}`,
          apellidos: `Apellido${idx}`,
          email: `trabajador${idx}@${emp.nombre.toLowerCase()}.com`,
          password: hashedPassword,
          role: "trabajador",
          imagenPerfil: `https://picsum.photos/200/200?random=${100 + idx}`,
          empresa: emp._id,
        });
        trabajadoresAll.push(trabajador);
      }
      console.log(`👷 ${NUM_TRABAJADORES_POR_EMPRESA} trabajadores creados para ${emp.nombre}`);
    }

    // generar fichajes: para cada trabajador, en los últimos MESES_ATRAS meses, cada día una entrada y una salida
    console.log("🕒 Generando fichajes (entradas + salidas) para los últimos", MESES_ATRAS, "meses...");
    const today = new Date();

    // para evitar demasiadas operaciones await por cada create, acumulamos en array y hacemos insertMany por lotes
    const batch = [];
    for (const trabajador of trabajadoresAll) {
      for (let m = 0; m < MESES_ATRAS; m++) {
        const date = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

        for (let d = 1; d <= lastDay; d++) {
          // entrada ~ 08:00 +/- minutos aleatorios
          const entrada = new Date(date.getFullYear(), date.getMonth(), d, 8, Math.floor(Math.random() * 40));
          // salida ~ 17:00 +/- minutos aleatorios
          const salida = new Date(date.getFullYear(), date.getMonth(), d, 17, Math.floor(Math.random() * 40));

          batch.push({ userId: trabajador._id, tipo: "entrada", fecha: entrada });
          batch.push({ userId: trabajador._id, tipo: "salida", fecha: salida });

          // insertar por lotes cada 2000 fichajes para no saturar memoria
          if (batch.length >= 2000) {
            await Fichaje.insertMany(batch);
            batch.length = 0;
          }
        }
      }
    }

    if (batch.length > 0) {
      await Fichaje.insertMany(batch);
    }

    console.log("✅ Fichajes generados para trabajadores");

    console.log("🎉 Seed completado con éxito");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seed:", err);
    process.exit(1);
  }
};

seed();
// ...existing code...
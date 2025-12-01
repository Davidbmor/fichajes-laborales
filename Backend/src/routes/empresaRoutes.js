import express from "express";
import {
    crearEmpresa,
    obtenerEmpresas,
    actualizarEmpresa,
    eliminarEmpresa
} from "../controllers/empresaController.js";

import { protect } from "../middlewares/authmiddleware.js";
import { esGlobalAdmin } from "../middlewares/roleMiddleware.js";
import { uploadCompany } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Crear empresa con imagen
router.post("/", protect, esGlobalAdmin, uploadCompany.single("imagenPerfil"), crearEmpresa);

// Obtener empresas
router.get("/", protect, obtenerEmpresas);

// Editar empresa
router.put("/:id", protect, esGlobalAdmin, uploadCompany.single("imagenPerfil"), actualizarEmpresa);

// Eliminar empresa
router.delete("/:id", protect, esGlobalAdmin, eliminarEmpresa);

export default router;

import express from "express";
import {
    crearEmpresa,
    obtenerEmpresas,
    actualizarEmpresa,
    eliminarEmpresa,
    exportarEmpresa,
    importarEmpresa
} from "../controllers/empresaController.js";

import { protect } from "../middlewares/authmiddleware.js";
import { esGlobalAdmin } from "../middlewares/roleMiddleware.js";
import { uploadCompany } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Crear empresa con imagen
router.post("/", protect, esGlobalAdmin, uploadCompany.single("imagenPerfil"), crearEmpresa);

// Obtener empresas
router.get("/", protect, obtenerEmpresas);

// Exportar empresa (global admin)
router.get("/:id/export", protect, esGlobalAdmin, exportarEmpresa);

// Importar empresa (global admin)
router.post("/import", protect, esGlobalAdmin, uploadCompany.single("archivo"), importarEmpresa);

// Editar empresa
router.put("/:id", protect, esGlobalAdmin, uploadCompany.single("imagenPerfil"), actualizarEmpresa);

// Habilitar / deshabilitar empresa (global admin)
router.put("/:id/habilitar", protect, esGlobalAdmin, async (req, res, next) => {
    // delegar a controlador de empresa reutilizando actualizarEmpresa
    await actualizarEmpresa(req, res, next);
});

// Eliminar empresa
router.delete("/:id", protect, esGlobalAdmin, eliminarEmpresa);

export default router;

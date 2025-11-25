// backend/routes/empresaRoutes.js
import express from "express";
import { crearEmpresa, obtenerEmpresas } from "../controllers/empresaController.js";
import { protect } from "../middlewares/authmiddleware.js";
import { esGlobalAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, esGlobalAdmin, crearEmpresa);
router.get("/", protect, obtenerEmpresas);

export default router;

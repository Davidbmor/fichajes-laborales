// backend/routes/userRoutes.js
import express from "express";
import { obtenerUsuarios, actualizarUsuario, crearUsuario } from "../controllers/userController.js";
import { protect } from "../middlewares/authmiddleware.js";
import { esAdminEmpresa, esGlobalAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, obtenerUsuarios); // admin verá solo su empresa, global_admin verá todo
router.put("/:id", protect, esAdminEmpresa, actualizarUsuario);
router.post("/", protect, esAdminEmpresa, crearUsuario); // admin genera usuarios en su empresa; global_admin también puede
export default router;

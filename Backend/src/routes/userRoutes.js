import express from "express";
import {
  obtenerUsuarios,
  actualizarUsuario,
  crearUsuario
} from "../controllers/userController.js";

import { protect } from "../middlewares/authmiddleware.js";
import { esAdminEmpresa, esGlobalAdmin } from "../middlewares/roleMiddleware.js";
import { uploadUser } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, obtenerUsuarios);

// Mantener fields en la PUT (edición) porque aceptas ambos nombres
router.put(
  "/:id",
  protect,
  esAdminEmpresa,
  uploadUser.fields([
    { name: "imagenPerfil", maxCount: 1 },
    { name: "imagen", maxCount: 1 },
  ]),
  actualizarUsuario
);

// Cambiar POST a single("imagen") — el frontend envía "imagen"
router.post(
  "/",
  protect,
  uploadUser.single("imagen"), // <-- changed: usar single para poblar req.file
  crearUsuario
);

export default router;

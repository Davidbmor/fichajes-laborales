import express from "express";
import {
  obtenerUsuarios,
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario
} from "../controllers/userController.js";

import { protect } from "../middlewares/authmiddleware.js";
import { esAdminEmpresa, esGlobalAdmin } from "../middlewares/roleMiddleware.js";
import { uploadUser } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, obtenerUsuarios);

// PUT: requiere ser admin o global_admin
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

// POST: admin de empresa O global_admin pueden crear
router.post(
  "/",
  protect,
  esAdminEmpresa,
  uploadUser.single("imagen"),
  crearUsuario
);

// DELETE: requiere ser admin o global_admin
router.delete(
  "/:id",
  protect,
  esAdminEmpresa,
  eliminarUsuario
);

export default router;

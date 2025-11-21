import express from "express";
import { obtenerUsuarios, actualizarUsuario, crearUsuario } from "../controllers/userController.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/", protect, obtenerUsuarios);
router.put("/:id", protect, actualizarUsuario);


router.post("/", protect, crearUsuario);

export default router;

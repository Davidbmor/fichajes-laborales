import express from "express";
import { obtenerFichajesFiltrados, registrarFichaje } from "../controllers/fichajeController.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/", protect, obtenerFichajesFiltrados); 
router.post("/", protect, registrarFichaje); 

export default router;

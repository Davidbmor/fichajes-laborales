import multer from "multer";
import path from "path";

// --- STORAGE PARA EMPRESAS ---
const storageCompany = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/companies");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  }
});

// --- STORAGE PARA USUARIOS ---
const storageUser = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/users");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  }
});
 
export const uploadCompany = multer({ storage: storageCompany });
export const uploadUser = multer({ storage: storageUser });

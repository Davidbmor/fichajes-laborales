// backend/middlewares/roleMiddleware.js
export const esGlobalAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No autorizado" });
    if (req.user.role !== "global_admin") {
        return res.status(403).json({ message: "Solo admin global puede realizar esta acción" });
    }
    next();
};

export const esAdminEmpresa = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No autorizado" });
    if (req.user.role !== "admin" && req.user.role !== "global_admin") {
        return res.status(403).json({ message: "Acceso denegado, solo administradores" });
    }
    next();
};

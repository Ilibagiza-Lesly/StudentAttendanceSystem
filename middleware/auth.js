// ==========================================
// ATTENDEASE - AUTHENTICATION MIDDLEWARE
// ==========================================

// Every user must be signed in.
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            message: "Please log in to access this resource."
        });
    }

    next();
};

// Both administrators and lecturers have equal permissions.
// Keep this name because other existing routes may import it.
const requireAdmin = (req, res, next) => {
    return requireAuth(req, res, next);
};

module.exports = {
    requireAuth,
    requireAdmin
};
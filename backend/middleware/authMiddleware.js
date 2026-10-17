
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "Authentication required. Please log in."
        });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured.");

        return res.status(500).json({
            success: false,
            error: "Authentication is not configured."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).json({
                success: false,
                error: "Invalid or expired session. Please log in again."
            });
        }

        if (
            !decoded ||
            !Number.isInteger(decoded.id) ||
            !["student", "tutor"].includes(decoded.role)
        ) {
            return res.status(401).json({
                success: false,
                error: "Invalid authentication token."
            });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };

        next();
    });
}

function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: "You are not authorized to access this resource."
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRole
};

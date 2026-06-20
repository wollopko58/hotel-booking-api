const authorizeRole = (...aollowedRole) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if(!aollowedRole.includes(userRole)) {
            return res.status(403).json({
                message : "Access denied : insufficient permissions"
            });
        }

        next();
    }
}

module.exports = authorizeRole;


const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeaders = req.headers["authorization"];
    const token = authHeaders && authHeaders.split(" ")[1];
    if(!token) {
        return res.status(401).json({
            message : "Invalid token"
        });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if(err) {
            return res.status(403).json({
                message : "Access denied"
            });
        }

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
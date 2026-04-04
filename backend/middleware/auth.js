// backend/middleware/auth.js

const verifyUser = (req, res, next) => {
    try {
        const userHeader = req.headers['x-user'];
        if (!userHeader) {
            return res.status(401).json({ error: 'Unauthorized: No user header provided' });
        }
        req.user = JSON.parse(userHeader);
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(401).json({ error: 'Unauthorized: Invalid user format' });
    }
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: Requires one of roles [${roles.join(', ')}]` });
        }
        next();
    };
};

module.exports = { verifyUser, verifyRole };

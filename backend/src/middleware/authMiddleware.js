const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        try {
            token = req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [users] = await pool.query(
                'SELECT id, username, display_name, profile_picture_url, workspace_id, whatsapp_number FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Tidak terotorisasi, user tidak ditemukan.' });
            }
            
            const dbUser = users[0];
            req.user = {
                id: dbUser.id,
                username: dbUser.username,
                displayName: dbUser.display_name,
                profile_picture_url: dbUser.profile_picture_url,
                workspace_id: dbUser.workspace_id,
                whatsapp_number: dbUser.whatsapp_number,
                jti: decoded.jti
            };

            await pool.query(
                'UPDATE user_sessions SET last_seen = NOW() WHERE token_id = ?',
                [decoded.jti]
            );

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Tidak terotorisasi, token tidak valid.' });
        }
    }
    
    if (!token) {
        return res.status(401).json({ message: 'Tidak terotorisasi, tidak ada token.' });
    }
};

module.exports = { protect };
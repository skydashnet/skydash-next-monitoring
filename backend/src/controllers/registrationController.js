const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.requestRegisterOtp = async (req, res) => {
    const { username, displayName, password, whatsappNumber } = req.body;
    if (!username || !displayName || !password || !whatsappNumber) {
        return res.status(400).json({ message: 'Semua field harus diisi.' });
    }

    try {
        const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ? OR whatsapp_number = ?', [username, whatsappNumber]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username atau Nomor WhatsApp sudah terdaftar.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await pool.query(
            `INSERT INTO pending_registrations (whatsapp_number, username, display_name, password_hash, otp_code, expires_at) VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE username=VALUES(username), display_name=VALUES(display_name), password_hash=VALUES(password_hash), otp_code=VALUES(otp_code), expires_at=VALUES(expires_at)`,
            [whatsappNumber, username, displayName, hashedPassword, otp, expiresAt]
        );

        await sendWhatsAppMessage(whatsappNumber, `Halo ${displayName}! Kode verifikasi SkydashNET Anda adalah: *${otp}*. Kode ini berlaku selama 10 menit.`);

        res.status(200).json({ message: 'OTP telah dikirim ke nomor WhatsApp Anda.' });

    } catch (error) {
        console.error("REQUEST REGISTER OTP ERROR:", error);
        res.status(500).json({ message: 'Gagal mengirim OTP.' });
    }
};

exports.verifyAndRegister = async (req, res) => {
    const { whatsappNumber, otp } = req.body;
    if (!whatsappNumber || !otp) {
        return res.status(400).json({ message: 'Nomor WhatsApp dan OTP wajib diisi.' });
    }

    try {
        const [pending] = await pool.query('SELECT * FROM pending_registrations WHERE whatsapp_number = ? AND otp_code = ? AND expires_at > NOW()', [whatsappNumber, otp]);
        if (pending.length === 0) {
            return res.status(400).json({ message: 'OTP salah atau sudah kedaluwarsa.' });
        }

        const userData = pending[0];
        const avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userData.display_name)}`;

        const conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO users (username, display_name, password_hash, whatsapp_number, profile_picture_url) VALUES (?, ?, ?, ?, ?)',
            [userData.username, userData.display_name, userData.password_hash, userData.whatsapp_number, avatarUrl]
        );

        const [wsResult] = await conn.query('INSERT INTO workspaces (name, owner_id) VALUES (?, ?)', [`${userData.display_name}'s Workspace`, result.insertId]);
        await conn.query('UPDATE users SET workspace_id = ? WHERE id = ?', [wsResult.insertId, result.insertId]);
        await conn.query('DELETE FROM pending_registrations WHERE whatsapp_number = ?', [whatsappNumber]);

        await conn.commit();
        conn.release();

        res.status(201).json({ message: 'Registrasi berhasil! Silakan login.', userId: result.insertId });

    } catch (error) {
        console.error("VERIFY REGISTER ERROR:", error);
        res.status(500).json({ message: 'Verifikasi gagal karena server error.' });
    }
};
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.updateUserDetails = async (req, res) => {
    const { displayName } = req.body;
    if (!displayName) {
        return res.status(400).json({ message: 'Nama Display tidak boleh kosong.' });
    }
    try {
        await pool.query('UPDATE users SET display_name = ? WHERE id = ?', [displayName, req.user.id]);
        res.status(200).json({ message: 'Profil berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Semua field harus diisi dan password baru minimal 6 karakter.' });
    }
    try {
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Password lama salah.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHashedPassword, req.user.id]);

        res.status(200).json({ message: 'Password berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.updateAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }
    try {
        const avatarUrl = `/public/uploads/avatars/${req.file.filename}`;
        await pool.query('UPDATE users SET profile_picture_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
        res.status(200).json({ message: 'Foto profil berhasil diperbarui.', avatarUrl: avatarUrl });
    } catch (error) {
        res.status(500).json({ message: 'Server error saat upload avatar.' });
    }
};

exports.deleteUserAccount = async (req, res) => {
    const userId = req.user.id;
    const workspaceId = req.user.workspace_id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
        await conn.query('DELETE FROM mikrotik_devices WHERE workspace_id = ?', [workspaceId]);
        await conn.query('DELETE FROM odp_user_connections WHERE workspace_id = ?', [workspaceId]);
        await conn.query('DELETE FROM network_assets WHERE workspace_id = ?', [workspaceId]);
        await conn.query('DELETE FROM workspaces WHERE id = ?', [workspaceId]);
        await conn.query('DELETE FROM users WHERE id = ?', [userId]);
        await conn.commit();
        conn.release();
        res.clearCookie('token');
        res.status(200).json({ message: 'Akun berhasil dihapus secara permanen.' });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error("DELETE ACCOUNT ERROR:", error);
        res.status(500).json({ message: 'Gagal menghapus akun karena server error.' });
    }
};
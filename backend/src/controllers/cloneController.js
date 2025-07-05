const pool = require('../config/database');
const crypto = require('crypto');

exports.generateCode = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.status(400).json({ message: 'Anda harus punya workspace untuk membuat undangan.' });
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    try {
        await pool.query(
            'INSERT INTO workspace_invites (workspace_id, code, expires_at, created_by) VALUES (?, ?, ?, ?)',
            [workspaceId, code, expiresAt, req.user.id]
        );
        res.status(201).json({ code, expiresAt });
    } catch (error) {
        console.error("GENERATE INVITE CODE ERROR:", error);
        res.status(500).json({ message: 'Gagal membuat kode undangan', error: error.message });
    }
};

exports.useCode = async (req, res) => {
    const { code } = req.body;
    const targetUserId = req.user.id;

    if (!code) {
        return res.status(400).json({ message: 'Kode tidak boleh kosong.' });
    }

    try {
        const [invites] = await pool.query('SELECT * FROM workspace_invites WHERE code = ? AND expires_at > NOW()', [code]);
        if (invites.length === 0) {
            return res.status(400).json({ message: 'Kode tidak valid atau sudah kedaluwarsa.' });
        }
        
        const workspaceIdToJoin = invites[0].workspace_id;
        
        await pool.query('UPDATE users SET workspace_id = ? WHERE id = ?', [workspaceIdToJoin, targetUserId]);
        
        await pool.query('DELETE FROM workspace_invites WHERE code = ?', [code]);
        
        res.status(200).json({ message: 'Berhasil bergabung dengan workspace!' });
    } catch (error) {
        console.error("USE INVITE CODE ERROR:", error);
        res.status(500).json({ message: error.message || 'Gagal menggunakan kode.' });
    }
};
const pool = require('../config/database');

exports.getPools = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    try {
        const [pools] = await pool.query(
            'SELECT * FROM ip_pools WHERE workspace_id = ? ORDER BY profile_name ASC',
            [workspaceId]
        );
        res.json(pools);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data IP Pool.' });
    }
};

exports.addPool = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { profile_name, ip_start, ip_end, gateway } = req.body;
    if (!profile_name || !ip_start || !ip_end || !gateway) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    try {
        const sql = `
            INSERT INTO ip_pools (workspace_id, profile_name, ip_start, ip_end, gateway) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ip_start=VALUES(ip_start), ip_end=VALUES(ip_end), gateway=VALUES(gateway)`;
        await pool.query(sql, [workspaceId, profile_name, ip_start, ip_end, gateway]);
        res.status(201).json({ message: `IP Pool untuk profil ${profile_name} berhasil disimpan.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyimpan IP Pool.' });
    }
};

exports.deletePool = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM ip_pools WHERE id = ? AND workspace_id = ?',
            [id, workspaceId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'IP Pool tidak ditemukan.' });
        }
        res.status(200).json({ message: 'IP Pool berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus IP Pool.' });
    }
};
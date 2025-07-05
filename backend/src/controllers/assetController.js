const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');

exports.getAssets = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.json([]);
    }

    try {
        const [assets] = await pool.query(
            `SELECT id, name, type, latitude, longitude, description, splitter_count 
             FROM network_assets 
             WHERE workspace_id = ? 
             ORDER BY FIELD(type, 'Server', 'JoinBox', 'ODC', 'ODP'), LENGTH(name), name ASC`,
            [workspaceId]
        );
        res.status(200).json(assets);
    } catch (error) {
        console.error("GET ASSETS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data aset.' });
    }
};

exports.addAsset = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { name, type, latitude, longitude, description, splitter_count } = req.body;

    if (!name || !type || !latitude || !longitude) {
        return res.status(400).json({ message: 'Field yang wajib diisi tidak boleh kosong.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO network_assets (workspace_id, name, type, latitude, longitude, description, splitter_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [workspaceId, name, type, latitude, longitude, description || null, splitter_count || null]
        );
        res.status(201).json({ message: 'Aset berhasil ditambahkan', assetId: result.insertId });
    } catch (error) {
        console.error("ADD ASSET ERROR:", error);
        res.status(500).json({ message: 'Gagal menambah aset.' });
    }
};

exports.updateAsset = async (req, res) => {
    const { id } = req.params;
    const workspaceId = req.user.workspace_id;
    const { name, type, latitude, longitude, description, splitter_count } = req.body;

    if (!name || !type || !latitude || !longitude) {
        return res.status(400).json({ message: 'Field yang wajib diisi tidak boleh kosong.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE network_assets SET name = ?, type = ?, latitude = ?, longitude = ?, description = ?, splitter_count = ? WHERE id = ? AND workspace_id = ?',
            [name, type, latitude, longitude, description || null, splitter_count || null, id, workspaceId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Aset tidak ditemukan atau Anda tidak punya izin.' });
        }
        res.status(200).json({ message: 'Aset berhasil diperbarui.' });
    } catch (error) {
        console.error("UPDATE ASSET ERROR:", error);
        res.status(500).json({ message: 'Gagal memperbarui aset.' });
    }
};

exports.deleteAsset = async (req, res) => {
    const { id } = req.params;
    const workspaceId = req.user.workspace_id;

    try {
        const [result] = await pool.query(
            'DELETE FROM network_assets WHERE id = ? AND workspace_id = ?',
            [id, workspaceId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Aset tidak ditemukan atau Anda tidak punya izin.' });
        }
        res.status(200).json({ message: 'Aset berhasil dihapus.' });
    } catch (error) {
        console.error("DELETE ASSET ERROR:", error);
        res.status(500).json({ message: 'Gagal menghapus aset.' });
    }
};

exports.getAssetConnections = async (req, res) => {
    const { id } = req.params;
    const { workspace_id } = req.user;

    try {
        const [assets] = await pool.query('SELECT type FROM network_assets WHERE id = ? AND workspace_id = ?', [id, workspace_id]);
        if (assets.length === 0) {
            return res.status(404).json({ message: 'Aset tidak ditemukan.' });
        }
        const assetType = assets[0].type;
        let connections = [];
        if (assetType === 'ODP') {
            const [userConnections] = await pool.query(
                'SELECT pppoe_secret_name FROM odp_user_connections WHERE asset_id = ? AND workspace_id = ?',
                [id, workspace_id]
            );
            connections = userConnections.map(c => ({ name: c.pppoe_secret_name, type: 'user' }));
        } else if (assetType === 'ODC') {
            const [odpConnections] = await pool.query(
                'SELECT name FROM network_assets WHERE parent_asset_id = ? AND workspace_id = ?',
                [id, workspace_id]
            );
            connections = odpConnections.map(c => ({ name: c.name, type: 'ODP' }));
        }
        res.status(200).json(connections);
    } catch (error) {
        console.error("GET ASSET CONNECTIONS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data koneksi aset.' });
    }
};

exports.addAssetConnection = async (req, res) => {
    const { id: assetId } = req.params;
    const { pppoe_secret_name } = req.body;
    const { workspace_id } = req.user;
    if (!pppoe_secret_name) {
        return res.status(400).json({ message: 'Nama pengguna PPPoE wajib diisi.' });
    }
    try {
        const [existing] = await pool.query(
            'SELECT id FROM odp_user_connections WHERE workspace_id = ? AND asset_id = ? AND pppoe_secret_name = ?',
            [workspace_id, assetId, pppoe_secret_name]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `User ${pppoe_secret_name} sudah terhubung ke ODP ini.` });
        }
        const [result] = await pool.query(
            'INSERT INTO odp_user_connections (workspace_id, asset_id, pppoe_secret_name) VALUES (?, ?, ?)',
            [workspace_id, assetId, pppoe_secret_name]
        );
        res.status(201).json({ message: 'Koneksi berhasil ditambahkan', connectionId: result.insertId });
    } catch (error) {
        console.error("ADD ASSET CONNECTION ERROR:", error);
        res.status(500).json({ message: 'Gagal menambah koneksi aset.' });
    }
};

exports.getUnconnectedPppoeUsers = async (req, res) => {
    const { workspace_id } = req.user;
    try {
        const allSecrets = await runCommandForWorkspace(workspace_id, '/ppp/secret/print', ['?disabled=no']);
        const [connectedUsers] = await pool.query(
            'SELECT pppoe_secret_name FROM odp_user_connections WHERE workspace_id = ?',
            [workspace_id]
        );
        const connectedSecretNames = new Set(connectedUsers.map(c => c.pppoe_secret_name));
        const unconnectedSecrets = allSecrets.filter(secret => !connectedSecretNames.has(secret.name));
        res.status(200).json(unconnectedSecrets);
    } catch (error) {
        console.error("GET UNCONNECTED USERS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil daftar pengguna yang belum terhubung.' });
    }
};
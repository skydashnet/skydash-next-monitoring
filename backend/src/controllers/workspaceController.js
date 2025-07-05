const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');

exports.setActiveDevice = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ message: 'Device ID tidak boleh kosong.' });
    }

    try {
        await pool.query('UPDATE workspaces SET active_device_id = ? WHERE id = ?', [deviceId, workspaceId]);
        res.status(200).json({ message: 'Perangkat aktif berhasil diubah.' });
    } catch (error) {
        console.error("SET ACTIVE DEVICE ERROR:", error);
        res.status(500).json({ message: 'Gagal mengubah perangkat aktif', error: error.message });
    }
};

exports.getWorkspace = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.status(404).json({ message: 'Workspace tidak ditemukan.' });
    }
    try {
        const [workspaces] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);
        if (workspaces.length === 0) {
            return res.status(404).json({ message: 'Detail workspace tidak ditemukan.' });
        }
        res.json(workspaces[0]);
    } catch (error) {
        console.error("GET WORKSPACE ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data workspace.' });
    }
};

exports.getAvailableInterfaces = async (req, res) => {
    try {
        const interfaces = await runCommandForWorkspace(req.user.workspace_id, '/interface/print');
        const interfaceNames = interfaces.map(iface => iface.name);
        res.status(200).json(interfaceNames);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil daftar interface dari perangkat.' });
    }
};

exports.setMainInterface = async (req, res) => {
    const { interfaceName } = req.body;
    const workspaceId = req.user.workspace_id;
    if (!interfaceName) {
        return res.status(400).json({ message: 'Nama interface tidak boleh kosong.' });
    }
    try {
        await pool.query('UPDATE workspaces SET main_interface = ? WHERE id = ?', [interfaceName, workspaceId]);
        res.status(200).json({ message: 'Interface utama berhasil disimpan.' });
    } catch (error) {
        console.error("SET MAIN INTERFACE ERROR:", error);
        res.status(500).json({ message: 'Gagal menyimpan interface utama.' });
    }
};
const { runCommandForWorkspace } = require('../utils/apiConnection');
const crypto = require('crypto');

exports.getHotspotSummary = async (req, res) => {
    try {
        const workspaceId = req.user.workspace_id;
        const [users, active] = await Promise.all([
            runCommandForWorkspace(workspaceId, '/ip/hotspot/user/print'),
            runCommandForWorkspace(workspaceId, '/ip/hotspot/active/print')
        ]);
        res.json({
            totalUsers: users.length,
            activeUsers: active.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHotspotUsers = async (req, res) => {
    try {
        const users = await runCommandForWorkspace(req.user.workspace_id, '/ip/hotspot/user/print');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHotspotProfiles = async (req, res) => {
    try {
        const profiles = await runCommandForWorkspace(req.user.workspace_id, '/ip/hotspot/user/profile/print');
        res.json(profiles.map(p => p.name));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addHotspotUser = async (req, res) => {
    const { name, password, profile, timeLimit } = req.body;
    if (!name || !password || !profile) {
        return res.status(400).json({ message: 'Nama, password, dan profile wajib diisi.' });
    }
    try {
        const params = [
            `=name=${name}`,
            `=password=${password}`,
            `=profile=${profile}`
        ];
        if (timeLimit) params.push(`=limit-uptime=${timeLimit}`);

        await runCommandForWorkspace(req.user.workspace_id, '/ip/hotspot/user/add', params);
        res.status(201).json({ message: `User hotspot ${name} berhasil dibuat.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateVouchers = async (req, res) => {
    const { count, profile, length = 4 } = req.body;
    if (!count || !profile) {
        return res.status(400).json({ message: 'Jumlah dan profil wajib ditentukan.' });
    }
    if (count > 100) {
        return res.status(400).json({ message: 'Maksimal hanya bisa membuat 100 voucher sekali jalan.' });
    }

    try {
        const workspaceId = req.user.workspace_id;
        const generatedUsers = [];
        for (let i = 0; i < count; i++) {
            const randomChars = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
            const username = `v${randomChars}`;
            
            const params = [
                `=name=${username}`,
                `=password=${username}`,
                `=profile=${profile}`,
            ];
            
            await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/add', params);
            generatedUsers.push({ username, password: username });
        }
        
        res.status(201).json({ 
            message: `${count} voucher berhasil dibuat.`,
            vouchers: generatedUsers
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat voucher.', error: error.message });
    }
};

exports.setHotspotUserStatus = async (req, res) => {
    const { id } = req.params;
    const { disabled } = req.body;
    try {
        await runCommandForWorkspace(req.user.workspace_id, '/ip/hotspot/user/set', [`=.id=${id}`, `=disabled=${disabled}`]);
        res.status(200).json({ message: `User hotspot berhasil di-${disabled === 'true' ? 'disable' : 'enable'}.` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.kickHotspotUser = async (req, res) => {
    const { id } = req.params;
    try {
        await runCommandForWorkspace(req.user.workspace_id, '/ip/hotspot/active/remove', [`=.id=${id}`]);
        res.status(200).json({ message: 'Koneksi pengguna hotspot berhasil diputuskan.' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteHotspotUser = async (req, res) => {
    const { id } = req.params;
    try {
        await runCommandForWorkspace(req.user.workspace_id, '/ip/hotspot/user/remove', [
            `=.id=${id}`
        ]);
        res.status(200).json({ message: 'User hotspot berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
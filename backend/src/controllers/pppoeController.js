const { runCommandForWorkspace } = require('../utils/apiConnection');
const pool = require('../config/database');

exports.getSummary = async (req, res) => {
    try {
        const workspaceId = req.user.workspace_id;
        const [secrets, active] = await Promise.all([
            runCommandForWorkspace(workspaceId, '/ppp/secret/print'),
            runCommandForWorkspace(workspaceId, '/ppp/active/print', ['?service=pppoe'])
        ]);
        res.json({ total: secrets.length, active: active.length, inactive: secrets.length - active.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSecrets = async (req, res) => {
    try {
        const secrets = await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/print');
        res.json(secrets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getNextIp = async (req, res) => {
    const { profile } = req.query;
    const { workspace_id } = req.user;

    if (!profile) {
        return res.status(400).json({ message: 'Profil tidak boleh kosong.' });
    }

    try {
        const [pools] = await pool.query(
            'SELECT ip_start, ip_end, gateway FROM ip_pools WHERE workspace_id = ? AND profile_name = ?',
            [workspace_id, profile]
        );

        if (pools.length === 0) {
            return res.status(404).json({ message: `IP Pool untuk profil "${profile}" belum diatur.` });
        }

        const { ip_start, ip_end, gateway } = pools[0];
        
        const secrets = await runCommandForWorkspace(workspace_id, '/ppp/secret/print', [`?profile=${profile}`]);
        
        const usedIps = new Set(secrets.map(s => s['remote-address']).filter(Boolean));
        const startIp = ip_start.split('.').map(Number);
        const endIp = ip_end.split('.').map(Number);
        let nextIp = null;

        for (let i = startIp[3]; i <= endIp[3]; i++) {
            const currentIp = `${startIp[0]}.${startIp[1]}.${startIp[2]}.${i}`;
            if (!usedIps.has(currentIp) && currentIp !== gateway) {
                nextIp = currentIp;
                break;
            }
        }

        if (!nextIp) {
            return res.status(409).json({ message: 'Semua IP dalam pool ini sudah terpakai.' });
        }

        res.json({ remoteAddress: nextIp, localAddress: gateway });

    } catch (error) {
        console.error("GET NEXT IP ERROR:", error);
        res.status(500).json({ message: error.message || 'Terjadi kesalahan di server saat mencari IP.' });
    }
};

exports.addSecret = async (req, res) => {
    const { name, password, profile, service = 'pppoe', localAddress, remoteAddress } = req.body;
    if (!name || !password || !profile) {
        return res.status(400).json({ message: 'Nama, password, dan profile wajib diisi.' });
    }

    try {
        const params = [
            `=name=${name}`,
            `=password=${password}`,
            `=profile=${profile}`,
            `=service=${service}`
        ];
        if (localAddress) params.push(`=local-address=${localAddress}`);
        if (remoteAddress) params.push(`=remote-address=${remoteAddress}`);

        await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/add', params);
        res.status(201).json({ message: `Secret untuk ${name} berhasil dibuat.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfiles = async (req, res) => {
    try {
        const profiles = await runCommandForWorkspace(req.user.workspace_id, '/ppp/profile/print');
        res.json(profiles.map(p => p.name));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.setSecretStatus = async (req, res) => {
    const { id } = req.params;
    const { disabled } = req.body;
    try {
        await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/set', [`=.id=${id}`, `=disabled=${disabled}`]);
        res.status(200).json({ message: `Secret berhasil di-${disabled === 'true' ? 'disable' : 'enable'}.` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.kickActiveUser = async (req, res) => {
    const { id } = req.params;
    try {
        await runCommandForWorkspace(req.user.workspace_id, '/ppp/active/remove', [`=.id=${id}`]);
        res.status(200).json({ message: 'Koneksi pengguna berhasil diputuskan.' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSlaDetails = async (req, res) => {
    const { name } = req.params;
    const workspaceId = req.user.workspace_id;

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [downtimeResult] = await pool.query(
            `SELECT COALESCE(SUM(duration_seconds), 0) as total_downtime
            FROM downtime_events
            WHERE workspace_id = ? AND pppoe_user = ? AND start_time >= ?`,
            [workspaceId, name, thirtyDaysAgo]
        );
        const totalDowntimeSeconds = parseInt(downtimeResult[0].total_downtime, 10);

        const totalSecondsInPeriod = 30 * 24 * 60 * 60;
        const uptimeSeconds = totalSecondsInPeriod - totalDowntimeSeconds;
        const slaPercentage = (uptimeSeconds / totalSecondsInPeriod) * 100;
        const [downtimeEvents] = await pool.query(
            `SELECT start_time, duration_seconds 
             FROM downtime_events 
             WHERE workspace_id = ? AND pppoe_user = ? AND start_time >= ? AND end_time IS NOT NULL
             ORDER BY start_time DESC LIMIT 5`,
            [workspaceId, name, thirtyDaysAgo]
        );

        res.json({
            sla_percentage: slaPercentage.toFixed(4),
            total_downtime_seconds: totalDowntimeSeconds,
            recent_events: downtimeEvents
        });

    } catch (error) {
        console.error(`Error getting SLA for ${name}:`, error);
        res.status(500).json({ message: 'Gagal mengambil detail SLA.', error: error.message });
    }
};

exports.updateSecret = async (req, res) => {
    const { id } = req.params;
    const { password, profile } = req.body;
    if (!profile) {
        return res.status(400).json({ message: 'Profil wajib diisi.' });
    }
    try {
        const params = [`=.id=${id}`, `=profile=${profile}`];
        if (password) {
            params.push(`=password=${password}`);
        }
        await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/set', params);
        res.status(200).json({ message: 'Secret berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSecret = async (req, res) => {
    const { id } = req.params;
    try {
        await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/remove', [`=.id=${id}`]);
        res.status(200).json({ message: 'Secret berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const pool = require('../config/database');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

/**
 * @param {number} workspaceId
 * @param {string} command
 * @param {Array<string>} [params=[]]
 * @returns {Promise<any>}
 */
async function runCommandForWorkspace(workspaceId, command, params = []) {
    if (!workspaceId) {
        throw new Error('Workspace tidak valid.');
    }
    const [workspaces] = await pool.query('SELECT active_device_id FROM workspaces WHERE id = ?', [workspaceId]);
    if (!workspaces[0]?.active_device_id) {
        throw new Error(`Tidak ada perangkat aktif yang terkonfigurasi untuk workspace ini.`);
    }
    const deviceId = workspaces[0].active_device_id;
    const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ?', [deviceId]);
    if (devices.length === 0) {
        throw new Error(`Perangkat dengan ID ${deviceId} tidak ditemukan.`);
    }
    const device = devices[0];

    let client;
    try {
        client = new RouterOSAPI({
            host: device.host,
            user: device.user,
            password: device.password,
            port: device.port
        });

        await client.connect();
        const results = await client.write(command, params);
        return results;
    } catch (error) {
        console.error(`[API Command Error] Gagal menjalankan "${command}":`, error.message);
        throw error;
    } finally {
        if (client && client.connected) {
            client.close();
        }
    }
}

module.exports = { runCommandForWorkspace };    
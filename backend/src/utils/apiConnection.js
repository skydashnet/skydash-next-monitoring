const pool = require('../config/database');
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const { getConnection, addConnection } = require('../services/connectionManager');

async function getOrCreateConnection(workspaceId, timeout, customKey = null) {
    const connectionKey = customKey || `api-${workspaceId}`;
    let connection = getConnection(connectionKey);

    if (connection && connection.client && connection.client.connected) {
        return connection.client;
    }
    
    const [workspaces] = await pool.query('SELECT active_device_id FROM workspaces WHERE id = ?', [workspaceId]);
    if (!workspaces[0]?.active_device_id) {
        throw new Error(`Tidak ada perangkat aktif yang terkonfigurasi untuk workspace ini.`);
    }
    const deviceId = workspaces[0].active_device_id;
    const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ?', [deviceId]);
    if (devices.length === 0) throw new Error(`Perangkat dengan ID ${deviceId} tidak ditemukan.`);
    
    const device = devices[0];
    const connectionOptions = {
        host: device.host, user: device.user, port: device.port, keepalive: true
    };
    if (device.password) {
        connectionOptions.password = device.password;
    }

    const client = new RouterOSAPI(connectionOptions);
    await client.connect();

    addConnection(connectionKey, { client }, timeout);

    return client;
}

async function runCommandForWorkspace(workspaceId, command, params = []) {
    if (!workspaceId) throw new Error('Workspace tidak valid.');
    try {
        const client = await getOrCreateConnection(workspaceId);
        return await client.write(command, params);
    } catch (error) {
        console.error(`[API Command Error] Gagal menjalankan "${command}":`, error.message);
        throw error;
    }
}

module.exports = { runCommandForWorkspace, getOrCreateConnection };
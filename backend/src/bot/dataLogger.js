const pool = require('../config/database');
const { runCommandForWorkspace, getOrCreateConnection} = require('../utils/apiConnection');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const alarmState = new Map();
const lastTrafficData = new Map();

async function checkAlarms(workspaceId, device) {
    if (!alarmState.has(workspaceId)) {
        alarmState.set(workspaceId, { cpuCooldown: 0, offlineCooldown: 0 });
    }
    const state = alarmState.get(workspaceId);
    const now = Date.now();

    const [owner] = await pool.query('SELECT u.whatsapp_number FROM users u JOIN workspaces w ON u.id = w.owner_id WHERE w.id = ?', [workspaceId]);
    const waNumber = owner[0]?.whatsapp_number;
    if (!waNumber) return;

    try {
        const [resource] = await runCommandForWorkspace(workspaceId, '/system/resource/print');
        if (state.offlineCooldown !== 0) {
             const message = `✅ *PERANGKAT ONLINE* ✅\n\nKoneksi ke perangkat *${device.name}* telah pulih.`;
             await sendWhatsAppMessage(waNumber, message);
             state.offlineCooldown = 0;
        }

        const [alarms] = await pool.query('SELECT * FROM alarms WHERE workspace_id = ? AND type = "CPU_LOAD"', [workspaceId]);
        if (alarms.length > 0 && state.cpuCooldown < now) {
            const cpuLoad = parseInt(resource['cpu-load'], 10) || 0;
            if (cpuLoad > alarms[0].threshold_mbps) {
                const message = `🚨 *ALARM CPU TINGGI* 🚨\n\nPerangkat *${device.name}* mengalami lonjakan CPU mencapai *${cpuLoad}%*. Segera periksa kondisi perangkat Anda!`;
                await sendWhatsAppMessage(waNumber, message);
                state.cpuCooldown = now + 15 * 60 * 1000;
            }
        }
    } catch (error) {
        if (state.offlineCooldown < now) {
            const [alarms] = await pool.query('SELECT * FROM alarms WHERE workspace_id = ? AND type = "DEVICE_OFFLINE"', [workspaceId]);
            if (alarms.length > 0) {
                const message = `🚫 *PERANGKAT OFFLINE* 🚫\n\nAplikasi tidak dapat terhubung ke perangkat *${device.name}* (${device.host}). Silakan periksa koneksi atau kondisi perangkat.`;
                await sendWhatsAppMessage(waNumber, message);
                state.offlineCooldown = now + 30 * 60 * 1000;
            }
        }
    }
    alarmState.set(workspaceId, state);
}

async function processSlaEvents(workspaceId, currentActiveUsers) {
    const dbConnection = await pool.getConnection();
    try {
        const [usersFromDb] = await dbConnection.query('SELECT pppoe_user, is_active FROM pppoe_user_status WHERE workspace_id = ?', [workspaceId]);
        const dbStatusMap = new Map(usersFromDb.map(u => [u.pppoe_user, u.is_active]));
        const currentActiveUserSet = new Set(currentActiveUsers.map(u => u.name));

        for (const user of usersFromDb) {
            if (user.is_active && !currentActiveUserSet.has(user.pppoe_user)) {
                const [openEvents] = await dbConnection.query('SELECT id FROM downtime_events WHERE workspace_id = ? AND pppoe_user = ? AND end_time IS NULL', [workspaceId, user.pppoe_user]);
                if (openEvents.length === 0) {
                    await dbConnection.query('INSERT INTO downtime_events (workspace_id, pppoe_user, start_time) VALUES (?, ?, NOW())', [workspaceId, user.pppoe_user]);
                }
                await dbConnection.query('UPDATE pppoe_user_status SET is_active = FALSE WHERE workspace_id = ? AND pppoe_user = ?', [workspaceId, user.pppoe_user]);
            }
        }

        for (const user of currentActiveUserSet) {
            const lastDbStatus = dbStatusMap.get(user);
            if (lastDbStatus === false || lastDbStatus === undefined) {
                await dbConnection.query(`UPDATE downtime_events SET end_time = NOW(), duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW()) WHERE workspace_id = ? AND pppoe_user = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1`, [workspaceId, user]);
            }
            await dbConnection.query(`INSERT INTO pppoe_user_status (workspace_id, pppoe_user, is_active, last_seen_active) VALUES (?, ?, TRUE, NOW()) ON DUPLICATE KEY UPDATE is_active = TRUE, last_seen_active = NOW()`, [workspaceId, user]);
        }
    } finally {
        dbConnection.release();
    }
}

async function logPppoeUsage(workspaceId, client) {
    try {
        const allQueues = await client.write('/queue/simple/print');
        if (!allQueues || allQueues.length === 0) return;

        const today = new Date().toISOString().slice(0, 10);

        for (const queue of allQueues) {
            let userName = queue.name;
            if (userName.startsWith('<pppoe-') && userName.endsWith('>')) {
                userName = userName.substring(7, userName.length - 1);
            }

            const [uploadBytesStr, downloadBytesStr] = (queue.bytes || '0/0').split('/');
            const uploadBytes = BigInt(uploadBytesStr);
            const downloadBytes = BigInt(downloadBytesStr);

            if (uploadBytes === 0n && downloadBytes === 0n) continue;

            const totalBytes = uploadBytes + downloadBytes;

            const sql = `
                INSERT INTO pppoe_usage_logs (workspace_id, pppoe_user, usage_date, upload_bytes, download_bytes, total_bytes)
                VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                upload_bytes = VALUES(upload_bytes), download_bytes = VALUES(download_bytes), total_bytes = VALUES(total_bytes);
            `;
            await pool.query(sql, [
                workspaceId, userName, today,
                uploadBytes.toString(), downloadBytes.toString(), totalBytes.toString(),
                uploadBytes.toString(), downloadBytes.toString(), totalBytes.toString()
            ]);
        }
    } catch (error) {
        console.error(`[Usage Logger] Gagal mencatat pemakaian untuk workspace ${workspaceId}:`, error.message);
        throw error;
    }
}

async function logAllActiveWorkspaces() {
    try {
        const [workspaces] = await pool.query(`
            SELECT id as workspace_id, main_interface FROM workspaces WHERE active_device_id IS NOT NULL
        `);
        
        for (const workspace of workspaces) {
            try {
                const CRON_TIMEOUT = 10 * 60 * 1000;
                const client = await getOrCreateConnection(workspace.workspace_id, CRON_TIMEOUT);
                
                await Promise.all([
                    logPppoeUsage(workspace.workspace_id, client),
                    logMainInterfaceTraffic(workspace.workspace_id, client, workspace)
                ]);

            } catch(e) {
                console.error(`Gagal memproses workspace ${workspace.workspace_id}:`, e.message);
            }
        }
    } catch (error) {
        console.error("[Data Logger] Error fatal saat mengambil daftar workspace:", error);
    }
}

async function logMainInterfaceTraffic(workspaceId, client, workspaceConfig) {
    if (!workspaceConfig.main_interface) return;

    try {
        const [interfaceData] = await client.write('/interface/print', [`?name=${workspaceConfig.main_interface}`]);
        if (!interfaceData) return;

        const workspaceKey = `${workspaceId}-${interfaceData.name}`;
        const lastData = lastTrafficData.get(workspaceKey);

        const currentTx = parseInt(interfaceData['tx-byte'], 10) || 0;
        const currentRx = parseInt(interfaceData['rx-byte'], 10) || 0;

        let txUsage = 0;
        let rxUsage = 0;

        if (lastData) {
            txUsage = (currentTx < lastData.tx) ? currentTx : currentTx - lastData.tx;
            rxUsage = (currentRx < lastData.rx) ? currentRx : currentRx - lastData.rx;
        }

        lastTrafficData.set(workspaceKey, { tx: currentTx, rx: currentRx });

        if (lastData && (txUsage > 0 || rxUsage > 0)) {
            const [activePppoe, activeHotspot] = await Promise.all([
                client.write('/ppp/active/print').then(r => r.length),
                client.write('/ip/hotspot/active/print').then(r => r.length)
            ]);
            const sql = 'INSERT INTO traffic_logs (workspace_id, interface_name, tx_bytes, rx_bytes, tx_usage, rx_usage, active_users_pppoe, active_users_hotspot) VALUES ?';
            const logValues = [[
                workspaceId, interfaceData.name, currentTx, currentRx, txUsage, rxUsage, activePppoe, activeHotspot
            ]];

            await pool.query(sql, [logValues]);
        }
    } catch (error) {
        console.error(`[Traffic Logger] Gagal memonitor interface ${workspaceConfig.main_interface}:`, error.message);
        throw error;
    }
}

module.exports = { logAllActiveWorkspaces };
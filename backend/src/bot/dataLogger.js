const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');
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

async function logAllActiveWorkspaces() {
    console.log(`[Scheduler] Menjalankan tugas data logger & alarm...`);
    try {
        const [workspaces] = await pool.query(`
            SELECT d.*, w.id as workspace_id, w.main_interface 
            FROM mikrotik_devices d 
            JOIN workspaces w ON d.id = w.active_device_id
        `);
        
        for (const workspace of workspaces) {
            await checkAlarms(workspace.workspace_id, workspace);

            const [activePppoe, activeHotspot] = await Promise.all([
                runCommandForWorkspace(workspace.workspace_id, '/ppp/active/print').catch(() => []),
                runCommandForWorkspace(workspace.workspace_id, '/ip/hotspot/active/print').catch(() => [])
            ]);

            await processSlaEvents(workspace.workspace_id, activePppoe);

            if (workspace.main_interface) {
                try {
                    const result = await runCommandForWorkspace(workspace.workspace_id, '/interface/monitor-traffic', [`=interface=${workspace.main_interface}`, '=once=']).then(r => r[0]);
                    
                    if (result) {
                        const workspaceKey = `${workspace.workspace_id}-${result.name}`;
                        const lastData = lastTrafficData.get(workspaceKey);
                        const currentTx = parseInt(result['tx-bytes'], 10) || 0;
                        const currentRx = parseInt(result['rx-bytes'], 10) || 0;
                        let txUsage = 0;
                        let rxUsage = 0;
                        if (lastData) {
                            txUsage = currentTx - lastData.tx;
                            rxUsage = currentRx - lastData.rx;
                        }
                        lastTrafficData.set(workspaceKey, { tx: currentTx, rx: currentRx });
                        if (lastData) {
                            const logValues = [[
                                workspace.workspace_id,
                                result.name,
                                currentTx,
                                currentRx,
                                txUsage,
                                rxUsage,
                                activePppoe.length,
                                activeHotspot.length
                            ]];
                            const sql = 'INSERT INTO traffic_logs (workspace_id, interface_name, tx_bytes, rx_bytes, tx_usage, rx_usage, active_users_pppoe, active_users_hotspot) VALUES ?';
                            await pool.query(sql, [logValues]);
                        }
                    }
                } catch (monitorError) {
                    console.error(`Gagal memonitor interface ${workspace.main_interface}:`, monitorError.message);
                }
            }
        }
    } catch (error) {
        console.error("[Data Logger] Error fatal:", error);
    }
}

module.exports = { logAllActiveWorkspaces };
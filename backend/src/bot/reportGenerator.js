const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { runCommandForWorkspace } = require('../utils/apiConnection');

const formatDataSize = (bytes) => {
    if (!+bytes || bytes < 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatPeakBandwidth = (bytesPerMinute) => {
    if (!+bytesPerMinute || bytesPerMinute < 0) return '0 Mbps';
    const mbps = (bytesPerMinute * 8) / 60 / 1000000;
    return `${mbps.toFixed(2)} Mbps`;
};

async function generateSingleReport(workspace) {
    console.log(`[Laporan Harian] Memproses workspace: ${workspace.name} (ID: ${workspace.id})`);
    try {
        if (!workspace.main_interface) {
            console.log(`[Laporan Harian] Melewatkan workspace ${workspace.id} karena tidak ada main_interface.`);
            return;
        }

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);
        const [usageResult] = await pool.query(
            'SELECT SUM(tx_usage + rx_usage) as total_usage FROM traffic_logs WHERE workspace_id = ? AND interface_name = ? AND timestamp >= ?',
            [workspace.id, workspace.main_interface, twentyFourHoursAgo]
        );
        const totalDataUsed = (usageResult.length > 0) ? formatDataSize(usageResult[0].total_usage) : '0 B';
        const [peakData] = await pool.query(
            `SELECT (tx_usage + rx_usage) as peak_usage, (active_users_pppoe + active_users_hotspot) as users_at_peak, HOUR(timestamp) as peak_hour
             FROM traffic_logs WHERE workspace_id = ? AND interface_name = ? AND timestamp >= ?
             ORDER BY peak_usage DESC LIMIT 1`,
            [workspace.id, workspace.main_interface, twentyFourHoursAgo]
        );
        
        const peakHour = peakData.length > 0 ? `${peakData[0].peak_hour}:00` : 'N/A';
        const usersAtPeak = peakData.length > 0 ? peakData[0].users_at_peak : 0;
        const peakBandwidth = peakData.length > 0 ? formatPeakBandwidth(peakData[0].peak_usage) : '0 Mbps';
        const [snapshotPppoe, snapshotHotspot] = await Promise.all([
            runCommandForWorkspace(workspace.id, '/ppp/active/print').then(r => r.length),
            runCommandForWorkspace(workspace.id, '/ip/hotspot/active/print').then(r => r.length)
        ]);

        const today = new Date();
        const date = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        
        let report = `*Laporan Harian SkydashNET* 📈\n_Ringkasan untuk ${date}_\n\n`;
        report += `Berikut adalah analisis jaringan untuk *${workspace.name}*:\n\n`;
        report += `*📊 Analisis 24 Jam Terakhir:*\n`;
        report += `> Total Data Terpakai: *${totalDataUsed}*\n`;
        report += `> Puncak Bandwidth: *${peakBandwidth}* (sekitar jam ${peakHour})\n`;
        report += `> dengan *${usersAtPeak}* pengguna terhubung\n\n`;
        report += `*📊 Snapshot Saat Ini:*\n`;
        report += `> PPPoE Aktif: *${snapshotPppoe}* pengguna\n`;
        report += `> Hotspot Aktif: *${snapshotHotspot}* pengguna\n\n`;
        report += `_Semoga harimu lancar!_\n- Bot Analis SkydashNET`;

        await sendWhatsAppMessage(workspace.whatsapp_number, report);
    } catch (error) {
        console.error(`[Laporan Harian] Gagal membuat laporan untuk workspace ${workspace.id}:`, error.message);
    }
}

async function generateAndSendDailyReports() {
    console.log(`[Scheduler] Memulai proses laporan harian...`);
    try {
        const [workspaces] = await pool.query(`
            SELECT w.id, w.name, w.main_interface, u.whatsapp_number FROM workspaces w 
            JOIN users u ON w.owner_id = u.id 
            WHERE w.whatsapp_bot_enabled = TRUE AND u.whatsapp_number IS NOT NULL`
        );
        for (const workspace of workspaces) {
            await generateSingleReport(workspace);
        }
    } catch (error) {
        console.error("[Laporan Harian] Error fatal:", error);
    }
}

module.exports = { generateAndSendDailyReports, generateSingleReport };
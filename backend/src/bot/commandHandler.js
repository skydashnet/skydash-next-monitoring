const { sendWhatsAppMessage } = require('../services/whatsappService');
const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');

const templates = {
    error: "Waduh, ada kesalahan teknis pas ngejalanin perintah. Coba lagi nanti ya, bos.",
    notFound: (cmd) => `Perintah \`.${cmd}\` nggak gue kenal, bos. Coba ketik \`.help\` buat liat daftar perintah.`,
    userNotFound: (type, name) => `Pengguna ${type} dengan nama \`${name}\` nggak ketemu di perangkat.`,
    assetNotFound: (type, name) => `Aset ${type} dengan nama \`${name}\` nggak ketemu di database.`,
    noActiveDevice: "Gagal, bos. Belum ada perangkat aktif yang dipilih di workspace ini. Atur dulu di halaman Settings.",
    help: `*Bantuan Bot SkydashNET* 🤖

Berikut adalah daftar perintah yang tersedia:

*Pengecekan & Status*
• \`.ping\` - Cek koneksi bot ke dasbor.
• \`.log <topik?>\` - Lihat 10 log terakhir dari MikroTik.

*Manajemen Aset & Lokasi*
• \`.cek <nama_user_pppoe>\` - Cek lokasi ODP tempat user terhubung.
• \`.odp total\` - Lihat total dan daftar semua ODP.
• \`.odp <nama_odp>\` - Lihat detail ODP & pengguna terhubung.

*Manajemen Pengguna*
• \`.disable <pppoe|hotspot> <nama>\` - Nonaktifkan user.
• \`.enable <pppoe|hotspot> <nama>\` - Aktifkan user.
• \`.kick <pppoe|hotspot> <nama>\` - Putuskan koneksi user aktif.
`
};

async function handleOdpTotal(from, workspaceId) {
    try {
        const [odpAssets] = await pool.query(
            "SELECT name, description FROM network_assets WHERE workspace_id = ? AND type = 'ODP' ORDER BY name ASC",
            [workspaceId]
        );

        if (odpAssets.length === 0) {
            return sendWhatsAppMessage(from, "ℹ️ Tidak ada aset ODP yang ditemukan di workspace ini.");
        }

        let reply = `*Total ODP Terdaftar: ${odpAssets.length}*\n\n`;
        reply += "Berikut adalah daftar ODP beserta keterangannya:\n\n";

        const odpList = odpAssets.map(odp => {
            const description = odp.description ? `_${odp.description}_` : "_Tidak ada keterangan_";
            return `📍 *${odp.name}*\n   ${description}`;
        }).join('\n\n');

        reply += odpList;

        await sendWhatsAppMessage(from, reply);

    } catch (error) {
        console.error("[handleOdpTotal] Database error:", error);
        await sendWhatsAppMessage(from, templates.error);
    }
}

async function handlePing(from, user) {
    await sendWhatsAppMessage(from, `Pong! 🏓\nDasbor untuk workspace *${user.workspace_name}* aktif dan terhubung!`);
}

async function handleCheckUserLocation(from, workspaceId, userName) {
    const [connections] = await pool.query(
        `SELECT na.name, na.latitude, na.longitude FROM odp_user_connections ouc JOIN network_assets na ON ouc.asset_id = na.id WHERE ouc.workspace_id = ? AND ouc.pppoe_secret_name = ?`,
        [workspaceId, userName]
    );

    if (connections.length > 0) {
        const { name, latitude, longitude } = connections[0];
        const gmapsLink = `http://maps.google.com/maps?q=${latitude},${longitude}`;
        const reply = `✅ *Hasil Pengecekan*\n\nPengguna \`${userName}\` ditemukan terhubung di:\n\n*ODP:* \`${name}\`\n*Lokasi:* ${gmapsLink}`;
        await sendWhatsAppMessage(from, reply);
    } else {
        await sendWhatsAppMessage(from, `❌ Pengguna \`${userName}\` tidak ditemukan terhubung di ODP manapun.`);
    }
}

async function handleUserManagement(from, workspaceId, type, userName, action) {
    const service = type === 'pppoe' ? 'ppp' : 'ip/hotspot';
    const item = type === 'pppoe' ? 'secret' : 'user';

    const users = await runCommandForWorkspace(workspaceId, `/${service}/${item}/print`, [`?name=${userName}`]);
    if (users.length === 0) return sendWhatsAppMessage(from, templates.userNotFound(type, userName));
    const userId = users[0]['.id'];

    if (action === 'disable' || action === 'enable') {
        await runCommandForWorkspace(workspaceId, `/${service}/${item}/set`, [`=.id=${userId}`, `=disabled=${action === 'disable' ? 'yes' : 'no'}`]);
        await sendWhatsAppMessage(from, `✅ Berhasil! Pengguna ${type} \`${userName}\` telah di-*${action}*.`);
    } else if (action === 'kick') {
        const activePrintPath = type === 'pppoe' ? '/ppp/active/print' : '/ip/hotspot/active/print';
        const nameField = type === 'pppoe' ? 'name' : 'user';

        const activeUsers = await runCommandForWorkspace(workspaceId, activePrintPath, [`?${nameField}=${userName}`]);
        if (activeUsers.length === 0) return sendWhatsAppMessage(from, `ℹ️ Info: Pengguna \`${userName}\` sedang tidak aktif, tidak perlu di-kick.`);
        const activeId = activeUsers[0]['.id'];
        
        const removePath = type === 'pppoe' ? '/ppp/active/remove' : '/ip/hotspot/active/remove';
        await runCommandForWorkspace(workspaceId, removePath, [`=.id=${activeId}`]);
        await sendWhatsAppMessage(from, `✅ Berhasil! Koneksi pengguna \`${userName}\` telah diputuskan.`);
    }
}

async function handleGetLogs(from, workspaceId, topic) {
    const params = topic ? [`?topics=${topic},!script`] : [];
    try {
        const logs = await runCommandForWorkspace(workspaceId, '/log/print', params);
        const recentLogs = logs.slice(-10);

        if (recentLogs.length === 0) return sendWhatsAppMessage(from, `ℹ️ Tidak ditemukan log untuk topik "${topic || 'semua'}".`);

        let reply = `*Log Terbaru dari MikroTik* 📝\n`;
        if(topic) reply += `_Hanya menampilkan topik: ${topic}_\n\n`;

        const logList = recentLogs.map(log => {
            let icon = '💬';
            if (log.topics.includes('error')) icon = '❗️';
            else if (log.topics.includes('warning')) icon = '⚠️';
            return `${icon} *[${log.time}]* _${log.message}_`;
        }).join('\n------------------\n');

        reply += logList;
        await sendWhatsAppMessage(from, reply);
    } catch (e) {
        throw e;
    }
}

async function handleAssetDetail(from, workspaceId, assetName) {
    const [assets] = await pool.query(
        'SELECT * FROM network_assets WHERE workspace_id = ? AND name = ?', 
        [workspaceId, assetName]
    );

    if (assets.length === 0) {
        return sendWhatsAppMessage(from, templates.assetNotFound('Aset', assetName));
    }

    const asset = assets[0];
    const gmapsLink = `http://maps.google.com/maps?q=${asset.latitude},${asset.longitude}`;
    let reply = `*Detail Aset: ${asset.name}*\n\n`;
    reply += `*Tipe:* ${asset.type}\n`;
    reply += `*Lokasi:* ${gmapsLink}\n`;
    if (asset.description) {
        reply += `*Info:* ${asset.description}\n`;
    }
    if (asset.type === 'ODP') {
        reply += `*Splitter:* 1x${asset.splitter_count || 'N/A'}\n\n`;
        const [users] = await pool.query('SELECT pppoe_secret_name FROM odp_user_connections WHERE asset_id = ?', [asset.id]);
        reply += `*Pengguna Terhubung (${users.length}):*\n`;
        reply += users.length > 0 ? users.map(u => `> \`${u.pppoe_secret_name}\``).join('\n') : '> _Tidak ada_';
    }

    await sendWhatsAppMessage(from, reply);
}

const handleCommand = async (message, from, user) => {
    const text = message.trim();
    const args = text.split(' ');
    const command = args[0].toLowerCase().substring(1);

    try {
        switch (command) {
            case 'ping':
                await handlePing(from, user);
                break;
            case 'help':
                await sendWhatsAppMessage(from, templates.help);
                break;
            case 'cek':
                if (!args[1]) return sendWhatsAppMessage(from, "Format salah. Contoh: `.cek nama_user_pppoe`");
                await handleCheckUserLocation(from, user.workspace_id, args.slice(1).join(' '));
                break;
            case 'log':
                await handleGetLogs(from, user.workspace_id, args[1]);
                break;
            case 'odp':
                if (!args[1]) {
                    return sendWhatsAppMessage(from, "Format salah. Contoh: `.odp total` atau `.odp <nama_odp>`");
                }
                if (args[1].toLowerCase() === 'total') {
                    await handleOdpTotal(from, user.workspace_id);
                } else {
                    await handleAssetDetail(from, user.workspace_id, args.slice(1).join(' '));
                }
                break;
            case 'disable':
            case 'enable':
            case 'kick':
                if (args.length < 3) return sendWhatsAppMessage(from, `Format salah. Contoh: \`.${command} <pppoe|hotspot> nama_user\``);
                const type = args[1].toLowerCase();
                const userName = args.slice(2).join(' ');
                if (type !== 'pppoe' && type !== 'hotspot') return sendWhatsAppMessage(from, "Tipe user harus `pppoe` atau `hotspot`.");
                await handleUserManagement(from, user.workspace_id, type, userName, command);
                break;
            default:
                await sendWhatsAppMessage(from, templates.notFound(command));
                break;
        }
    } catch (e) {
        console.error(`[Command Execution Error] Perintah .${command} gagal:`, e);
        if(e.message && e.message.includes('Tidak ada perangkat aktif')) {
            await sendWhatsAppMessage(from, templates.noActiveDevice);
        } else {
            await sendWhatsAppMessage(from, templates.error);
        }
    }
};

module.exports = { handleCommand };
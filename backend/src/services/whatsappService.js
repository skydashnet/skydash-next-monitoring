const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const pool = require('../config/database');

let sock = null;

async function startWhatsApp(onMessageCallback) {
    console.log('[WhatsApp] Memulai koneksi...');
    const { state, saveCreds } = await useMultiFileAuthState('whatsapp_auth_info');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msgInfo = m.messages[0];
        if (msgInfo.key.fromMe || !msgInfo.message) return;

        const from = msgInfo.key.remoteJid.split('@')[0];
        const messageText = msgInfo.message.conversation || msgInfo.message.extendedTextMessage?.text || '';

        if (onMessageCallback && messageText && messageText.startsWith('.')) {
            try {
                const [users] = await pool.query(
                    `SELECT u.*, w.name as workspace_name, w.whatsapp_bot_enabled 
                     FROM users u 
                     JOIN workspaces w ON u.workspace_id = w.id 
                     WHERE u.whatsapp_number = ?`, 
                     [from]
                );
                
                if (users.length > 0) {
                    const user = users[0];
                    if (user.whatsapp_bot_enabled) {
                        onMessageCallback(messageText, from, user);
                    }
                }
            } catch (error) {
                console.error("[Bot] Gagal memproses pesan masuk:", error);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            console.log('[WhatsApp] Pindai QR Code ini dengan WhatsApp di HP Anda:');
            qrcode.generate(qr, { small: true });
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[WhatsApp] Koneksi ditutup, mencoba menghubungkan kembali:', shouldReconnect);
            if(shouldReconnect) {
                startWhatsApp(onMessageCallback);
            }
        } else if(connection === 'open') {
            console.log('[WhatsApp] Koneksi WhatsApp berhasil!');
        }
    });
}

async function sendWhatsAppMessage(number, message) {
    if (!sock) throw new Error('Koneksi WhatsApp belum siap.');
    const jid = `${number}@s.whatsapp.net`;
    try {
        await sock.sendMessage(jid, { text: message });
    } catch(error) {
        console.error(`[WhatsApp] Gagal mengirim pesan ke ${number}: `, error);
        throw error;
    }
}

module.exports = { startWhatsApp, sendWhatsAppMessage };
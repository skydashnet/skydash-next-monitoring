const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { generateSingleReport } = require('../bot/reportGenerator');

exports.toggleBotStatus = async (req, res) => {
    const { isEnabled } = req.body;
    const workspaceId = req.user.workspace_id;
    const { whatsapp_number: waNumber, displayName } = req.user;

    try {
        await pool.query('UPDATE workspaces SET whatsapp_bot_enabled = ? WHERE id = ?', [isEnabled, workspaceId]);
        
        if (waNumber) {
            const statusText = isEnabled ? 'diaktifkan' : 'dinonaktifkan';
            const message = `Halo ${displayName}, Bot WhatsApp untuk workspace Anda telah berhasil *${statusText}*.`;
            try {
                await sendWhatsAppMessage(waNumber, message);
            } catch (waError) {
                console.error(`[Bot Toggle] Gagal mengirim notifikasi WA ke ${waNumber}:`, waError);
            }
        }

        res.status(200).json({ message: `Bot WhatsApp telah ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengubah status bot.' });
    }
};

exports.sendTestReport = async (req, res) => {
    const { workspace_id, whatsapp_number } = req.user;
    
    try {
        const [workspaces] = await pool.query(
            'SELECT name, main_interface FROM workspaces WHERE id = ?', 
            [workspace_id]
        );
        if (workspaces.length === 0) {
            return res.status(404).json({ message: 'Workspace tidak ditemukan.' });
        }
        const workspace = {
            id: workspace_id,
            name: workspaces[0].name,
            main_interface: workspaces[0].main_interface,
            whatsapp_number: whatsapp_number
        };
        await generateSingleReport(workspace);
        
        res.status(200).json({ message: 'Pesan tes laporan berhasil dikirim ke WhatsApp Anda.' });

    } catch (error) {
        console.error("SEND TEST REPORT ERROR:", error);
        res.status(500).json({ message: 'Gagal mengirim pesan tes.' });
    }
};
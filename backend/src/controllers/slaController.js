const pool = require('../config/database');

exports.handleSlaEvent = async (req, res) => {
    const { user, status, workspace_id } = req.body;
    if (!user || !status || !workspace_id) {
        return res.status(400).send('Bad Request: Missing user, status, or workspace_id');
    }

    const dbConnection = await pool.getConnection();
    try {
        await dbConnection.beginTransaction();

        if (status === 'connected') {
            await dbConnection.query(
                `UPDATE downtime_events 
                 SET end_time = NOW(), duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW()) 
                 WHERE workspace_id = ? AND pppoe_user = ? AND end_time IS NULL 
                 ORDER BY start_time DESC LIMIT 1`,
                [workspace_id, user]
            );
        } else if (status === 'disconnected') {
            const [openEvents] = await dbConnection.query(
                'SELECT id FROM downtime_events WHERE workspace_id = ? AND pppoe_user = ? AND end_time IS NULL',
                [workspace_id, user]
            );
            if (openEvents.length === 0) {
                await dbConnection.query(
                    'INSERT INTO downtime_events (workspace_id, pppoe_user, start_time) VALUES (?, ?, NOW())',
                    [workspace_id, user]
                );
            }
        }

        await dbConnection.commit();
        res.status(200).send('OK');

    } catch (error) {
        await dbConnection.rollback();
        console.error('[SLA Event Handler] Database error:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        dbConnection.release();
    }
};
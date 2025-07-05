const express = require('express');
const http = require('http');
const helmet = require('helmet');
const WebSocket = require('ws');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cron = require('node-cron');

const { startWhatsApp } = require('./src/services/whatsappService');
const { handleCommand } = require('./src/bot/commandHandler');
const { generateAndSendDailyReports } = require('./src/bot/reportGenerator');
const { logAllActiveWorkspaces } = require('./src/bot/dataLogger');

let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

const pool = require('./src/config/database');
const { addConnection, removeConnection, getConnection } = require('./src/services/connectionManager');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const pppoeRoutes = require('./src/routes/pppoeRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const cloneRoutes = require('./src/routes/cloneRoutes');
const hotspotRoutes = require('./src/routes/hotspotRoutes');
const importRoutes = require('./src/routes/importRoutes');
const registrationRoutes = require('./src/routes/registrationRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const ipPoolRoutes = require('./src/routes/ipPoolRoutes');
const botRoutes = require('./src/routes/botRoutes');

const app = express();
const server = http.createServer(app);

app.use(helmet());

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/public', express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/pppoe', pppoeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/clone', cloneRoutes);
app.use('/api/hotspot', hotspotRoutes);
app.use('/api/import', importRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/ip-pools', ipPoolRoutes);
app.use('/api/bot', botRoutes);

const wss = new WebSocket.Server({ server, path: "/ws" });

function broadcastToWorkspace(workspaceId, data) {
    wss.clients.forEach((client) => {
        if (client.workspaceId === workspaceId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function stopWorkspaceMonitoring(workspaceId) {
    const connection = getConnection(workspaceId);
    if (connection) {
        clearInterval(connection.intervalId);
        if (connection.client && connection.client.connected) connection.client.close();
        removeConnection(workspaceId);
    }
}

async function startWorkspaceMonitoring(workspaceId) {
    if (getConnection(workspaceId)?.client?.connected) return;
    
    let client;
    try {
        const [workspaces] = await pool.query('SELECT active_device_id FROM workspaces WHERE id = ?', [workspaceId]);
        if (!workspaces[0]?.active_device_id) return;
        
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ?', [workspaces[0].active_device_id]);
        if (devices.length === 0) return;
        
        const device = devices[0];
        client = new RouterOSAPI({ host: device.host, user: device.user, password: device.password || '', port: device.port, keepalive: true });
        
        await client.connect();

        const runMonitoringCycle = async () => {
            if (!client?.connected) return stopWorkspaceMonitoring(workspaceId);
            try {
                const [resource, pppoeActive, hotspotActive, allInterfaces] = await Promise.all([
                    client.write('/system/resource/print').then(r => r[0] || {}),
                    client.write('/ppp/active/print'),
                    client.write('/ip/hotspot/active/print'),
                    client.write('/interface/print'),
                ]);
                
                const interfacesToMonitor = allInterfaces
                    .filter(iface => iface.type === 'ether' || iface.type === 'wlan')
                    .map(iface => iface.name);

                const trafficPromises = interfacesToMonitor.map(name => 
                    client.write('/interface/monitor-traffic', [`=interface=${name}`, '=once=']).then(r => r[0])
                );

                const trafficResults = await Promise.all(trafficPromises);
                const trafficUpdateBatch = {};
                trafficResults.forEach(result => {
                    if (result) trafficUpdateBatch[result.name] = result;
                });
                
                const batchPayload = { resource, pppoeActive, hotspotActive, traffic: trafficUpdateBatch };
                broadcastToWorkspace(workspaceId, { type: 'batch-update', payload: batchPayload });
                
            } catch (cycleError) {
                stopWorkspaceMonitoring(workspaceId);
            }
        };

        const intervalId = setInterval(runMonitoringCycle, 2000); 
        addConnection(workspaceId, { client, intervalId, userCount: 0 });

    } catch (connectError) {
        if (client?.connected) client.close();
    }
}

wss.on('connection', async (ws, req) => {
    try {
        const cookie = (req.headers.cookie || '').split('; ').find(c => c.startsWith('token='));
        if (!cookie) return ws.close();
        
        const token = cookie.split('=')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await pool.query('SELECT workspace_id FROM users WHERE id = ?', [decoded.id]);
        if (!users[0]?.workspace_id) return ws.close();

        ws.workspaceId = users[0].workspace_id;
        
        let connection = getConnection(ws.workspaceId);
        if (!connection) {
            await startWorkspaceMonitoring(ws.workspaceId);
            connection = getConnection(ws.workspaceId);
        }
        if (connection) connection.userCount = (connection.userCount || 0) + 1;
        
        ws.on('close', () => {
            if (ws.workspaceId && connection) {
                connection.userCount--;
                if (connection.userCount <= 0) stopWorkspaceMonitoring(ws.workspaceId);
            }
        });
    } catch (error) {
        ws.close();
    }
});

const PORT = process.env.PORT || 9494;
server.listen(PORT, () => {
    console.log(`Server backend berjalan di port ${PORT}`);
    
    cron.schedule('* * * * *', logAllActiveWorkspaces);

    cron.schedule('0 0 * * *', generateAndSendDailyReports, {
        timezone: "Asia/Jakarta"
    });
});

startWhatsApp(handleCommand).catch(err => {
    console.error("Gagal memulai WhatsApp Service:", err);
});
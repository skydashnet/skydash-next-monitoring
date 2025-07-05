const RouterOSAPI = require('node-routeros').RouterOSAPI;

/**
 * @param {object} device
 * @param {function} onData
 * @param {function} onError
 * @returns {Promise<RouterOSAPI>}
 */
async function listenToInterfaceTraffic(device, onData, onError) {
    const client = new RouterOSAPI({
        host: device.host,
        user: device.user,
        password: device.password,
        port: device.port,
        keepalive: true
    });

    try {
        await client.connect();
        console.log(`[Listener] Berhasil terhubung ke ${device.name} untuk memantau traffic.`);
        const interfaces = await client.write('/interface/print');
        const interfaceNames = interfaces.map(iface => iface.name).join(',');
        client.write('/interface/monitor-traffic', [`=interface=${interfaceNames}`, '=once='])
            .then((results) => {
                results.on('data', (data) => {
                    onData(data.attributes);
                });
                results.on('error', (err) => {
                    console.error('[Listener] Stream error:', err);
                    onError(err);
                    client.close();
                });
                results.on('done', () => {
                    console.log('[Listener] Selesai memantau.');
                    client.close();
                });
            })
            .catch(err => {
                console.error('[Listener] Gagal memulai monitor-traffic:', err);
                onError(err);
                client.close();
            });

        return client;

    } catch (error) {
        console.error(`[Listener] Gagal terhubung ke ${device.name}:`, error.message);
        onError(error);
        throw error;
    }
}

module.exports = { listenToInterfaceTraffic };
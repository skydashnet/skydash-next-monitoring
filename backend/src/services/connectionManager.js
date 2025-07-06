const workspaceConnections = new Map();

const DEFAULT_IDLE_TIMEOUT = 5 * 60 * 1000;

function setIdleTimeout(workspaceId, connection, timeout) {
    if (connection.idleTimer) {
        clearTimeout(connection.idleTimer);
    }
    connection.idleTimer = setTimeout(() => {
        console.log(`[Connection Manager] Menutup koneksi idle untuk workspace ${workspaceId} setelah ${timeout/1000} detik.`);
        if (connection.client && connection.client.connected) {
            connection.client.close();
        }
        workspaceConnections.delete(workspaceId);
    }, timeout);
}

const getConnection = (workspaceId) => {
    const conn = workspaceConnections.get(workspaceId);
    if (conn) {
        setIdleTimeout(workspaceId, conn, conn.timeout || DEFAULT_IDLE_TIMEOUT);
    }
    return conn;
};

const addConnection = (workspaceId, connectionData, timeout = DEFAULT_IDLE_TIMEOUT) => {
    const conn = { ...connectionData, timeout };
    setIdleTimeout(workspaceId, conn, timeout);
    workspaceConnections.set(workspaceId, conn);
    console.log(`[Connection Manager] Koneksi untuk workspace ${workspaceId} didaftarkan dengan timeout ${timeout/1000} detik.`);
};

const removeConnection = (workspaceId) => {
    const connection = workspaceConnections.get(workspaceId);
    if (connection) {
        console.log(`[Connection Manager] Menghapus koneksi untuk workspace ID: ${workspaceId}`);
        clearTimeout(connection.idleTimer);
        if (connection.client && connection.client.connected) {
            connection.client.close().catch(err => console.error("Error saat menutup koneksi:", err));
        }
        workspaceConnections.delete(workspaceId);
    }
};

module.exports = {
    getConnection,
    addConnection,
    removeConnection,
};
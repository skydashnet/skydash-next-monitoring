const xml2js = require('xml2js');
const pool = require('../config/database');

exports.importKml = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    try {
        const kmlContent = req.file.buffer.toString('utf8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(kmlContent);
        const ALLOWED_TYPES = ['ODC', 'ODP', 'JoinBox', 'Server'];
        
        const folders = result.kml.Document.Folder;
        if (!folders) {
            throw new Error('Format KML tidak valid atau tidak memiliki struktur Folder.');
        }

        const assetsToInsert = [];
        const folderArray = Array.isArray(folders) ? folders : [folders];

        for (const folder of folderArray) {
            const assetType = folder.name;
            if (!ALLOWED_TYPES.includes(assetType)) {
                console.log(`[KML Import] Mengabaikan folder tidak dikenal: ${assetType}`);
                continue;
            }

            if (!folder.Placemark) continue;
            
            const placemarkArray = Array.isArray(folder.Placemark) ? folder.Placemark : [folder.Placemark];

            for (const placemark of placemarkArray) {
                if (placemark.Point && placemark.Point.coordinates) {
                    const [longitude, latitude] = placemark.Point.coordinates.trim().split(',');
                    assetsToInsert.push([
                        workspaceId,
                        placemark.name || 'Aset Tanpa Nama',
                        assetType,
                        parseFloat(latitude),
                        parseFloat(longitude),
                        placemark.description || null,
                    ]);
                }
            }
        }
        
        if (assetsToInsert.length === 0) {
            return res.status(400).json({ message: 'Tidak ada aset valid yang bisa diimpor dari file KML ini.' });
        }

        const query = 'INSERT INTO network_assets (workspace_id, name, type, latitude, longitude, description) VALUES ?';
        await pool.query(query, [assetsToInsert]);

        res.status(200).json({ message: `Berhasil mengimpor ${assetsToInsert.length} aset.` });

    } catch (error) {
        console.error("KML IMPORT ERROR:", error);
        res.status(500).json({ message: 'Gagal memproses file KML.', error: error.message });
    }
};
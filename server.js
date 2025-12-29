const express = require('express');
const bodyParser = require('body-parser');
const cameraManager = require('./services/cameraManager');
const path = require('path');

const app = express();

// FIX: Pass the 'app' instance to rtsp-relay to attach the .ws() method
const { proxy } = require('rtsp-relay')(app);

const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// RTSP Stream Proxy
// Now app.ws is defined because we passed 'app' to rtsp-relay above
app.ws('/api/stream', (ws, req) => {
    try {
        // Get the active service (Amba or Mstar)
        const service = cameraManager.getService();
        
        console.log(`Starting stream from: ${service.rtspUrl}`);
        
        // Proxy the RTSP stream to the WebSocket
        proxy({
            url: service.rtspUrl,
            verbose: true, // Set to true to see FFmpeg logs in console
            transport: 'tcp', // TCP is more reliable for dashcams than UDP
            additionalFlags: ['-q', '1'] // Optional: lower latency flags
        })(ws);
    } catch (e) {
        console.error("Stream Error:", e.message);
        ws.close();
    }
});

// API Routes
app.post('/api/detect', async (req, res) => {
    try {
        const result = await cameraManager.detectAndConnect();
        res.json(result);
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

app.get('/api/files', async (req, res) => {
    try {
        const type = req.query.type || 'video';
        // Normalize type for Mstar
        let mstarType = 'Normal';
        if(type === 'event') mstarType = 'Event';
        if(type === 'photo') mstarType = 'Photo';
        
        const svc = cameraManager.getService();
        const result = await svc.getFileList(cameraManager.platform === 'Mstar' ? mstarType : type);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const result = await cameraManager.getService().getSettings();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        const result = await cameraManager.getService().setSetting(key, value);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/photo', async (req, res) => {
    try {
        const result = await cameraManager.getService().takePhoto();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`KAWA Controller running at http://localhost:${PORT}`);
});
const express = require('express');
const bodyParser = require('body-parser');
const cameraManager = require('./services/cameraManager');
const path = require('path');

const app = express();
// Pass 'app' to rtsp-relay to attach the .ws() method
const { proxy } = require('rtsp-relay')(app);

const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// RTSP Stream Proxy
app.ws('/api/stream', (ws, req) => {
    try {
        const service = cameraManager.getService();
        console.log(`Streaming from: ${service.rtspUrl}`);
        proxy({
            url: service.rtspUrl,
            verbose: false,
            transport: 'tcp'
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
    } catch (e) { res.status(404).json({ error: e.message }); }
});

app.get('/api/files', async (req, res) => {
    try {
        const type = req.query.type || 'video';
        let mstarType = 'Normal';
        if(type === 'event') mstarType = 'Event';
        if(type === 'photo') mstarType = 'Photo';
        
        const svc = cameraManager.getService();
        const result = await svc.getFileList(cameraManager.platform === 'Mstar' ? mstarType : type);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/settings', async (req, res) => {
    try {
        const result = await cameraManager.getService().getSettings();
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        const result = await cameraManager.getService().setSetting(key, value);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/action/photo', async (req, res) => {
    try {
        const result = await cameraManager.getService().takePhoto();
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/system/time', async (req, res) => {
    try {
        const result = await cameraManager.getService().syncTime();
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/system/info', async (req, res) => {
    try {
        const svc = cameraManager.getService();
        const [info, sd] = await Promise.all([
            svc.getDeviceInfo(),
            svc.getSdInfo()
        ]);
        res.json({ info, sd });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/system/format', async (req, res) => {
    try {
        const result = await cameraManager.getService().formatSdCard();
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/system/reset', async (req, res) => {
    try {
        const result = await cameraManager.getService().factoryReset();
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
    console.log(`KAWA Controller running at http://localhost:${PORT}`);
});
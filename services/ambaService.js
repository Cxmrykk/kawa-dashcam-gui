const net = require('net');

class AmbaService {
    constructor() {
        this.ip = '192.168.42.1';
        this.port = 7878;
        this.rtspUrl = `rtsp://${this.ip}/live`;
        this.client = new net.Socket();
        this.token = 0;
        this.connected = false;
        this.heartbeatInterval = null;
        this.responseQueue = [];
    }

    async isAvailable() {
        return new Promise((resolve) => {
            const s = new net.Socket();
            s.setTimeout(2000);
            s.on('connect', () => { s.destroy(); resolve(true); });
            s.on('error', () => { s.destroy(); resolve(false); });
            s.on('timeout', () => { s.destroy(); resolve(false); });
            s.connect(this.port, this.ip);
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.client.connect(this.port, this.ip, () => {
                this.connected = true;
                this.send({ token: 0, msg_id: 257 }); // Start Session
            });

            this.client.on('data', (data) => {
                try {
                    const str = data.toString();
                    // Handle concatenated JSON packets
                    const parts = str.split('}{').map((p, i, a) => {
                        if(a.length > 1) {
                            if(i === 0) return p + '}';
                            if(i === a.length - 1) return '{' + p;
                            return '{' + p + '}';
                        }
                        return p;
                    });
                    parts.forEach(p => { try { this.handleResponse(JSON.parse(p)); } catch(e){} });
                } catch (e) { console.error(e); }
            });

            this.client.on('close', () => { this.connected = false; this.stopHeartbeat(); });
            this.client.on('error', (err) => reject(err));
            setTimeout(resolve, 1000);
        });
    }

    handleResponse(json) {
        if (json.msg_id === 257 && json.rval === 0) {
            this.token = json.param;
            this.startHeartbeat();
        }
        if (this.responseQueue.length > 0) {
            const req = this.responseQueue.shift();
            req.resolve(json);
        }
    }

    send(cmdObj) {
        return new Promise((resolve, reject) => {
            if (!this.connected && cmdObj.msg_id !== 257) return reject("Not connected");
            if (cmdObj.msg_id !== 257) cmdObj.token = this.token;
            this.responseQueue.push({ resolve, reject });
            this.client.write(JSON.stringify(cmdObj));
        });
    }

    startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            this.client.write(JSON.stringify({ token: this.token, msg_id: 134217753 }));
        }, 3000);
    }

    stopHeartbeat() { if (this.heartbeatInterval) clearInterval(this.heartbeatInterval); }

    async getFileList(type = 'video') {
        const res = await this.send({ token: this.token, msg_id: 268435458, type: type });
        if(res && res.listing) {
            return res.listing.map(f => {
                // FIX: Check filename, then name, then fallback to generic
                const fileName = f.filename || f.name || `Unknown_${Date.now()}`;
                
                return {
                    name: fileName,
                    date: f.date,
                    url: `http://${this.ip}/SD0/${type === 'video' ? 'Video' : 'Photo'}/${fileName}`
                };
            });
        }
        return [];
    }

    async getSettings() { return this.send({ token: this.token, msg_id: 3 }); }
    async setSetting(type, param) { return this.send({ token: this.token, msg_id: 2, type, param }); }
    async takePhoto() { return this.send({ token: this.token, msg_id: 769 }); }
    
    // Amba placeholders for system commands
    async syncTime() { return { status: "Not implemented" }; }
    async getSdInfo() { return { status: "Check Settings" }; }
    async formatSdCard() { return { status: "Not implemented" }; }
    async factoryReset() { return this.send({ token: this.token, msg_id: 2, type: "Apk_default", param: "yes" }); }
    async getDeviceInfo() { return { status: "Check Settings" }; }
}
module.exports = new AmbaService();
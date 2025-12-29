const ambaService = require('./ambaService');
const mstarService = require('./mstarService');

class CameraManager {
    constructor() {
        this.activeService = null;
        this.platform = null;
    }

    async detectAndConnect() {
        if (await ambaService.isAvailable()) {
            this.platform = 'Amba';
            this.activeService = ambaService;
            await ambaService.connect();
            return { platform: 'Amba', rtsp: ambaService.rtspUrl };
        }
        if (await mstarService.isAvailable()) {
            this.platform = 'Mstar';
            this.activeService = mstarService;
            await mstarService.login();
            return { platform: 'Mstar', rtsp: mstarService.rtspUrl };
        }
        throw new Error("No camera detected.");
    }

    getService() {
        if (!this.activeService) throw new Error("Not connected");
        return this.activeService;
    }
}
module.exports = new CameraManager();
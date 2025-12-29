const ambaService = require('./services/ambaService');
const mstarService = require('./services/mstarService');

class CameraManager {
    constructor() {
        this.activeService = null;
        this.platform = null; // 'Amba' or 'Mstar'
    }

    async detectAndConnect() {
        console.log("Detecting Camera...");

        // Check Amba IP (192.168.42.1)
        if (await ambaService.isAvailable()) {
            console.log("Ambarella Device Detected.");
            this.platform = 'Amba';
            this.activeService = ambaService;
            await ambaService.connect();
            return { platform: 'Amba', status: 'Connected' };
        }

        // Check Mstar IP (192.168.0.1)
        if (await mstarService.isAvailable()) {
            console.log("Mstar Device Detected.");
            this.platform = 'Mstar';
            this.activeService = mstarService;
            await mstarService.login();
            return { platform: 'Mstar', status: 'Connected' };
        }

        throw new Error("No camera detected. Connect to the Dashcam WiFi.");
    }

    getService() {
        if (!this.activeService) {
            throw new Error("Camera not connected. Call /detect first.");
        }
        return this.activeService;
    }
}

module.exports = new CameraManager();
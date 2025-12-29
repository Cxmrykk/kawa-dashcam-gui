const axios = require('axios');
const CgiUtils = require('../utils/cgiUtils');

class MstarService {
    constructor() {
        this.ip = '192.168.0.1';
        this.baseUrl = `http://${this.ip}/cgi-bin`;
        this.rtspUrl = `rtsp://${this.ip}/liveRTSP/av4`; // Standard Mstar RTSP
        this.token = "";
    }

    async isAvailable() {
        try {
            await axios.get(`${this.baseUrl}/getComm.cgi`, { timeout: 2000 });
            return true;
        } catch (e) { return false; }
    }

    async login() {
        try {
            // Attempt to get a session/token
            const cmd = `${this.baseUrl}/client.cgi?&-operation=login&-ip=192.168.0.2`;
            const signedUrl = CgiUtils.signCommand(cmd, "");
            await axios.get(signedUrl);
            return true;
        } catch (e) { return false; }
    }

    async getFileList(type = 'Normal') {
        // Mstar returns a JSON object with a 'file' array
        const cmd = `${this.baseUrl}/getAllVideoInfo.cgi?&-type=${type}`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        const response = await axios.get(signedUrl);
        
        // Normalize data for frontend
        if(response.data && response.data.file) {
            return response.data.file.map(f => ({
                name: f.name,
                path: f.path, // /mnt/mmc/Normal/Front/FILE.mp4
                size: f.size,
                time: f.time,
                // Construct HTTP download URL
                url: `http://${this.ip}${f.path}`,
                // Mstar usually has thumbnails at specific paths, but we'll use a generic icon for now
                // or construct it if the path is known (e.g. replace .mp4 with .jpg in thumb folder)
                thumbnail: null 
            }));
        }
        return [];
    }

    async getSettings() {
        const cmd = `${this.baseUrl}/getAllSettings.cgi?`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        const response = await axios.get(signedUrl);
        return response.data; // Returns raw Mstar settings object
    }

    async setSetting(key, value) {
        const cmd = `${this.baseUrl}/setComm.cgi?&-type=${key}&-value=${value}`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        const response = await axios.get(signedUrl);
        return response.data;
    }

    async takePhoto() {
        const cmd = `${this.baseUrl}/workmodeCmd.cgi?-cmd=trigger`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }
}
module.exports = new MstarService();
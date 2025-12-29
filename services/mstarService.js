const axios = require('axios');
const CgiUtils = require('../utils/cgiUtils');

class MstarService {
    constructor() {
        this.ip = '192.168.0.1';
        this.baseUrl = `http://${this.ip}/cgi-bin`;
        this.rtspUrl = `rtsp://${this.ip}/liveRTSP/av4`;
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
            // Mstar login usually sets a session cookie or enables the IP
            const cmd = `${this.baseUrl}/client.cgi?&-operation=login&-ip=192.168.0.2`;
            const signedUrl = CgiUtils.signCommand(cmd, "");
            await axios.get(signedUrl);
            return true;
        } catch (e) { return false; }
    }

    async getFileList(type = 'Normal') {
        const cmd = `${this.baseUrl}/getAllVideoInfo.cgi?&-type=${type}`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        const response = await axios.get(signedUrl);
        
        if(response.data && response.data.file) {
            return response.data.file.map(f => {
                // FIX: If f.name is undefined, extract it from f.path
                // e.g. "/mnt/mmc/Normal/Front/20230101.mp4" -> "20230101.mp4"
                const fileName = f.name || f.path.split('/').pop();

                return {
                    name: fileName,
                    path: f.path,
                    size: f.size,
                    time: f.time,
                    url: `http://${this.ip}${f.path}`
                };
            });
        }
        return [];
    }

    async getSettings() {
        const cmd = `${this.baseUrl}/getAllSettings.cgi?`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async setSetting(key, value) {
        const cmd = `${this.baseUrl}/setComm.cgi?&-type=${key}&-value=${value}`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async syncTime() {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        
        const cmd = `${this.baseUrl}/setSysTime.cgi?&-time=${timeStr}`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async getSdInfo() {
        const cmd = `${this.baseUrl}/getSDInfo.cgi?`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async formatSdCard() {
        const cmd = `${this.baseUrl}/sdCmd.cgi?&-format`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async factoryReset() {
        const cmd = `${this.baseUrl}/reset.cgi?`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async getDeviceInfo() {
        const cmd = `${this.baseUrl}/getDeviceAttr.cgi?`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }

    async takePhoto() {
        const cmd = `${this.baseUrl}/workmodeCmd.cgi?-cmd=trigger`;
        const signedUrl = CgiUtils.signCommand(cmd, this.token);
        return (await axios.get(signedUrl)).data;
    }
}
module.exports = new MstarService();
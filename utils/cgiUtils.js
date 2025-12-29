const crypto = require('crypto');

class CgiUtils {
    static signCommand(commandUrl, token = "") {
        const timestamp = Date.now();
        let urlWithTime = `${commandUrl}&-timestamp=${timestamp}`;
        let strSubstring;

        if (commandUrl.includes("deleteFile.cgi")) {
            const index = urlWithTime.indexOf("deleteFile.cgi");
            strSubstring = urlWithTime.substring(index);
        } else {
            const parts = urlWithTime.split('/');
            strSubstring = parts[parts.length - 1];
        }

        const rawString = strSubstring + token;
        const signKey = crypto.createHash('md5').update(rawString).digest('hex').toUpperCase();
        return `${urlWithTime}&-signkey=${signKey}`;
    }
}
module.exports = CgiUtils;
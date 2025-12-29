### Overview

This is a reverse engineered barebones interface for connecting to **KAWA** brand dashcams commonly found on Amazon/eBay. Essentially I didn't want to deal with the telemetry and headaches using the official app (first time opening - asks for your precise location, phones home, etc.) so I whipped up this interface using Gemini.

### Setup
```sh
npm install
node server.js
```

1. Connect to the dashcam's WiFi network (press the WiFi button - "KAWA" or similar name prefixed)
2. Use your browser to access `localhost:3000`
3. Press the "Connect" button.

### Disclaimer

Author takes no responsibility for any misadventure. Run this software at your own risk. Provided for educational purposes only.
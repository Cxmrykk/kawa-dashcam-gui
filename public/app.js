let player = null;

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if(document.getElementById('connectBtn').innerText === "Connected") {
        if(tabId === 'settings') loadSettings();
        if(tabId === 'system') loadSystemInfo();
    }
}

async function connectCamera() {
    const statusEl = document.getElementById('connectionStatus');
    const btn = document.getElementById('connectBtn');
    statusEl.innerText = "Connecting...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/detect', { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
            statusEl.innerText = `Connected (${data.platform})`;
            statusEl.className = "status connected";
            btn.innerText = "Connected";
            startStream();
            loadSettings();
            loadSystemInfo();
        } else {
            throw new Error(data.error);
        }
    } catch (e) {
        statusEl.innerText = "Failed: " + e.message;
        statusEl.className = "status disconnected";
        btn.disabled = false;
    }
}

function startStream() {
    const canvas = document.getElementById('videoCanvas');
    const url = 'ws://' + document.location.hostname + ':3000/api/stream';
    if (player) player.destroy();
    player = new JSMpeg.Player(url, { canvas: canvas });
}

async function loadGallery() {
    const type = document.getElementById('fileType').value;
    const grid = document.getElementById('fileGrid');
    grid.innerHTML = '<p class="placeholder-text">Loading...</p>';

    try {
        const res = await fetch(`/api/files?type=${type}`);
        const files = await res.json();
        grid.innerHTML = '';
        if(files.length === 0) grid.innerHTML = '<p class="placeholder-text">No files found.</p>';
        
        files.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-card';
            div.innerHTML = `
                <div class="file-icon">${type === 'photo' ? '🖼️' : '🎬'}</div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-name" style="color:#666; font-size:11px">${file.time || file.date || ''}</div>
                    <a href="${file.url}" class="download-link" target="_blank">Download</a>
                </div>
            `;
            grid.appendChild(div);
        });
    } catch (e) { grid.innerHTML = '<p>Error loading files.</p>'; }
}

async function loadSettings() {
    const list = document.getElementById('settingsList');
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        list.innerHTML = '';

        // Filter out system objects and the 'end' terminator
        const ignoredKeys = ['devinfo', 'WifiInfo', 'status', 'end'];
        
        const entries = Object.entries(data).filter(([key, val]) => {
            return !ignoredKeys.includes(key);
        });

        entries.forEach(([key, val]) => {
            if (typeof val === 'object' && val !== null && val.value) {
                createSettingInput(list, key, val.value, val.item);
            } else if (typeof val !== 'object') {
                createSettingInput(list, key, val, null);
            }
        });
    } catch (e) { console.error(e); }
}

function createSettingInput(container, key, currentValue, options) {
    const div = document.createElement('div');
    div.className = 'setting-item';
    
    // Clean up key name (e.g. "Camera.AutoRot" -> "Camera Auto Rot")
    const label = key.replace('.', ' ').replace(/([A-Z])/g, ' $1').trim();

    let inputHtml = '';
    if (options && Array.isArray(options)) {
        const opts = options.map(o => `<option value="${o}" ${o === currentValue ? 'selected' : ''}>${o}</option>`).join('');
        inputHtml = `<select class="setting-value" onchange="updateSetting('${key}', this.value)">${opts}</select>`;
    } else {
        inputHtml = `<span class="setting-value" style="color:#888">${currentValue}</span>`;
    }

    div.innerHTML = `<span class="setting-label">${label}</span> ${inputHtml}`;
    container.appendChild(div);
}

async function updateSetting(key, value) {
    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
}

async function takePhoto() {
    await fetch('/api/action/photo', { method: 'POST' });
    alert("Snapshot command sent");
}

async function loadSystemInfo() {
    try {
        const resInfo = await fetch('/api/system/info');
        const dataInfo = await resInfo.json();
        
        const resSettings = await fetch('/api/settings');
        const dataSettings = await resSettings.json();

        // Device Info
        const infoDiv = document.getElementById('deviceInfo');
        let serialNum = 'N/A';
        if (dataSettings.devinfo && dataSettings.devinfo.length > 0) {
            serialNum = dataSettings.devinfo[0].SN || 'N/A';
        }

        if(dataInfo.info) {
            infoDiv.innerHTML = `
                <div class="info-item"><span class="info-label">Model</span><span class="info-val">${dataInfo.info.model || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Firmware</span><span class="info-val">${dataInfo.info.softversion || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Serial Number</span><span class="info-val">${serialNum}</span></div>
                <div class="info-item"><span class="info-label">Build Date</span><span class="info-val">${dataInfo.info.date || 'N/A'}</span></div>
            `;
        }

        // WiFi Info
        const wifiDiv = document.getElementById('wifiInfo');
        if (dataSettings.WifiInfo && dataSettings.WifiInfo.length > 0) {
            const wifi = dataSettings.WifiInfo[0];
            wifiDiv.innerHTML = `
                <div class="info-item"><span class="info-label">SSID</span><span class="info-val">${wifi.ssid}</span></div>
                <div class="info-item"><span class="info-label">Password</span><span class="info-val">${wifi.pwd}</span></div>
                <div class="info-item"><span class="info-label">IP Address</span><span class="info-val">192.168.0.1</span></div>
            `;
        }

        // SD Info
        const sdDiv = document.getElementById('sdInfo');
        if(dataInfo.sd) {
            const stat = dataInfo.sd.sdstat;
            if (stat === 'NONE') {
                sdDiv.innerHTML = `<div class="info-item" style="color:#ff5555; font-weight:bold;">No SD Card Inserted</div>`;
            } else {
                sdDiv.innerHTML = `
                    <div class="info-item"><span class="info-label">Total Space</span><span class="info-val">${dataInfo.sd.total}</span></div>
                    <div class="info-item"><span class="info-label">Free Space</span><span class="info-val">${dataInfo.sd.free}</span></div>
                    <div class="info-item"><span class="info-label">Status</span><span class="info-val">${stat}</span></div>
                `;
            }
        }
    } catch(e) { console.error(e); }
}

async function syncTime() {
    if(!confirm("Sync camera time with your computer?")) return;
    const res = await fetch('/api/system/time', { method: 'POST' });
    if(res.ok) alert("Time synced successfully.");
    else alert("Failed to sync time.");
}

async function formatSdCard() {
    if(!confirm("WARNING: This will erase all data on the SD card. Continue?")) return;
    const res = await fetch('/api/system/format', { method: 'POST' });
    if(res.ok) {
        alert("Format command sent. Camera may reboot.");
        loadSystemInfo();
    } else alert("Format failed.");
}

async function factoryReset() {
    if(!confirm("Reset camera to factory settings?")) return;
    await fetch('/api/system/reset', { method: 'POST' });
    alert("Reset command sent. Camera will reboot.");
}
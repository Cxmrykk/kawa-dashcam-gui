let player = null;

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    // Highlight button logic omitted for brevity
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
    
    if (player) { player.destroy(); }
    player = new JSMpeg.Player(url, { canvas: canvas });
}

async function loadGallery() {
    const type = document.getElementById('fileType').value;
    const grid = document.getElementById('fileGrid');
    grid.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`/api/files?type=${type}`);
        const files = await res.json();
        
        grid.innerHTML = '';
        files.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-card';
            div.innerHTML = `
                <div class="file-icon">${type === 'photo' ? '🖼️' : '🎬'}</div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <a href="${file.url}" class="download-link" target="_blank">Download</a>
                </div>
            `;
            grid.appendChild(div);
        });
    } catch (e) {
        grid.innerHTML = '<p>Error loading files.</p>';
    }
}

async function loadSettings() {
    const list = document.getElementById('settingsList');
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        
        list.innerHTML = '';
        
        // Handle Mstar vs Amba structure differences
        // This is a simplified renderer. Real app needs to parse specific bean structures.
        // We assume data is an object of key-values or a complex object we flatten.
        
        // Example for Mstar flat object or Amba complex object:
        const entries = Object.entries(data);
        
        entries.forEach(([key, val]) => {
            // Skip complex nested objects for this demo, focus on primitives or simple objects
            if (typeof val === 'object' && val !== null && val.value) {
                // Handle Amba/Mstar "Bean" structure { value: "ON", item: ["ON", "OFF"] }
                createSettingInput(list, key, val.value, val.item);
            } else if (typeof val !== 'object') {
                createSettingInput(list, key, val, null);
            }
        });

    } catch (e) {
        console.error(e);
    }
}

function createSettingInput(container, key, currentValue, options) {
    const div = document.createElement('div');
    div.className = 'setting-item';
    
    let inputHtml = '';
    if (options && Array.isArray(options)) {
        const opts = options.map(o => `<option value="${o}" ${o === currentValue ? 'selected' : ''}>${o}</option>`).join('');
        inputHtml = `<select class="setting-value" onchange="updateSetting('${key}', this.value)">${opts}</select>`;
    } else {
        inputHtml = `<span class="setting-value">${currentValue}</span>`;
    }

    div.innerHTML = `<span class="setting-label">${key}</span> ${inputHtml}`;
    container.appendChild(div);
}

async function updateSetting(key, value) {
    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    // Optional: reload settings to confirm
}

async function takePhoto() {
    await fetch('/api/photo', { method: 'POST' });
    alert("Photo command sent!");
}
const net = require('net');

const CLIENT_ID = '1522894263938056222';

// State
let socket = null;
let connected = false;
let presenceTimer = null;
let currentTab = 'Loading...';
let buf = '';
let enabled = true;
let startTime = Date.now();
let statusCallback = null;

// IPC socket helpers
function getIPCPath(id) {
  if (process.platform === 'win32') return `\\\\.\\pipe\\discord-ipc-${id}`;
  const dir = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || '/tmp';
  return `${dir.replace(/\/$/, '')}/discord-ipc-${id}`;
}

function findSocket(id = 0) {
  return new Promise((resolve, reject) => {
    const path = getIPCPath(id);
    const sock = net.createConnection(path, () => {
      sock.removeListener('error', onerror);
      resolve(sock);
    });
    sock.once('error', onerror);
    function onerror() {
      if (id < 10) resolve(findSocket(id + 1));
      else reject(new Error('No Discord IPC socket found'));
    }
  });
}

// Discord RPC protocol helpers
function encode(op, data) {
  data = JSON.stringify(data);
  const len = Buffer.byteLength(data);
  const packet = Buffer.alloc(8 + len);
  packet.writeInt32LE(op, 0);
  packet.writeInt32LE(len, 4);
  packet.write(data, 8, len);
  return packet;
}

function setupSocket(sock) {
  socket = sock;
  buf = '';
  sock.on('data', (chunk) => {
    buf += chunk.toString('binary');
    processBuffer();
  });
  sock.on('close', () => {
    connected = false;
    notify();
  });
}

function processBuffer() {
  while (buf.length >= 8) {
    const op = Buffer.from(buf.slice(0, 4), 'binary').readInt32LE(0);
    const len = Buffer.from(buf.slice(4, 8), 'binary').readInt32LE(0);
    if (buf.length < 8 + len) break;
    const raw = buf.slice(8, 8 + len);
    buf = buf.slice(8 + len);
    const data = JSON.parse(Buffer.from(raw, 'binary').toString('utf8'));
    handleFrame(op, data);
  }
}

function handleFrame(op, data) {
  if (op === 1 && data.cmd === 'DISPATCH' && data.evt === 'READY') {
    connected = true;
    update();
    presenceTimer = setInterval(update, 15000);
    notify();
  }
}

// Status broadcasting to renderer
function notify() {
  if (statusCallback) statusCallback({ connected, enabled });
}

function onStatus(cb) {
  statusCallback = cb;
  notify();
}

// Connection lifecycle
async function init() {
  startTime = Date.now();
  if (!enabled) {
    notify();
    return;
  }
  try {
    const sock = await findSocket();
    setupSocket(sock);
    sock.write(encode(0, { v: 1, client_id: CLIENT_ID }));
  } catch (err) {
    notify();
  }
}

function destroy() {
  if (presenceTimer) clearInterval(presenceTimer);
  if (socket) {
    try {
      socket.end();
    } catch {}
    socket = null;
  }
  connected = false;
  notify();
}

function reconnect() {
  destroy();
  init();
}

function setEnabled(val) {
  enabled = val;
  if (val) init();
  else destroy();
  notify();
}

// Presence management
function setTab(name) {
  currentTab = name;
  if (connected) update();
}

function update() {
  if (!socket || !connected) return;
  const nonce = Math.random().toString(36).slice(2);
  const activity = {
    cmd: 'SET_ACTIVITY',
    args: {
      pid: process.pid,
      activity: {
        details: currentTab,
        type: 0,
        timestamps: { start: startTime },
        instance: false,
      },
    },
    nonce,
  };
  socket.write(encode(1, activity));
}

function getStatus() {
  return { connected, enabled };
}

module.exports = {
  init,
  setTab,
  destroy,
  reconnect,
  setEnabled,
  getStatus,
  onStatus,
};

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { autoUpdater } = require('electron-updater');
const discord = require('./src/assets/js/modules/discord');

// App configuration
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-software-rasterizer');

const PLATFORM = os.platform();

app.name = 'bananadashboard';
app.setAppUserModelId('online.bananabrother77.dashboard');
if (PLATFORM === 'linux') app.setDesktopName('bananadashboard');

function getDistro() {
  try {
    if (PLATFORM === 'linux') {
      const content = fs.readFileSync('/etc/os-release', 'utf8');
      const match = content.match(/^PRETTY_NAME="?(.+?)"?$/m);
      if (match) return match[1];
    } else if (PLATFORM === 'darwin') {
      const name = execFileSync('sw_vers', ['-productName'], {
        encoding: 'utf8',
        timeout: 2000,
      }).trim();
      const ver = execFileSync('sw_vers', ['-productVersion'], {
        encoding: 'utf8',
        timeout: 2000,
      }).trim();
      return name + ' ' + ver;
    } else if (PLATFORM === 'win32') {
      const output = execFileSync(
        'wmic',
        ['os', 'get', 'Caption', '/format:csv'],
        { encoding: 'utf8', timeout: 3000 },
      );
      const lines = output.trim().split('\n');
      if (lines.length > 1) return lines[1].split(',')[1] || os.version();
    }
  } catch {}
  return os.version();
}

// Window management
let mainWindow;

function resolveIcon() {
  if (PLATFORM === 'darwin')
    return path.join(__dirname, 'src', 'assets', 'icon.icns');
  if (PLATFORM === 'win32')
    return path.join(__dirname, 'src', 'assets', 'icon.ico');
  return path.join(__dirname, 'src', 'assets', 'icon.png');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: resolveIcon(),
    autoHideMenuBar: PLATFORM !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

// Get system information
ipcMain.handle('get-system-info', () => {
  const cpus = os.cpus();
  return {
    hostname: os.hostname(),
    distro: getDistro(),
    user: os.userInfo().username,
    platform: PLATFORM,
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
    cpuCores: cpus.length,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    uptime: os.uptime(),
    gpu: getGpuInfo(),
  };
});

let _prevCpuUsage = null;
let _prevCpuTime = null;

function getGpuInfo() {
  try {
    if (PLATFORM === 'linux') {
      const output = execFileSync(
        'sh',
        ['-c', 'lspci 2>/dev/null | grep -iE "vga|3d|display"'],
        { encoding: 'utf8', timeout: 3000 },
      );
      const match = output.trim().split('\n')[0];
      if (match) return match.replace(/^.*?: /, '').trim();
    } else if (PLATFORM === 'darwin') {
      const output = execFileSync('system_profiler', ['SPDisplaysDataType'], {
        encoding: 'utf8',
        timeout: 3000,
      });
      for (const line of output.split('\n')) {
        const m = line.match(/Chipset Model:\s*(.+)/);
        if (m) return m[1].trim();
      }
    } else if (PLATFORM === 'win32') {
      const output = execFileSync(
        'wmic',
        ['path', 'win32_VideoController', 'get', 'name'],
        { encoding: 'utf8', timeout: 3000 },
      );
      return (
        output
          .trim()
          .split('\n')
          .slice(1)
          .map((l) => l.trim())
          .filter(Boolean)[0] || 'Unknown'
      );
    }
  } catch {}
  return 'Unknown';
}

ipcMain.handle('get-app-usage', () => {
  const mem = process.memoryUsage();
  const usage = process.cpuUsage();
  const now = Date.now();

  let cpuPercent = 0;
  if (_prevCpuUsage) {
    const cpuDelta =
      usage.user - _prevCpuUsage.user + (usage.system - _prevCpuUsage.system);
    const timeDelta = (now - _prevCpuTime) * 1000;
    cpuPercent =
      timeDelta > 0 ? Math.min((cpuDelta / timeDelta) * 100, 100) : 0;
  }
  _prevCpuUsage = usage;
  _prevCpuTime = now;

  const uptime = process.uptime();
  let uptimeStr;
  if (uptime >= 86400)
    uptimeStr =
      Math.floor(uptime / 86400) +
      'd ' +
      Math.floor((uptime % 86400) / 3600) +
      'h';
  else if (uptime >= 3600)
    uptimeStr =
      Math.floor(uptime / 3600) + 'h ' + Math.floor((uptime % 3600) / 60) + 'm';
  else
    uptimeStr = Math.floor(uptime / 60) + 'm ' + Math.floor(uptime % 60) + 's';

  return {
    pid: process.pid,
    memory: mem.rss,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    cpu: cpuPercent,
    uptime: uptimeStr,
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  };
});

let previousCpuTimes = null;
let diskCache = null;
let diskCacheTime = 0;

function parseDfLinux(output) {
  const pseudoFS = [
    'tmpfs',
    'devtmpfs',
    'squashfs',
    'overlay',
    'autofs',
    'proc',
    'sysfs',
    'cgroup',
    'cgroup2',
    'devpts',
    'securityfs',
    'hugetlbfs',
    'pstore',
    'mqueue',
    'configfs',
    'debugfs',
    'tracefs',
    'efivarfs',
    'fusectl',
    'bpf',
  ];

  const seen = new Set();
  return output
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 7) return null;
      const [source, fstype, target, size, used, avail, pcent] = parts;
      if (pseudoFS.includes(fstype)) return null;
      if (seen.has(source)) return null;
      seen.add(source);
      return {
        target,
        size: parseInt(size) || 0,
        used: parseInt(used) || 0,
        avail: parseInt(avail) || 0,
        pcent: parseInt(pcent) || 0,
      };
    })
    .filter(Boolean);
}

function parseDfMacOs(output) {
  return output
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) return null;
      const target = parts[8];
      const size = (parseInt(parts[1]) || 0) * 1024;
      const used = (parseInt(parts[2]) || 0) * 1024;
      const avail = (parseInt(parts[3]) || 0) * 1024;
      const pcent = parseInt(parts[4]) || 0;
      return { target, size, used, avail, pcent };
    })
    .filter(Boolean);
}

function parseWmicDisks(output) {
  return output
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const cols = line.split(',');
      if (cols.length < 4) return null;
      const caption = cols[1];
      const size = parseInt(cols[3]) || 0;
      const free = parseInt(cols[2]) || 0;
      const used = size - free;
      if (size <= 0) return null;
      return {
        target: caption,
        size,
        used,
        avail: free,
        pcent: Math.round((used / size) * 100),
      };
    })
    .filter(Boolean);
}

function getDiskInfo() {
  if (diskCache && Date.now() - diskCacheTime < 30000) return diskCache;

  let result = [];

  try {
    if (PLATFORM === 'linux') {
      const output = execFileSync(
        'df',
        ['-B1', '--output=source,fstype,target,size,used,avail,pcent'],
        { encoding: 'utf8', timeout: 3000 },
      );
      result = parseDfLinux(output);
    } else if (PLATFORM === 'darwin') {
      const output = execFileSync('df', ['-k'], {
        encoding: 'utf8',
        timeout: 3000,
      });
      result = parseDfMacOs(output);
    } else if (PLATFORM === 'win32') {
      const output = execFileSync(
        'wmic',
        ['logicaldisk', 'get', 'caption,size,freespace', '/format:csv'],
        { encoding: 'utf8', timeout: 3000 },
      );
      result = parseWmicDisks(output);
    }
  } catch {}

  diskCache = result;
  diskCacheTime = Date.now();
  return result;
}

function calcCpuUsage() {
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((s, c) => s + c.times.idle, 0);
  const totalTick = cpus.reduce(
    (s, c) => s + Object.values(c.times).reduce((a, b) => a + b, 0),
    0,
  );

  if (!previousCpuTimes) {
    previousCpuTimes = { idle: totalIdle, tick: totalTick };
    return { usage: 0, perCore: cpus.map(() => 0) };
  }

  const idleDiff = totalIdle - previousCpuTimes.idle;
  const tickDiff = totalTick - previousCpuTimes.tick;
  previousCpuTimes = { idle: totalIdle, tick: totalTick };

  return {
    usage: Math.min(100, Math.max(0, 100 - (idleDiff / tickDiff) * 100)),
    perCore: [],
  };
}

ipcMain.handle('get-resources', () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: calcCpuUsage(),
    ram: { used: usedMem, total: totalMem },
    disk: getDiskInfo(),
    gpu: getGpuStats(),
    timestamp: Date.now(),
  };
});

let _gpuIntelCache = null;

function getGpuStats() {
  const fallback = {
    usage: null,
    memUsed: null,
    memTotal: null,
    temp: null,
    name: null,
  };

  try {
    if (PLATFORM === 'win32') {
      const out = execFileSync(
        'nvidia-smi',
        [
          '--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,name',
          '--format=csv,noheader,nounits',
        ],
        { encoding: 'utf8', timeout: 3000 },
      );
      const cols = out.trim().split(', ');
      if (cols.length >= 5) {
        return {
          usage: parseFloat(cols[0]),
          memUsed: parseInt(cols[1]) * 1024 * 1024,
          memTotal: parseInt(cols[2]) * 1024 * 1024,
          temp: parseInt(cols[3]),
          name: cols.slice(4).join(', ').trim(),
        };
      }
    }

    if (PLATFORM === 'linux') {
      try {
        const out = execFileSync(
          'nvidia-smi',
          [
            '--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,name',
            '--format=csv,noheader,nounits',
          ],
          { encoding: 'utf8', timeout: 3000 },
        );
        const cols = out.trim().split(', ');
        if (cols.length >= 5) {
          return {
            usage: parseFloat(cols[0]),
            memUsed: parseInt(cols[1]) * 1024 * 1024,
            memTotal: parseInt(cols[2]) * 1024 * 1024,
            temp: parseInt(cols[3]),
            name: cols.slice(4).join(', ').trim(),
          };
        }
      } catch {}

      try {
        const out = execFileSync('rocm-smi', ['--json'], {
          encoding: 'utf8',
          timeout: 3000,
        });
        const data = JSON.parse(out);
        const card = Object.values(data)[0];
        if (card) {
          return {
            usage: parseFloat(card['GPU use (%)']) || null,
            memUsed: parseInt(card['VRAM Total Memory (MB)'])
              ? parseInt(card['VRAM Total Memory (MB)']) * 1024 * 1024
              : null,
            memTotal: parseInt(card['VRAM Total Memory (MB)'])
              ? parseInt(card['VRAM Total Memory (MB)']) * 1024 * 1024
              : null,
            temp:
              parseFloat(card['Temperature (Sensor memory) (C)']) ||
              parseFloat(card['Temperature (Sensor edge) (C)']) ||
              null,
            name: card['Card series'] || null,
          };
        }
      } catch {}

      try {
        if (!_gpuIntelCache) {
          const dirs = execFileSync(
            'sh',
            [
              '-c',
              'for d in /sys/class/drm/card[0-9]*/device/vendor; do [ -f "$d" ] && echo "$d"; done',
            ],
            { encoding: 'utf8', timeout: 1000 },
          );
          for (const vp of dirs.trim().split(/\s+/).filter(Boolean)) {
            const vendor = execFileSync('cat', [vp], {
              encoding: 'utf8',
              timeout: 500,
            }).trim();
            if (vendor === '0x8086') {
              const cardDir = vp.replace('/vendor', '');
              const cardN = cardDir.match(/card(\d+)/)?.[1];
              const actPath =
                cardDir + '/drm/card' + cardN + '/gt/gt0/rps_act_freq_mhz';
              const rp0Path =
                cardDir + '/drm/card' + cardN + '/gt/gt0/rps_RP0_freq_mhz';
              const maxVal = parseInt(
                execFileSync('cat', [rp0Path], {
                  encoding: 'utf8',
                  timeout: 500,
                }),
              );
              _gpuIntelCache = { actPath, max: maxVal, name: 'Intel' };
              break;
            }
          }
        }
        if (_gpuIntelCache && _gpuIntelCache.max > 0) {
          const cur = parseInt(
            execFileSync('cat', [_gpuIntelCache.actPath], {
              encoding: 'utf8',
              timeout: 500,
            }),
          );
          return {
            usage: Math.round((cur / _gpuIntelCache.max) * 100),
            memUsed: null,
            memTotal: null,
            temp: null,
            name: _gpuIntelCache.name,
          };
        }
        if (_gpuIntelCache)
          return {
            usage: null,
            memUsed: null,
            memTotal: null,
            temp: null,
            name: _gpuIntelCache.name,
          };
      } catch {}
    }

    if (PLATFORM === 'darwin') {
      const out = execFileSync('system_profiler', ['SPDisplaysDataType'], {
        encoding: 'utf8',
        timeout: 3000,
      });
      for (const line of out.split('\n')) {
        const m = line.match(/Chipset Model:\s*(.+)/);
        if (m)
          return {
            usage: null,
            memUsed: null,
            memTotal: null,
            temp: null,
            name: m[1].trim(),
          };
      }
    }
  } catch {}

  return fallback;
}

function sendToWindow(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send(channel, data);
}

app.whenReady().then(() => {
  createWindow();

  autoUpdater.autoDownload = false;
  autoUpdater.logger = console;
  autoUpdater.on('checking-for-update', () =>
    sendToWindow('update-status', { status: 'checking' }),
  );
  autoUpdater.on('update-available', (info) =>
    sendToWindow('update-status', { status: 'available', info }),
  );
  autoUpdater.on('update-not-available', (info) =>
    sendToWindow('update-status', { status: 'not-available', info }),
  );
  autoUpdater.on('error', (err) =>
    sendToWindow('update-status', { status: 'error', message: err.message }),
  );
  autoUpdater.on('download-progress', (progress) =>
    sendToWindow('update-status', { status: 'downloading', progress }),
  );
  autoUpdater.on('update-downloaded', (info) =>
    sendToWindow('update-status', { status: 'downloaded', info }),
  );

  autoUpdater.checkForUpdates();

  discord.onStatus((status) => sendToWindow('rpc-status', status));
  discord.init();
});

app.on('will-quit', () => discord.destroy());

ipcMain.handle('set-presence-tab', (_, tab) => discord.setTab(tab));
ipcMain.handle('get-rpc-status', () => discord.getStatus());
ipcMain.handle('reconnect-rpc', () => discord.reconnect());
ipcMain.handle('set-rpc-enabled', (_, val) => discord.setEnabled(val));

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdates());
ipcMain.handle('download-update', () => autoUpdater.downloadUpdate());
ipcMain.handle('quit-and-install', () => autoUpdater.quitAndInstall());

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-software-rasterizer');

function getDistro() {
  if (os.platform() === 'linux') {
    try {
      const content = fs.readFileSync('/etc/os-release', 'utf8');
      const match = content.match(/^PRETTY_NAME="?(.+?)"?$/m);
      if (match) return match[1];
    } catch {}
  }
  return os.version();
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    autoHideMenuBar: true,
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
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
    cpuCores: cpus.length,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    uptime: os.uptime(),
  };
});

const { execFileSync } = require('child_process');

let previousCpuTimes = null;
let diskCache = null;
let diskCacheTime = 0;

function getDiskInfo() {
  if (os.platform() !== 'linux') return [];
  if (diskCache && Date.now() - diskCacheTime < 30000) return diskCache;

  try {
    const output = execFileSync(
      'df',
      ['-B1', '--output=source,fstype,target,size,used,avail,pcent'],
      { encoding: 'utf8', timeout: 3000 },
    );
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
    const result = output
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
    diskCache = result;
    diskCacheTime = Date.now();
    return result;
  } catch {
    return [];
  }
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
    timestamp: Date.now(),
  };
});

app.whenReady().then(() => {
  createWindow();
});

function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const stats = {
  cpuValue: document.getElementById('cpuValue'),
  ramValue: document.getElementById('ramValue'),
  diskValue: document.getElementById('diskValue'),
  gpuValue: document.getElementById('gpuValue'),
  gpuTempValue: document.getElementById('gpuTempValue'),
};

const disk = {
  info: document.getElementById('diskInfo'),
};

const charts = {
  cpu: document.getElementById('cpuChart'),
  ram: document.getElementById('ramChart'),
  disk: document.getElementById('diskChart'),
  gpu: document.getElementById('gpuChart'),
};

const app = {
  pid: document.getElementById('appPid'),
  memory: document.getElementById('appMemory'),
  heap: document.getElementById('appHeap'),
  cpu: document.getElementById('appCpu'),
  uptime: document.getElementById('appUptime'),
  versions: document.getElementById('appVersions'),
};

const resources = {
  charts: {},
  data: { cpu: [], ram: [], gpu: [], labels: [] },
  maxPoints: 30,
  interval: null,
  intervalMs: parseInt(localStorage.getItem('banana-refresh')) || 2000,
};

function getPartitionColors() {
  const accent = cssVar('--accent-purple');
  return [
    accent,
    '#50fa7b',
    '#f1fa8c',
    '#ff5555',
    '#8be9fd',
    '#ff79c6',
    '#bd93f9',
    '#6272a4',
    '#ffb86c',
    '#45aaf2',
  ];
}

resources.formatBytes = function (bytes) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return gb.toFixed(1) + ' GB';
  const mb = bytes / 1024 ** 2;
  if (mb >= 1) return mb.toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
};

resources.init = function () {
  this.ctx = {
    cpu: charts.cpu.getContext('2d'),
    ram: charts.ram.getContext('2d'),
    disk: charts.disk.getContext('2d'),
    gpu: charts.gpu.getContext('2d'),
  };

  const accent = cssVar('--accent-purple');
  const muted = cssVar('--text-muted');
  const [ar, ag, ab] = hexToRgb(accent);

  this.charts.cpu = new Chart(this.ctx.cpu, {
    type: 'line',
    data: {
      labels: this.data.labels,
      datasets: [
        {
          label: 'CPU Usage',
          data: this.data.cpu,
          borderColor: accent,
          backgroundColor: 'rgba(' + ar + ', ' + ag + ', ' + ab + ', 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: muted, font: { size: 10 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            font: { size: 10 },
            callback: (v) => v + '%',
          },
        },
      },
    },
  });

  const accent2 = cssVar('--text-muted-bright');
  const [ar2, ag2, ab2] = hexToRgb(accent2);

  this.charts.ram = new Chart(this.ctx.ram, {
    type: 'line',
    data: {
      labels: this.data.labels,
      datasets: [
        {
          label: 'RAM Used',
          data: this.data.ram,
          borderColor: accent2,
          backgroundColor: 'rgba(' + ar2 + ', ' + ag2 + ', ' + ab2 + ', 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: muted, font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            font: { size: 10 },
            callback: (v) => v + ' GB',
          },
        },
      },
    },
  });

  this.charts.disk = new Chart(this.ctx.disk, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.dataset.data[ctx.dataIndex];
            return ctx.label + ': ' + resources.formatBytes(raw);
          },
        },
      },
    },
  });

  this.charts.gpu = new Chart(this.ctx.gpu, {
    type: 'line',
    data: {
      labels: this.data.labels,
      datasets: [
        {
          label: 'GPU Usage',
          data: this.data.gpu,
          borderColor: accent,
          backgroundColor: 'rgba(' + ar + ', ' + ag + ', ' + ab + ', 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: muted, font: { size: 10 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            font: { size: 10 },
            callback: (v) => v + '%',
          },
        },
      },
    },
  });

  this.fetchAndUpdate();
  this.interval = setInterval(() => this.fetchAndUpdate(), this.intervalMs);
};

resources.updateDiskChart = function (partitions) {
  if (!partitions || partitions.length === 0) return;

  const colors = getPartitionColors();
  const ds = this.charts.disk.data;
  ds.labels.length = 0;
  ds.datasets[0].data.length = 0;
  ds.datasets[0].backgroundColor.length = 0;

  partitions.forEach((p, i) => {
    const color = colors[i % colors.length];
    ds.labels.push(p.target + ' (used)');
    ds.datasets[0].data.push(p.used);
    ds.datasets[0].backgroundColor.push(color);
    ds.labels.push(p.target + ' (free)');
    ds.datasets[0].data.push(p.avail);
    ds.datasets[0].backgroundColor.push(color + '44');
  });

  this.charts.disk.update();
};

resources.updateDiskStat = function (partitions) {
  if (!stats.diskValue || !partitions || partitions.length === 0) return;
  const total = partitions.reduce((s, p) => s + p.size, 0);
  const used = partitions.reduce((s, p) => s + p.used, 0);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  stats.diskValue.textContent = pct + '%';
};

resources.updateDiskSummary = function (partitions) {
  if (!disk.info) return;
  if (!this._diskRows) this._diskRows = new Map();

  const colors = getPartitionColors();
  const seen = new Set();

  partitions.forEach((p, i) => {
    seen.add(p.target);
    const pct = p.size > 0 ? Math.round((p.used / p.size) * 100) : 0;
    const color = colors[i % colors.length];

    let row = this._diskRows.get(p.target);
    if (!row) {
      row = document.createElement('div');
      row.className = 'disk-row';
      row.innerHTML =
        '<span class="disk-mount"></span>' +
        '<div class="disk-bar"><div class="disk-fill"></div></div>' +
        '<span class="disk-pct"></span>' +
        '<span class="disk-used"></span>' +
        '<span class="disk-free"></span>';
      disk.info.appendChild(row);
      this._diskRows.set(p.target, row);
    }

    row.querySelector('.disk-mount').textContent = p.target;
    const fill = row.querySelector('.disk-fill');
    fill.style.width = pct + '%';
    fill.style.setProperty('--disk-color', color);
    const pctEl = row.querySelector('.disk-pct');
    pctEl.textContent = pct + '%';
    pctEl.style.setProperty('--disk-color', color);
    row.querySelector('.disk-used').textContent = resources.formatBytes(p.used);
    row.querySelector('.disk-free').textContent = resources.formatBytes(
      p.avail,
    );
  });

  for (const [target, row] of this._diskRows) {
    if (!seen.has(target)) {
      row.remove();
      this._diskRows.delete(target);
    }
  }
};

resources.updateAppUsage = function (data) {
  if (!data || !app.pid) return;
  app.pid.textContent = data.pid;
  app.memory.textContent = this.formatBytes(data.memory);

  const heapPct =
    data.heapTotal > 0 ? Math.round((data.heapUsed / data.heapTotal) * 100) : 0;
  app.heap.textContent =
    this.formatBytes(data.heapUsed) +
    ' / ' +
    this.formatBytes(data.heapTotal) +
    ' (' +
    heapPct +
    '%)';

  app.cpu.textContent = data.cpu.toFixed(1) + '%';
  app.uptime.textContent = data.uptime;
  if (app.versions) {
    app.versions.textContent =
      'Node ' +
      data.node +
      '  ·  Electron ' +
      data.electron +
      '  ·  Chrome ' +
      data.chrome;
  }
};

resources.fetchAndUpdate = async function () {
  if (!this.charts.cpu) return;
  try {
    const [res, app] = await Promise.all([
      window.dashboardAPI.getResources(),
      window.dashboardAPI.getAppUsage(),
    ]);
    const cpuPercent = Math.round(res.cpu.usage);
    const ramGB = (res.ram.used / 1024 ** 3).toFixed(1);

    stats.cpuValue.textContent = cpuPercent + '%';
    stats.ramValue.textContent =
      ramGB + ' GB / ' + (res.ram.total / 1024 ** 3).toFixed(1) + ' GB';

    if (res.gpu && res.gpu.usage !== null) {
      const gpuPct = Math.round(res.gpu.usage);
      stats.gpuValue.textContent = gpuPct + '%';
      if (res.gpu.memTotal) {
        const memUsedGB = (res.gpu.memUsed / 1024 ** 3).toFixed(1);
        const memTotalGB = (res.gpu.memTotal / 1024 ** 3).toFixed(1);
        stats.gpuValue.textContent +=
          '  \u00B7  ' + memUsedGB + ' / ' + memTotalGB + ' GB';
      }
    } else {
      stats.gpuValue.textContent = '\u2014';
    }

    if (res.gpu && res.gpu.temp !== null) {
      stats.gpuTempValue.textContent = Math.round(res.gpu.temp) + '\u00B0C';
    } else {
      stats.gpuTempValue.textContent = '\u2014';
    }

    this._lastPartitions = res.disk;
    this.updateDiskChart(res.disk);
    this.updateDiskSummary(res.disk);
    this.updateDiskStat(res.disk);
    this.updateAppUsage(app);

    const now = new Date();
    const label = now.getSeconds() + 's';

    this.data.labels.push(label);
    this.data.cpu.push(cpuPercent);
    this.data.ram.push(parseFloat(ramGB));
    this.data.gpu.push(
      res.gpu && res.gpu.usage !== null ? res.gpu.usage : null,
    );

    if (this.data.labels.length > this.maxPoints) {
      this.data.labels.shift();
      this.data.cpu.shift();
      this.data.ram.shift();
      this.data.gpu.shift();
    }

    this.charts.cpu.update();
    this.charts.ram.update();
    this.charts.gpu.update();
  } catch (err) {
    console.error('Resources fetch error:', err);
  }
};

resources.applyTheme = function () {
  const accent = cssVar('--accent-purple');
  const muted = cssVar('--text-muted');
  const accent2 = cssVar('--text-muted-bright');
  const [ar, ag, ab] = hexToRgb(accent);
  const [ar2, ag2, ab2] = hexToRgb(accent2);

  if (this.charts.cpu) {
    const cpu = this.charts.cpu;
    cpu.data.datasets[0].borderColor = accent;
    cpu.data.datasets[0].backgroundColor =
      'rgba(' + ar + ', ' + ag + ', ' + ab + ', 0.1)';
    cpu.options.scales.x.ticks.color = muted;
    cpu.options.scales.y.ticks.color = muted;
    cpu.update();
  }

  if (this.charts.ram) {
    const ram = this.charts.ram;
    ram.data.datasets[0].borderColor = accent2;
    ram.data.datasets[0].backgroundColor =
      'rgba(' + ar2 + ', ' + ag2 + ', ' + ab2 + ', 0.1)';
    ram.options.scales.x.ticks.color = muted;
    ram.options.scales.y.ticks.color = muted;
    ram.update();
  }

  if (this.charts.gpu) {
    const gpu = this.charts.gpu;
    gpu.data.datasets[0].borderColor = accent;
    gpu.data.datasets[0].backgroundColor =
      'rgba(' + ar + ', ' + ag + ', ' + ab + ', 0.1)';
    gpu.options.scales.x.ticks.color = muted;
    gpu.options.scales.y.ticks.color = muted;
    gpu.update();
  }

  if (this.charts.disk && this._lastPartitions) {
    this.updateDiskChart(this._lastPartitions);
    this.updateDiskSummary(this._lastPartitions);
  }
};

resources.setRefreshRate = function (ms) {
  this.intervalMs = ms;
  if (this.interval) clearInterval(this.interval);
  this.interval = ms > 0 ? setInterval(() => this.fetchAndUpdate(), ms) : null;
};

resources.destroy = function () {
  if (this.interval) {
    clearInterval(this.interval);
    this.interval = null;
  }
  Object.values(this.charts).forEach((c) => c.destroy());
};

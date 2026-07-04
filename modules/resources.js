const resources = {
  charts: {},
  data: { cpu: [], ram: [], labels: [] },
  maxPoints: 30,
  interval: null,
};

const PARTITION_COLORS = [
  '#7c58cc',
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

resources.formatBytes = function (bytes) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return gb.toFixed(1) + ' GB';
  const mb = bytes / 1024 ** 2;
  if (mb >= 1) return mb.toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
};

resources.init = function () {
  this.ctx = {
    cpu: document.getElementById('cpuChart').getContext('2d'),
    ram: document.getElementById('ramChart').getContext('2d'),
    disk: document.getElementById('diskChart').getContext('2d'),
  };

  this.charts.cpu = new Chart(this.ctx.cpu, {
    type: 'line',
    data: {
      labels: this.data.labels,
      datasets: [
        {
          label: 'CPU Usage',
          data: this.data.cpu,
          borderColor: '#7c58cc',
          backgroundColor: 'rgba(124, 88, 204, 0.1)',
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
          ticks: { color: '#9d7ee0', font: { size: 10 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#9d7ee0',
            font: { size: 10 },
            callback: (v) => v + '%',
          },
        },
      },
    },
  });

  this.charts.ram = new Chart(this.ctx.ram, {
    type: 'line',
    data: {
      labels: this.data.labels,
      datasets: [
        {
          label: 'RAM Used',
          data: this.data.ram,
          borderColor: '#50fa7b',
          backgroundColor: 'rgba(80, 250, 123, 0.1)',
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
          ticks: { color: '#9d7ee0', font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#9d7ee0',
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

  this.fetchAndUpdate();
  this.interval = setInterval(() => this.fetchAndUpdate(), 2000);
};

resources.updateDiskChart = function (partitions) {
  if (!partitions || partitions.length === 0) return;

  const ds = this.charts.disk.data;
  ds.labels.length = 0;
  ds.datasets[0].data.length = 0;
  ds.datasets[0].backgroundColor.length = 0;

  partitions.forEach((p, i) => {
    const color = PARTITION_COLORS[i % PARTITION_COLORS.length];
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
  const el = document.getElementById('diskValue');
  if (!el || !partitions || partitions.length === 0) return;
  const total = partitions.reduce((s, p) => s + p.size, 0);
  const used = partitions.reduce((s, p) => s + p.used, 0);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  el.textContent = pct + '%';
};

resources.updateDiskSummary = function (partitions) {
  const container = document.getElementById('diskInfo');
  if (!container) return;

  container.innerHTML = '';
  partitions.forEach((p, i) => {
    const pct = p.size > 0 ? Math.round((p.used / p.size) * 100) : 0;
    const color = PARTITION_COLORS[i % PARTITION_COLORS.length];
    const row = document.createElement('div');
    row.className = 'disk-row';
    row.innerHTML =
      '<span class="disk-mount">' +
      p.target +
      '</span>' +
      '<div class="disk-bar"><div class="disk-fill" style="width:' +
      pct +
      '%;background:' +
      color +
      '"></div></div>' +
      '<span class="disk-pct" style="color:' +
      color +
      '">' +
      pct +
      '%</span>' +
      '<span class="disk-used">' +
      resources.formatBytes(p.used) +
      '</span>' +
      '<span class="disk-free">' +
      resources.formatBytes(p.avail) +
      '</span>';
    container.appendChild(row);
  });
};

resources.fetchAndUpdate = async function () {
  try {
    const res = await window.dashboardAPI.getResources();
    const cpuPercent = Math.round(res.cpu.usage);
    const ramGB = (res.ram.used / 1024 ** 3).toFixed(1);

    document.getElementById('cpuValue').textContent = cpuPercent + '%';
    document.getElementById('ramValue').textContent =
      ramGB + ' GB / ' + (res.ram.total / 1024 ** 3).toFixed(1) + ' GB';

    this.updateDiskChart(res.disk);
    this.updateDiskSummary(res.disk);
    this.updateDiskStat(res.disk);

    const now = new Date();
    const label = now.getSeconds() + 's';

    this.data.labels.push(label);
    this.data.cpu.push(cpuPercent);
    this.data.ram.push(parseFloat(ramGB));

    if (this.data.labels.length > this.maxPoints) {
      this.data.labels.shift();
      this.data.cpu.shift();
      this.data.ram.shift();
    }

    this.charts.cpu.update();
    this.charts.ram.update();
  } catch (err) {
    console.error('Resources fetch error:', err);
  }
};

resources.destroy = function () {
  if (this.interval) {
    clearInterval(this.interval);
    this.interval = null;
  }
  Object.values(this.charts).forEach((c) => c.destroy());
};

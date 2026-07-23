async function loadSystemInfo() {
  const info = await window.dashboardAPI.getSystemInfo();

  overview.osVersion.textContent = info.distro;
  if (overview.userName) overview.userName.textContent = info.user;
  overview.kernelVersion.textContent = info.release;
  overview.cpu.textContent = info.cpuModel;
  overview.cpuCores.textContent = `${info.cpuCores} cores`;
  overview.ram.textContent = `${(info.totalMem / 1024 ** 3).toFixed(2)} GB`;
  if (overview.gpu) overview.gpu.textContent = info.gpu;
  if (overview.hostname)
    overview.hostname.textContent = info.deviceName || info.hostname;
}

// More Info toggle
const detailFields = [
  'uptime',
  'shell',
  'de',
  'terminal',
  'packages',
  'localIp',
  'battery',
  'swap',
];

if (detail.toggle && detail.grid) {
  detail.toggle.addEventListener('click', async () => {
    const isOpen = detail.toggle.classList.toggle('open');
    detail.grid.style.display = isOpen ? 'grid' : 'none';

    if (isOpen && !detail.toggle.dataset.loaded) {
      detail.toggle.dataset.loaded = 'true';

      try {
        const info = await window.dashboardAPI.getDetailedSysinfo();

        for (const field of detailFields) {
          const el = document.getElementById(
            'detail' + field.charAt(0).toUpperCase() + field.slice(1),
          );

          if (el) el.textContent = info[field] || '\u2014';
        }
      } catch {}
    }
  });
}

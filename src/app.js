// Elements

const overviewElements = {
  osVersion: document.getElementById('osVersionCard'),
  kernelVersion: document.getElementById('kernelVersionCard'),
  cpu: document.getElementById('cpuCard'),
  cpuCores: document.getElementById('cpuCoresCard'),
  ram: document.getElementById('ramCard'),
};

async function loadSystemInfo() {
  const info = await window.dashboardAPI.getSystemInfo();
  overviewElements.osVersion.textContent = info.distro;
  overviewElements.kernelVersion.textContent = info.release;
  overviewElements.cpu.textContent = info.cpuModel;
  overviewElements.cpuCores.textContent = `${info.cpuCores} cores`;
  overviewElements.ram.textContent = `${(info.totalMem / 1024 ** 3).toFixed(2)} GB`;
}

loadSystemInfo();

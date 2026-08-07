async function displayBatteryInfo() {
  const info = await window.dashboardAPI.getBatteryInfo();
  if (!info) return;

  battery.level.textContent = info.capacity + '%';
  battery.fill.style.width = info.capacity + '%';
  battery.status.textContent = info.status;
  battery.time.textContent = formatTime(info.timeRemaining);
  
  battery.timeLabel.textContent = getTranslation(
    info.status === 'Charging' ? 'battery_time_to_full' : 'battery_time',
  );
}

function formatTime(time) {
  if (!time || time <= 0) return '—';
  if (typeof time === 'string') return time;

  const h = Math.floor(time / 60);
  const m = Math.round(time % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

setInterval(displayBatteryInfo, parseInt(localStorage.getItem('banana-refresh')) || 2000);
displayBatteryInfo();
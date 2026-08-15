(function () {
  let pollTimer = null;

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
    if (time == null) return 'N/A';
    if (!time || time <= 0) return '—';
    if (typeof time === 'string') return time;

    const h = Math.floor(time / 60);
    const m = Math.round(time % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function startPolling(ms) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = ms > 0 ? setInterval(displayBatteryInfo, ms) : null;
  }

  displayBatteryInfo();
  startPolling(refresh.getMs('battery'));
  refresh.register('battery', startPolling);
})();

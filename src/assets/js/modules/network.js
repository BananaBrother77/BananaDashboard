(function () {
  const refreshMs = () =>
    parseInt(localStorage.getItem('banana-refresh')) || 2000;

  const ifaceCards = {};

  function formatRate(bytesPerSec) {
    if (bytesPerSec == null) return 'N/A';
    if (bytesPerSec < 0) return '0 B/s';

    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
    let i = 0;
    let value = bytesPerSec;

    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }

    return (i === 0 ? Math.round(value) : value.toFixed(1)) + ' ' + units[i];
  }

  function formatSpeed(mbits) {
    if (mbits == null) return 'N/A';

    return mbits + ' Mbit/s';
  }

  function pickActive(list) {
    return (
      list.find((i) => !i.internal && i.operstate === 'up' && i.ip4) ?? list[0]
    );
  }

  function createIfaceCard(iface) {
    const card = document.createElement('div');
    card.className = 'iface-card';
    card.dataset.hideable = '';
    card.dataset.hideId = 'network-' + iface.iface.toLowerCase();

    const hidden = JSON.parse(localStorage.getItem('hiddenElements') || '{}')[
      card.dataset.hideId
    ];

    if (hidden) card.classList.add('is-hidden');

    card.innerHTML = `
      <div class="iface-card-head">
        <span class="iface-name">${iface.iface}</span>
        <span class="iface-status ${iface.operstate === 'up' ? 'up' : 'down'}">${
          iface.operstate === 'up'
            ? getTranslation('net_status_up')
            : getTranslation('net_status_down')
        }</span>
      </div>
      <div class="iface-card-row">
        <span class="iface-card-label">${getTranslation('net_ipv4')}</span>
        <span class="iface-card-value sensitive">${iface.ip4 || 'N/A'}</span>
      </div>
      <div class="iface-card-row">
        <span class="iface-card-label">${getTranslation('net_speed')}</span>
        <span class="iface-card-value iface-speed">${formatSpeed(iface.speed)}</span>
      </div>
      <div class="iface-card-row">
        <span class="iface-card-label">${getTranslation('net_down')}</span>
        <span class="iface-card-value iface-down">${formatRate(iface.rx_sec)}</span>
      </div>
      <div class="iface-card-row">
        <span class="iface-card-label">${getTranslation('net_up')}</span>
        <span class="iface-card-value iface-up">${formatRate(iface.tx_sec)}</span>
      </div>
    `;

    card
      .querySelector('.iface-card-value.sensitive')
      .addEventListener('click', (e) => {
        e.target.classList.toggle('revealed');
      });

    network.interfacesList.appendChild(card);

    return card;
  }

  function updateIfaceCard(card, iface) {
    card.querySelector('.iface-name').textContent = iface.iface;

    const status = card.querySelector('.iface-status');
    const up = iface.operstate === 'up';

    status.textContent = up
      ? getTranslation('net_status_up')
      : getTranslation('net_status_down');
    status.classList.toggle('up', up);
    status.classList.toggle('down', !up);

    card.querySelector('.iface-card-value.sensitive').textContent =
      iface.ip4 || 'N/A';
    card.querySelector('.iface-speed').textContent = formatSpeed(iface.speed);
    card.querySelector('.iface-down').textContent = formatRate(iface.rx_sec);
    card.querySelector('.iface-up').textContent = formatRate(iface.tx_sec);
  }

  function renderInterfaces(list) {
    const seen = new Set();

    list.forEach((iface) => {
      seen.add(iface.iface);

      if (!ifaceCards[iface.iface])
        ifaceCards[iface.iface] = createIfaceCard(iface);
      updateIfaceCard(ifaceCards[iface.iface], iface);
    });

    Object.keys(ifaceCards).forEach((name) => {
      if (!seen.has(name)) {
        ifaceCards[name].remove();
        delete ifaceCards[name];
      }
    });
  }

  function render(data) {
    const { interfaces, gateway, latency } = data;
    if (!interfaces?.length) return;

    const active = pickActive(interfaces);

    network.downDisplay.textContent = formatRate(active.rx_sec);
    network.upDisplay.textContent = formatRate(active.tx_sec);
    network.ip4Display.textContent = active.ip4 || 'N/A';
    network.ip6Display.textContent = active.ip6 || 'N/A';
    network.macDisplay.textContent = active.mac || 'N/A';
    network.netmaskDisplay.textContent = active.netmask || 'N/A';
    network.typeDisplay.textContent = active.type
      ? active.type.charAt(0).toUpperCase() + active.type.slice(1)
      : 'N/A';
    network.dhcpDisplay.textContent = active.dhcp
      ? getTranslation('net_dhcp_enabled')
      : getTranslation('net_dhcp_disabled');

    network.gatewayDisplay.textContent = gateway || 'N/A';
    network.latencyDisplay.textContent =
      latency != null ? '~' + Math.round(latency) + ' ms' : 'N/A';

    renderInterfaces(interfaces);
  }

  async function fetchAndRender() {
    try {
      const data = await window.dashboardAPI.getNetworkStatus();
      render(data);
    } catch (err) {
      console.error('Error fetching network status:', err);
    }
  }

  fetchAndRender();
  setInterval(fetchAndRender, refreshMs());
})();

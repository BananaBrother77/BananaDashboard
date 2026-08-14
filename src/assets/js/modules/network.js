(async function getNetworkInterfaces() {
  const interfaces = await window.dashboardAPI.getNetworkInterfaces();
  if (!interfaces?.length) return;

  const active =
    interfaces.find((i) => !i.internal && i.operstate === 'up' && i.ip4) ??
    interfaces[0];

  network.ip4Display.textContent = active.ip4 || 'N/A';
  network.ip6Display.textContent = active.ip6 || 'N/A';
  network.macDisplay.textContent = active.mac || 'N/A';
  network.netmaskDisplay.textContent = active.netmask || 'N/A';
  network.typeDisplay.textContent =
    active.type.charAt(0).toUpperCase() + active.type.slice(1) || 'N/A';
  network.dhcpDisplay.textContent = active.dhcp
    ? getTranslation('net_dhcp_enabled')
    : getTranslation('net_dhcp_disabled');
})();

setInterval(
  getNetworkInterfaces,
  parseInt(localStorage.getItem('banana-refresh')) || 2000,
);

getNetworkInterfaces();

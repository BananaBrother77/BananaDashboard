if (rpc.bar) {
  const rpcStates = {
    connected: { cls: 'connected', key: 'rpc_connected' },
    disconnected: { cls: 'disconnected', key: 'rpc_disconnected' },
    disabled: { cls: 'disabled', key: 'rpc_disabled' },
    connecting: { cls: 'connecting', key: 'rpc_connecting' },
  };

  function updateRpcUI(status) {
    let state;

    if (!status.enabled) {
      state = rpcStates.disabled;
    } else if (status.connected) {
      state = rpcStates.connected;
    } else {
      state = rpcStates.disconnected;
    }

    rpc.bar.className = 'rpc-status ' + state.cls;
    rpc.dot.className = 'rpc-dot ' + state.cls;

    const text = getTranslation(state.key) || state.key;
    rpc.text.textContent = text;

    const isEnabled = status.enabled;
    const toggleSpan = rpc.toggle.querySelector('span');
    const toggleIcon = rpc.toggle.querySelector('i');

    if (toggleSpan) {
      toggleSpan.textContent = getTranslation(
        isEnabled ? 'rpc_disable' : 'rpc_enable',
      );
    }

    if (toggleIcon) {
      toggleIcon.setAttribute('data-lucide', isEnabled ? 'power' : 'power-off');
    }

    if (window.lucide) lucide.createIcons();
  }

  window.dashboardAPI.onRpcStatus(updateRpcUI);

  rpc.reconnect.addEventListener('click', () => {
    window.dashboardAPI.reconnectRpc();
  });

  rpc.toggle.addEventListener('click', () => {
    window.dashboardAPI.getRpcStatus().then((s) => {
      window.dashboardAPI.setRpcEnabled(!s.enabled);
    });
  });
}

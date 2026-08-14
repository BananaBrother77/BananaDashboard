const refresh = {
  globalKey: 'banana-refresh',
  moduleKeys: {
    resources: 'banana-refresh-resources',
    network: 'banana-refresh-network',
    battery: 'banana-refresh-battery',
  },
  handlers: {},

  getMs(name) {
    const overrideRaw = localStorage.getItem(this.moduleKeys[name]);
    if (overrideRaw != null) return parseInt(overrideRaw) || 0;

    const global = parseInt(localStorage.getItem(this.globalKey));

    return isNaN(global) ? 2000 : global;
  },

  register(name, fn) {
    this.handlers[name] = fn;
  },

  apply(name) {
    const fn = this.handlers[name];
    if (fn) fn(this.getMs(name));
  },

  applyAll() {
    Object.keys(this.handlers).forEach((n) => this.apply(n));
  },
};

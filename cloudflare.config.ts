export default ({ mode }: { mode?: string }) => ({
  worker: {
    name: 'microsoft-todo-capture-site',
    compatibilityDate: '2026-11-13',
    workersDev: mode === 'staging',
    domains: mode === 'staging' ? [] : ['todo-ext.waynegong.com'],
    assets: {
      htmlHandling: 'auto-trailing-slash',
      notFoundHandling: '404-page',
    },
  },
});

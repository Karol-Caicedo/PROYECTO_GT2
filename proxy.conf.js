module.exports = {
  '/api': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
      });
    },
  },
};

export default {
  dev: {
    '/api/': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
};

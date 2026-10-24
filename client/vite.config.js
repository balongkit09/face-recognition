import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cam = (env.VITE_ESP32_CAM_URL || 'http://192.168.1.77').replace(/\/$/, '');
  let streamTarget = `${cam}:81`;
  try {
    const camUrl = new URL(cam);
    const streamPort = env.VITE_ESP32_CAM_STREAM_PORT || '81';
    streamTarget = `${camUrl.protocol}//${camUrl.hostname}:${streamPort}`;
  } catch {
    /* keep default */
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/esp32-cam': {
          target: cam,
          changeOrigin: true,
          timeout: 4000,
          proxyTimeout: 4000,
          rewrite: (path) => path.replace(/^\/esp32-cam/, '') || '/',
        },
        '/esp32-cam-stream': {
          target: streamTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/esp32-cam-stream/, '') || '/',
        },
      },
    },
  };
});

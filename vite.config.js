import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                configure: function (proxy, options) {
                    proxy.on('error', function (err, req, res) {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', function (proxyReq, req, res) {
                        console.log('Sending Request:', req.method, req.url);
                    });
                    proxy.on('proxyRes', function (proxyRes, req, res) {
                        console.log('Received Response:', proxyRes.statusCode);
                    });
                }
            }
        }
    }
});

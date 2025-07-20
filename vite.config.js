import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
// https://vite.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // 加载环境变量
    var env = loadEnv(mode, process.cwd());
    return {
        base: '/',
        build: {
            outDir: 'dist'
        },
        plugins: [vue()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        server: {
            proxy: {
                '/api': {
                    target: env.VITE_API_BASE_URL || 'http://localhost:5000',
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
    };
});

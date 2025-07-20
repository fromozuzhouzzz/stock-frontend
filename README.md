# 库存管理系统前端

## 部署说明

### Cloudflare Pages 部署

本项目已配置为可直接部署到 Cloudflare Pages。

#### 构建配置

在 Cloudflare Pages 中使用以下构建设置：

```
构建命令: npm run build
构建输出目录: dist
Node.js 版本: 18.x
```

#### 环境变量配置

在 Cloudflare Pages 的环境变量设置中配置：

```bash
VITE_API_BASE_URL=https://your-backend-domain.hf.space
```

#### 部署步骤

1. 将代码推送到 GitHub 仓库
2. 登录 Cloudflare Dashboard
3. 进入 Pages 板块
4. 点击 "Create a project"
5. 选择 "Connect to Git"
6. 选择前端仓库
7. 配置构建设置和环境变量
8. 部署完成

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Axios
- ECharts

## 功能特性

- 用户认证和权限管理
- 库存管理和预警
- 物料管理
- 门店管理
- 销售记录和统计
- 数据导出功能
- 响应式设计

## 环境配置

项目支持多环境配置：

- `.env` - 默认环境变量
- `.env.production` - 生产环境变量

主要环境变量：

```bash
VITE_API_BASE_URL=https://your-backend-api-url
```

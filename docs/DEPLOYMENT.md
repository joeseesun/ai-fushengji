# 静态部署

域名：`https://fusheng.qiaomu.ai/`。源码：`https://github.com/joeseesun/ai-fushengji`。

纯静态浏览器游戏，无 Node 生产进程、数据库或 Docker 依赖。`npm run build` 输出 `dist/`，任何支持 HTTPS 的静态服务器均可部署。

VPS 使用独立目录 `/opt/qiaomu-apps/ai-fushengji/releases/<commit>/`，`current` 链接指向已验证版本。Nginx 配置为 `/www/server/panel/vhost/nginx/fusheng.qiaomu.ai.conf`。更新先上传到新目录，验证后切换链接；回滚切回前一目录即可。

- HTML 与 `sw.js` 使用 `Cache-Control: no-cache`。
- Vite 哈希资产可长期缓存；非哈希插画、二维码不设 immutable。
- `version.json` 记录完整 Git SHA 与构建内容摘要，发布后读取核对。
- Service Worker 按内容摘要区分缓存。新 worker 等现有页面关闭后激活，避免中途换版本；存档仍在 localStorage。
- DNS 为单独 A 记录；HTTPS 使用 Certbot webroot，HTTP 保留 ACME challenge 路径。
- Umami 网站 ID：`e5ce8652-be2a-4be4-b92d-98602aef4f57`。仅对正式域名统计访问，不上传存档，不启用会话录像。

上线核对：CI、版本 JSON、主页 HTTPS、重定向、脚本/插画 HTTP 200、桌面与移动页面、二维码弹层、离线重载与存档恢复。构建、上线和浏览器运行分别验收。

# 游戏与排行榜部署

域名：`https://fusheng.qiaomu.ai/`。源码：`https://github.com/joeseesun/ai-fushengji`。

主游戏仍可独立静态运行。`npm run build` 输出 `dist/`，任何支持 HTTPS 的静态服务器均可部署。v0.7 起，全服榜增加独立 Node.js 24 服务和 SQLite 数据库；后端离线不影响主游戏与本机记录。

VPS 使用独立目录 `/opt/qiaomu-apps/ai-fushengji/releases/<commit>/`，`current` 链接指向已验证版本。Nginx 配置为 `/www/server/panel/vhost/nginx/fusheng.qiaomu.ai.conf`。更新先上传到新目录，验证后切换链接；回滚切回前一目录即可。

- HTML 与 `sw.js` 使用 `Cache-Control: no-cache`。
- Vite 哈希资产可长期缓存；非哈希插画、二维码不设 immutable。
- `version.json` 记录完整 Git SHA 与构建内容摘要，发布后读取核对。
- Service Worker 按内容摘要区分缓存。完整预缓存后新 worker 立即接管；不自动刷新正在玩的页面。在线手动刷新优先取新 HTML，离线使用完整缓存。旧资产在所有已开页面确认当前入口前保留，避免旧页面断资源；存档仍在 localStorage。UI 补丁 0.11.1 沿用 0.11.0 经济规则与榜单后端，无需重启榜单服务。
- DNS 为单独 A 记录；HTTPS 使用 Certbot webroot，HTTP 保留 ACME challenge 路径。
- Umami 网站 ID：`e5ce8652-be2a-4be4-b92d-98602aef4f57`。仅对正式域名统计访问，不上传存档，不启用会话录像。

上线核对：默认 CI 构建、版本 JSON、主页和脚本 HTTPS、榜单健康与读取接口、本次涉及的关键界面。构建、上线和浏览器运行分别验收，不默认重跑整局。

## 全服榜服务

- `npm run server` 默认绑定 `127.0.0.1:3491`，数据库为 `data/leaderboard.sqlite`。开发与预览由 Vite 代理 `/api/`；`PUBLIC_ORIGIN` 默认 `http://127.0.0.1:5173`，其他开发端口需显式设置。
- 生产使用本仓库 `compose.yaml`，仅发布 `127.0.0.1:3491:3491`，Node 用户运行，无外部依赖安装。首次创建 `/opt/qiaomu-apps/ai-fushengji/data`，属主 UID/GID 1000；数据绑定到容器 `/data`，不放在静态 releases 中。
- 后端源码放 `/opt/qiaomu-apps/ai-fushengji/backend/<commit>`，从该目录运行 `docker compose -p ai-fushengji up -d --build`。部署时前后端使用同一提交；保留上个版本镜像和源码以便回滚。数据库不得随前端回滚或重建删除。
- Nginx 在本站 HTTPS server 中增加以下代理，后端不直接暴露公网：

```nginx
location ^~ /api/ {
    client_max_body_size 100k;
    proxy_pass http://127.0.0.1:3491;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 3s;
    proxy_read_timeout 12s;
}
```

修改前备份本站 vhost，`nginx -t` 通过后 reload。`GET /api/health` 返回规则版本和记录数，`GET /api/leaderboard` 返回排行榜。Service Worker 不缓存 `/api/`。发布只读回读公网，不把测试玩家留在正式榜单。

## 排名、数据与边界

- `POST /api/leaderboard` 接收昵称、规则版本、种子、职业及完整操作。服务器复用纯引擎重放，不接收客户端金额作为成绩，只接受已经结束的合法对局。同规则版本 + 种子 + 职业为一局，重试幂等，不覆盖原昵称。
- 通关优先，其次净资产、存活天数，同分先提交优先；按对局排名，不声称按真人去重。无需登录，不提供竞技级防刷或阻止挑种子能力。完整操作只在内存核算，数据库只存昵称和结算指标，不存 IP。
- 请求上限 100,000 字节、1,200 次操作；单次核算限时 1.5 秒；写入每来源 10 分钟最多 10 次，读取每分钟 120 次。限流信息只留内存，使用参数绑定写入 SQLite。生产 `TRUST_PROXY=1` 仅在回环绑定且 Nginx 覆盖来源头时使用。
- 昵称在客户端和服务端均校验，页面转义。玩家主动提交前说明公开范围；不自动上传、不填虚构榜单。网络失败保留本机进度，可重试。
- 规则版本固定在 `src/run-proof.js`。修改经济、内容或模型快照会改变重放，必须新建规则版本，并明确是否保留旧版本验证器；不能使用新规则默默重算旧局。旧 v6 存档无完整操作历史，不能上全服榜；v7 原局可离线保存后提交。
- SQLite 使用 WAL。维护前可停本项目容器后备份整个 data 目录，恢复原容器，再继续部署；运行中不可只复制主库遗漏 WAL。现有记录不随容器重建消失。不要执行删除 volume 或数据库的清理命令。

实现依据：[Node SQLite 文档](https://nodejs.org/api/sqlite.html)、[Docker 回环端口绑定](https://docs.docker.com/engine/network/port-publishing/)。实际本地运行与生产容器结果单独记录。


## v0.10.0 存档与规则边界

多存档以 `ai-fushengji-slots-v1` 单键原子保存，最多六局，旧 `ai-fushengji-save-v1` 不删除。迁移保留当天报价、资源、RNG 和已公告行程，后续应用新版成长规则；旧局证明失效，仅可继续离线/本机记录，不补造历史上新版榜单。新局核算版本为 0.10.0，前后端必须一起发布。旧榜单行保留，旧版本验证器未保留。回滚旧前端不能读取新多存档键，只会读取迁移前的旧单局副本；新局须先导出，不能将回滚描述为完整恢复新进度。


## v0.11.0 项目规则边界

存档升到 v11，跨日项目记录签约日、截止日、锁定报价、范围选择和进度。v10 及以前迁移补空项目，余额、行情、RNG 保留；旧证明清空，新项目与零工收益规则从继续游玩起生效。全服榜核算版本 0.11.0，前后端同提交部署；已有成绩保留，未保留旧版本核算器。回滚 v0.10 不能读取 v11 单局，须先导出新版存档并恢复对应版本；数据库不随回滚删除。

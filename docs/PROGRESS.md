# AI 浮生记交付记录

更新时间：2026-10-28。视觉方向已确认 A「千禧年打工桌面」。

## 功能范围

40 天生存交易；80 个日常事件、5 个阶段剧情、2 个条件后续；42 张可收集梗图；34 个模型条目、25 个家族；H200/B300/5090 机时交易，OpenRouter 与 AA 榜单事件。包含用户指定的梁圣滑块、大肥鱼、用户暴怒、震惊瘫坐，以及六位领袖。模型版本按当日来源核对，删除 Command/Cohere。

## 已验证证据

- 25 项 Node 测试，含 100 局不同种子模拟。
- 4 组生产构建浏览器测试：桌面与移动各完整操作 40 天，320px 无横溢，买卖、模型合约、刷新、存档导入/错误/存储失败，图鉴来源、结局 PNG、离线恢复、支持/关注图片。
- GitHub 初始实现检查通过：[功能分支 CI](https://github.com/joeseesun/ai-fushengji/actions/runs/40629931579)、[PR 检查](https://github.com/joeseesun/ai-fushengji/actions/runs/40629986867)。
- 域名 DNS 已创建，HTTPS 证书签发；HTTP 跳转 HTTPS，Certbot 模拟续期成功。候选静态构建在公开域名可访问。
- 离线检查曾发现 Vary: Origin 导致缓存无法匹配脚本；已修复并通过断网重载回归。

## 交付定位

试玩：[fusheng.qiaomu.ai](https://fusheng.qiaomu.ai/)。[源代码与 PR #1](https://github.com/joeseesun/ai-fushengji/pull/1)。正式版本与资产以 [Releases](https://github.com/joeseesun/ai-fushengji/releases) 为准，线上源码身份见 [version.json](https://fusheng.qiaomu.ai/version.json)。最终发布证据同时记录在本地 .qiaomu/launch-state.json 与当前聊天交付回复中。

VPS 目录 /opt/qiaomu-apps/ai-fushengji，静态 Nginx，无 Docker 运行依赖。已保存部署与回滚方式，见 DEPLOYMENT.md。

## 验收边界

浏览器移动视口不等于真机。自动策略通过不等于真人觉得平衡或好玩，多人试玩反馈尚未取得。人物剧情为虚构恶搞；模型加成、游戏货币与行情均非现实评测或报价。进度留在本机，游戏不调用付费模型接口。

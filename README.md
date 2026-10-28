# AI 浮生记

**模型在进化，你还好吗？**

带着 8,000 元培训贷，进入人人都说自己快要被 AI 替代的时代。你有 40 天：倒腾算力、接单、学原理、做产品，也得吃饭睡觉。梁圣的称呼可以滑动，房租不会。

[开始游戏](https://fusheng.qiaomu.ai/) · [研究出处](docs/RESEARCH.md) · [梗图清单](docs/MEMES.md) · [模型版本](docs/MODELS.md) · [English](#english)

![千禧年桌面与梁圣滑动变阻器](docs/screenshots/desktop.png)

## 能玩什么

- 40 天生存交易，3 种开局、6 个站点、8 类商品、每天 2 格行动，债务、健康、压力、技能与技术债互相牵制。
- 80 个日常事件、5 个阶段剧情、2 个条件后续；42 张可收集梗图：大肥鱼吃白饭、服务器繁忙、用户彻底怒了、草莓数 r、皮衣显卡、烤肉酱、Claude 钨块小卖部……
- 梁文峰、黄仁勋、马斯克、扎克伯格、奥特曼、达里奥以虚构恶搞角色出场。9 格原创像素插画，搭配事件字幕。
- 34 个可签约模型、25 个国内外家族。名称在 2026-10-28 核对；模型搭子分四种游戏加成，不是现实能力榜。合约使用游戏币，最多五天，不自动续费。
- H200 / B300 / 5090 机时交易，OpenRouter 调用热潮、AA 榜单换位、新模型发布会改变行情。报价和流量为游戏模拟。
- 自动存档、JSON 导入导出、结局 PNG、离线续玩，以及 F2「老板来了」。适配手机。

人物对白和商业情节为虚构讽刺。本作不调用真实模型接口，没有付费功能。进度仅在浏览器本地；公开网站使用 Umami 统计访问，不上传存档或玩家的游戏数据。

## 本地运行

Node.js 24+：

```sh
npm ci
npm run dev
```

```sh
npm test             # 25 项测试，含 100 局种子模拟
npm run test:e2e     # 构建并启动独立预览，完整浏览器验收
npm run build       # dist/，含按内容哈希版本化的离线缓存
npm run package     # release/ai-fushengji-0.2.0-web.zip
```

本地浏览器测试默认使用 Chrome。CI 使用 Playwright Chromium；可用 `CI=1 npx playwright install chromium` 安装后运行。`TEST_URL` 可覆盖待测地址。

更新模型目录：`npm run refresh:models`。然后人工审阅 `src/models.js` 的主阵容，核对官方来源，并更新日期和文档。Command / Cohere 会在刷新时被过滤。

## 实现与验证

原生 JavaScript + Vite + Lucide。引擎为纯状态转换，RNG 随存档保存，刷新不能重抽报价或风险结果。低买高卖有 10% 价差；第 40 天仍可行动，最终清算只结一次账。非法输入不改变状态，导入校验不通过不覆盖当前局。

通过桌面与移动各一局完整 40 天浏览器操作、320px 布局、坏存档、存储失败、有效导入、离线恢复、图鉴和 PNG 导出。100 局保守策略模拟均存活；这不代替真实玩家对难度、文案和乐趣的反馈。

部署为纯静态站点，见 [部署说明](docs/DEPLOYMENT.md)。保留 [设计记录](DESIGN.md) 和 [规则](docs/GAME-DESIGN.md)。

## 来源与许可

灵感来自 [郭祥昊《北京浮生记》](https://github.com/chrisguo/beijing_fushengji)，未使用原作代码、文本或美术。代码与原创内容采用 [MIT](LICENSE)。人物与品牌名称属于其权利人，不表示合作或认可。图片为本作生成的原创像素插画；第三方梗图仅提供研究链接，没有搬运打包。

作者：[向阳乔木](https://qiaomu.ai/) · [X](https://x.com/vista8) · [乔木推荐](https://tuijian.qiaomu.ai/)

## English

**AI Life Simulator** is a free, Chinese-language, single-player browser game inspired by the 40-day survival and trading loop of *Beijing Fushengji*. Trade GPU time, pay off training debt, deliver client work, build small products, and protect your health in a rapidly changing AI economy.

It includes 80 everyday events, 5 milestones, 2 conditional follow-ups, 42 collectible meme cards, and 34 model companions across 25 families. Public AI figures appear in clearly fictional satirical scenes. All prices, model bonuses, leaderboards, and traffic changes are game mechanics rather than real-world claims. No model API or API key is required.

Local saves, import/export, ending-card PNG export, mobile layouts, and offline play are supported. The public site uses Umami for page analytics; game saves stay on your device. Use Node.js 24+, `npm ci`, and `npm run dev`. Run `npm test` and `npm run test:e2e` to validate the game. Code and original content are MIT licensed; no original Beijing Fushengji assets are reused.

## 单屏玩法（v0.2.0）

目标和下一步始终可见：处理事件 → 自选两次行动 → 选站、结束今天。桌面三栏；窄屏按钮切换，长内容点按钮翻页，无需上下左右滚动。完整模型与梗图内容保留。调研与布局验证见 [UX-RESEARCH.md](docs/UX-RESEARCH.md)。

已打开的旧版本页面可使用浏览器强制刷新（macOS：⌘⇧R），或关闭此站全部标签后重新打开；无需清除存档。

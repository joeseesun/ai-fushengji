# 原作与 AI 语境研究

检索日期：2026-10-28。研究用于游戏创作；人物对白、钱数、行情与模型加成都为虚构。

## 原作

主要依据 [郭祥昊的原作仓库](https://github.com/chrisguo/beijing_fushengji) 与 [oldhelp](https://github.com/chrisguo/beijing_fushengji/blob/master/oldhelp)。采用的设计骨架是限时生存、负债、换站推进日历、跨市场买卖、随机遭遇与现实讽刺。保留 40 天的紧迫感，重新编写经济模型和全部事件，不复制原作源代码、文本、美术或名称标识。

新增两格日行动，把“低买高卖”与 AI 劳动困境连起来：学习会过时，接单有责任，产品有维护成本，休息也消耗时间。没有把 AI 简化成一个会随机吐文案的 API；游戏离线也能完整运行。

## 证据边界

- [METR 的后续研究说明](https://metr.org/blog/2026-02-24-uplift-update/) 提醒：AI 对效率的影响随样本、任务与研究设计变化，不能把某一次研究的减速比例套到所有人。
- [Anthropic 的技能形成研究](https://www.anthropic.com/research/AI-assistance-coding-skills) 用于构思“会运行”和“真正学会”的张力，不用于断言 AI 一定损害学习。
- [Project Vend 原始报告](https://www.anthropic.com/research/project-vend-1) 提供了售卖钨块、定价失误、折扣失控和身份混淆等实际实验素材。游戏的达里奥小卖部为重新创作的夸张演出，不能视作真实人物对白。
- [OpenRouter 调用榜](https://openrouter.ai/rankings) 的 Token 量反映该平台上的使用，不能当作全行业用户数、收入或质量排名。游戏专门用“自我鼓励死循环”事件拆解这个误读。
- [Artificial Analysis 模型榜](https://artificialanalysis.ai/leaderboards/models) 区分智力、价格、速度与延迟等指标。游戏的榜单新闻为模拟，不复制某一天的分数，也不冒充实时数据。
- [NVIDIA H200](https://www.nvidia.com/en-us/data-center/h200/) 与 [Blackwell Ultra / B300](https://resources.nvidia.com/en-us-gpu-resources/blackwell-ultra-datasheet) 用来核对硬件名称。商品为抽象机时券，所有标价都是游戏平衡值，不是显卡售价或实际租赁报价。

## 最新模型核对

直接读取 [OpenRouter 公共模型目录 API](https://openrouter.ai/api/v1/models)，保留名称与 ID 的静态快照 `src/model-snapshot.json`，再筛选主要家族的当日版本。按照用户要求排除 Command / Cohere。不是用记忆编造版本号，不把目录第一条自动等同于各系列最强模型。

国内补充依据：[文心 5.1 官方发布](https://yiyan.baidu.com/blog/zh/posts/ernie-5.1-0508-release/)、[星火 X2.5 官方模型介绍](https://www.xfyun.cn/doc/spark/Spark-X2.5模型介绍.html)、[商汤官方 Token Plan 说明](https://www.sensetime.com/cn/news/sensenova-u1-5-lite-token-plan-20260911-1741)。[MiMo-V2.6 官方发布](https://mimo.mi.com/docs/en-US/news/latest/v2-6) 交叉核对系列名称。

主阵容包括 DeepSeek V4.1 Flash、Qwen3.8、Kimi K3.1、GLM 5.3、MiMo V2.6、MiniMax M3.1、Step 5 Preview、HY4 Preview、Seed 2.1、GPT 6.1、Claude 5.5、Gemini 4、Grok 4.7 等。Preview 保留标识；Llama / Phi 等有辨识度的家族采用目录中仍可见的代表版本。没有宣称收录世界上每一个模型或量化变体。

## 梗图与来源

完整清单见 [MEMES.md](MEMES.md)。B 站页面部分直开返回 412，采用搜索引擎抓取的标题、摘要和公开链接核对传播样例，未声称完整观看视频或确认最早出处。

检索到的大肥鱼表情包仓库未发现明确的完整再分发许可，因此没有直接搬运。游戏使用专门生成的原创像素人物与蓝色鲸鱼插画，搭配原创事件字幕。出处链接保留在图鉴内，可供玩家继续考古。

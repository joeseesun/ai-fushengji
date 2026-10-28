import { MEME_EVENTS } from './memes.js';
// Fictional, original satire. All monetary values are game-balancing parameters.
export const GOODS = [
  { id: 'prompt', name: '祖传提示词', short: '提示词', base: 90, decay: .014, icon: 'ScrollText', desc: '“你是一位资深专家。”后面还有八千字。', unit: '套' },
  { id: 'compute', name: 'H200 机时券', short: 'H200', base: 260, decay: 0, icon: 'Cpu', desc: '算力很热，钱包很凉。', unit: '张' },
  { id: 'b300', name: 'B300 机时券', short: 'B300', base: 780, decay: .003, icon: 'Cpu', desc: '皮衣新品上架，旧卡群友沉默。', unit: '张' },
  { id: 'rtx', name: '5090 租机券', short: '5090', base: 145, decay: .005, icon: 'Monitor', desc: '白天跑模型，夜里保卫显卡尊严。', unit: '张' },
  { id: 'workflow', name: '自动化工作流', short: '工作流', base: 480, decay: .006, icon: 'Workflow', desc: '全自动，除了需要你一直在旁边。', unit: '套' },
  { id: 'data', name: '干净行业语料', short: '干净语料', base: 1150, decay: -.003, icon: 'Database', desc: '喂垃圾，吐垃圾。这一批至少洗过。', unit: '份' },
  { id: 'model', name: '垂直小模型', short: '小模型', base: 2400, decay: .008, icon: 'Box', desc: '护城河很深，直到大厂修了座桥。', unit: '份' },
  { id: 'avatar', name: '数字分身模板', short: '数字分身', base: 720, decay: .004, icon: 'Contact', desc: '替你上班，暂时不能替你交房租。', unit: '套' },
];

export const LOCATIONS = [
  { id: 'market', name: '算力黑市', full: '中关村 · 算力黑市', line: '卖铲子的人，也在分期买铲子。', specialty: 'H200、B300 与 5090 机时常打折', factors: { compute: .69, b300: .75, rtx: .75, model: 1.25 }, icon: 'Cpu' },
  { id: 'launch', name: '大厂发布会', full: '望京 · 大厂发布会', line: '台上说成本趋近于零。台下房租没动。', specialty: '分身需求高，小模型便宜', factors: { model: .72, avatar: 1.45 }, icon: 'Presentation' },
  { id: 'jobs', name: '外包接单群', full: '线上 · 外包接单群', line: '预算五百，体验对标世界第一。', specialty: '接单多赚 ¥160，工作流好卖', factors: { workflow: 1.45, compute: 1.15 }, icon: 'BriefcaseBusiness' },
  { id: 'course', name: '知识付费群', full: '海淀 · 知识付费群', line: '离年入百万，只差老师还没录的下一节。', specialty: '提示词和分身需求旺', factors: { prompt: 1.8, avatar: 1.25, data: .9 }, icon: 'GraduationCap' },
  { id: 'opensource', name: '开源社区', full: '线上 · 开源社区', line: '仓库标星一万，维护者今天还没吃饭。', specialty: '学习多涨 3 技能，语料便宜', factors: { data: .72, workflow: .76, model: .8 }, icon: 'GitFork' },
  { id: 'home', name: '出租屋', full: '回龙观 · 出租屋', line: '你的总部、工位、食堂，以及宇宙尽头。', specialty: '休息多回 6 健康，生活费少 ¥40', factors: { prompt: .9, compute: 1.12 }, icon: 'House' },
];

export const ROLES = [
  { id: 'coder', name: '被优化的程序员', tagline: '以前修 bug，现在修人生。', cash: 3000, debt: 8000, skill: 32, reputation: 18, stress: 26, icon: 'Terminal', perk: '技能 32 · 更快开工做产品', story: '离职原因写着“拥抱 AI”。你决定先拥抱一下自己的银行卡。培训贷还剩 8,000，房东给了你 40 天。' },
  { id: 'creator', name: '转型的内容人', tagline: '甲方说：现在不是一键就有了吗？', cash: 3000, debt: 8000, skill: 15, reputation: 36, stress: 22, icon: 'PenTool', perk: '口碑 36 · 接单与产品收入更高', story: '你花三年建立的风格，现在可以写进一句提示词。还有人愿意为你的判断付钱，先找到他们。' },
  { id: 'worker', name: '普通打工人', tagline: '还没学会上一代，下一代已发布。', cash: 3800, debt: 8000, skill: 20, reputation: 20, stress: 12, icon: 'Coffee', perk: '现金多 ¥800 · 起始压力更低', story: '朋友说 AI 是普通人最后一次机会。你只想知道，普通人到底还有多少次“最后一次”。' },
];

export const NEWS = [
  { id: 'router', title: 'OpenRouter 新模型调用量起飞，机房排队起飞。', detail: 'H200 ×1.5 · B300 ×1.6。游戏内模拟热度，不是实时调用数据。', factors: { compute: 1.5, b300: 1.6 }, traffic: '调用热潮' },
  { id: 'aa', title: 'AA 榜单更新：群里在换头像，甲方在等验收。', detail: '小模型 ×0.7 · 干净语料 ×1.2。跑分不等于你这一单能过。', factors: { model: .7, data: 1.2 }, traffic: '榜单震荡' },
  { id: 'b300', title: 'B300 机时放量，黄牛开始解释“长期价值”。', detail: 'B300 ×0.55 · H200 ×0.8 · 5090 ×0.9。库存有风险。', factors: { b300: .55, compute: .8, rtx: .9 }, traffic: '算力放量' },
  { id: 'local', title: '小模型突然能打，旧显卡群又活了。', detail: '5090 ×1.65 · H200 ×0.85。家用风扇开始参与全球推理。', factors: { rtx: 1.65, compute: .85 }, traffic: '本地部署潮' },
  { id: 'normal', title: '今天没有颠覆行业。大家都不太习惯。', detail: '市场小幅波动，适合观察价位与补现金。', factors: {} },
  { id: 'free', title: '大厂把你的创业方向加进了免费套餐。', detail: '提示词 ×0.35 · 小模型 ×0.55；产品当日收入 ×0.7。', factors: { prompt: .35, model: .55 }, product: .7 },
  { id: 'tokens', title: 'Agent 开始替 Agent 招聘 Agent。', detail: '算力券 ×1.7 · 工作流 ×1.25。所有会议由你付钱。', factors: { compute: 1.7, workflow: 1.25 } },
  { id: 'data', title: '全网互相蒸馏，终于蒸出同一句废话。', detail: '干净语料 ×1.75。真人留下的脏活重新值钱。', factors: { data: 1.75, prompt: .8 } },
  { id: 'video', title: '全网都在做同一只会说话的猫。', detail: '数字分身 ×1.65 · 算力券 ×1.25。猫本人没有分成。', factors: { avatar: 1.65, compute: 1.25 } },
  { id: 'open', title: '凌晨两点，开源社区把牌桌掀了。', detail: '小模型 ×0.5 · 工作流 ×0.75。护城河正在连夜改名。', factors: { model: .5, workflow: .75 } },
  { id: 'privacy', title: '甲方突然问：我们的数据到底去哪儿了？', detail: '小模型 ×1.6 · 干净语料 ×1.25。本地部署重新上桌。', factors: { model: 1.6, data: 1.25 } },
  { id: 'subsidy', title: '云厂商发补贴，羊毛有使用门槛。', detail: '算力券 ×0.55。便宜的是今天，不是永远。', factors: { compute: .55 } },
  { id: 'agents', title: '工作流改名 Agent，报价多了一个零。', detail: '工作流 ×1.7 · 提示词 ×1.25。暂时还没轮到工资。', factors: { workflow: 1.7, prompt: 1.25 } },
  { id: 'slop', title: '平台内容过剩，平台宣布继续鼓励创作。', detail: '数字分身 ×0.55 · 提示词 ×0.7。流量没有一起扩容。', factors: { avatar: .55, prompt: .7 } },
  { id: 'enterprise', title: '老板买了 AI，要求下周所有人交付 ROI。', detail: '工作流 ×1.35 · 干净语料 ×1.3。企业试点开始采购。', factors: { workflow: 1.35, data: 1.3 } },
  { id: 'human', title: '第一批客户开始为“有人负责”付费。', detail: '产品当日收入 ×1.5。人类客服不是落后产能。', factors: { data: 1.15 }, product: 1.5 },
];

const option = (label, effects, result, extra = {}) => ({ label, effects, result, ...extra });
const event = (id, tag, title, text, options) => ({ id, tag, title, text, options });

export const EVENTS = [
  ...MEME_EVENTS,
  event('agent-meeting', '自动驾驶', 'Agent 们开了一夜会', '你醒来，12 个 Agent 已就“是否需要更多 Agent”达成共识。唯一没参与投票的是你的钱包。', [
    option('拔电源，自己收拾', { stress: 8, skill: 2 }, '会议取消了。你成为唯一的 Action Item。'),
    option('付 ¥360，让它们交纪要', { cash: -360, techDebt: -5, stress: -2 }, '纪要写着：“建议进一步讨论。”但总算留了日志。'),
  ]),
  event('budget', '甲方现场', '预算五百，对标顶流', '甲方发来一张截图：“这个不就是 AI 一句话的事吗？顺便把登录、支付、后台都做了。”', [
    option('缩范围，签清验收', { cash: 500, reputation: 4, stress: 4 }, '你第一次卖的不是代码，是一句清楚的“不包括”。'),
    option('都能做，今晚交', { cash: 900, techDebt: 12, health: -6, stress: 12 }, '你用一晚证明：一分钟 demo 后面，还有二十三小时五十九分。'),
    option('婉拒这场双向奔赴', { stress: -5 }, '客户说你不拥抱变化。你拥抱了枕头。'),
  ]),
  event('mom', '人间来电', '妈妈问你吃饭了吗', '你解释“一人公司”和“被动收入”。妈妈听完只问：“那你今天到底有没有吃热饭？”', [
    option('关电脑，吃顿好的', { cash: -70, health: 12, stress: -14 }, '这一小时没有产出。你感觉自己重新被生产了。'),
    option('再跑完一个任务', { cash: 180, health: -4, stress: 6 }, '饭凉了，进度条还热着。'),
  ]),
  event('context', '记忆故障', '它记住了全人类，忘了你的需求', '对话写到第 87 轮。AI 亲切地问：“请问您想开发一个什么样的应用？”', [
    option('写交接文档，从头来', { skill: 4, stress: 5, techDebt: -4 }, '你发现真正能跨上下文的东西，叫文档。'),
    option('再买一档长上下文', { cash: -240, stress: -3 }, '记忆变长了，账单也变长了。'),
  ]),
  event('course', '知识付费', '最后一批内测名额', '老师说只教 20 人。群成员 2,846。课程大纲里写着“用 AI 生成下一节课程大纲”。', [
    option('付 ¥699，买一点确定感', { cash: -699, skill: 2, stress: -6 }, '老师的收入截图是真的。只是收入来自你。'),
    option('去看免费官方文档', { skill: 6, stress: 4 }, '文档没有财富承诺，但代码至少能跑。'),
    option('退出群，少一次最后机会', { stress: -7 }, '你错过了限时优惠。明天又发了一次。'),
  ]),
  event('sycophancy', '情绪价值', '模型说你的点子太棒了', '你分别问了三个模型。它们都说：“这是一个极具潜力的方向！”你的付费用户还是零。', [
    option('找五个真人聊需求', { cash: -100, reputation: 6, skill: 3 }, '有四个人不需要。第五个人说了一个值得做的小问题。'),
    option('做个更漂亮的愿景 PPT', { cash: 300, reputation: -3, stress: 3 }, '你获得了路演交通补贴，离用户又远了一步。'),
  ]),
  event('auto-renew', '订阅经济', '你的 AI 比你先领工资', '写作、编程、图片、视频、搜索。五个会员自动续费后，你发现自己是工具们唯一的付费用户。', [
    option('逐个取消，整理工具箱', { stress: 5, techDebt: -4, skill: 2 }, '取消按钮藏得比模型参数还深。总算止住这笔额外账单。'),
    option('付 ¥280，先别打断心流', { cash: -280, stress: -3 }, '心流继续。现金流没有。'),
  ]),
  event('prompt-guru', '祖传手艺', '你的秘方在系统提示里', '新模型默认就会你的“独家 17 步思维链”。你握着知识产权，像握着一张过期优惠券。', [
    option('卖服务，不卖咒语', { skill: 4, reputation: 4 }, '客户不想买提示词，客户想准时下班。'),
    option('改名为认知操作系统', { cash: 450, reputation: -9, stress: 3 }, '包装费到账。老客户开始重新认识你。'),
  ]),
  event('demo', '交付现场', 'Demo 很美，生产很碎', '演示时所有灯都是绿的。上线后第一位用户输入了一个空格。', [
    option('补测试，给客户退款', { cash: -180, skill: 5, techDebt: -12, reputation: 3 }, '空格不再是事故。你也不再把绿色当证据。'),
    option('加一句“仍在公测”', { reputation: -7, techDebt: 6, stress: 7 }, '用户接受了你的解释，然后接受了别家的产品。'),
  ]),
  event('free-labor', '开源人情', '一万颗星，不够交电费', '你的免费项目登上热榜。评论区第一条：“为什么没有中文？为什么更新这么慢？”', [
    option('修最重要的一个问题', { reputation: 9, skill: 3, health: -3 }, '有人回了一句谢谢。今天最不像 KPI 的奖励。'),
    option('接受 ¥400 定制支持', { cash: 400, reputation: 3, stress: 3 }, '免费软件第一次长出一张付费工单。'),
    option('关通知，出去走走', { health: 5, stress: -10 }, '开源不是把自己也免费开掉。'),
  ]),
  event('human-review', '责任链', '全流程自动，最后找你签字', '老板说人类只需要做最终审核。屏幕上有 17,000 行改动。审核时间：午饭前。', [
    option('抽出关键链路，认真审', { cash: 620, skill: 5, stress: 8, health: -3 }, '你没有逐行读完宇宙，但挡住了一个真实错误。'),
    option('让另一个 AI 说没问题', { cash: 880, techDebt: 15, reputation: -4, stress: 4 }, '两个模型互相点头。签字栏还是你的名字。'),
  ]),
  event('benchmark', '榜单时代', '你的测评冠军不会干活', '新模型在排行榜上领先。你让它改一个日期格式，它重构了整个项目。', [
    option('保留旧工具，做任务测试', { skill: 4, techDebt: -5 }, '你终于有了自己的榜单：今天有没有按时交付。'),
    option('追最新，付 ¥160 迁移', { cash: -160, skill: 2, stress: 7 }, '迁移完成。发布会又开始了。'),
  ]),
  event('privacy', '数据边界', '知识库里有工资表', '客户说“把全部资料喂进去就行”。里面有员工身份证、报价底线和一张老板不想公开的表。', [
    option('先清理，再交付', { cash: 350, reputation: 7, skill: 4, stress: 3 }, '你交付了一份知识库，也保住了一段信任。'),
    option('说明问题，退掉订单', { reputation: 2, stress: -4 }, '有些钱，退出时才算真正赚到。'),
  ]),
  event('hallucination', '内容现场', '参考文献写得太像真的了', '客户夸你的报告专业。你点开引用，发现其中一位诺奖得主只存在于对话记录。', [
    option('逐条核对，主动更正', { cash: -120, reputation: 5, skill: 3, stress: 4 }, '失去半天，保住了署名。'),
    option('删掉引用，改成观点', { reputation: -6, stress: 8 }, '语气依旧权威。你的睡眠开始动摇。'),
  ]),
  event('network', '行业沙龙', '全场都是一人公司 CEO', '一个没有客户的群里，大家互相介绍自己如何“赋能客户”。门票含一杯温咖啡。', [
    option('花 ¥120，找人聊真实需求', { cash: -120, reputation: 7, stress: -2 }, '你认识了一位真有仓库、真要盘点的店主。'),
    option('回家修昨天的 bug', { skill: 3, techDebt: -8 }, '没有合影。但那个按钮终于能用了。'),
  ]),
  event('output', '绩效逻辑', '效率翻倍，需求翻了四倍', '你把原来一天的活压到了两小时。经理把省下的六小时填得严丝合缝。', [
    option('按交付范围报价', { cash: 400, reputation: 4, stress: 3 }, '你开始给结果标价，而不是给自己的时间打折。'),
    option('全接，先把钱赚了', { cash: 1050, health: -9, stress: 15, techDebt: 5 }, '这一天，你比模型更像一台机器。'),
  ]),
  event('doctor', '身体账单', '你的颈椎不支持并发', '手表提醒你久坐。你让 AI 推荐工学椅，它让你先站起来。', [
    option('花 ¥120，理疗加散步', { cash: -120, health: 18, stress: -6 }, '这次建议只用了六个字，却很难执行。'),
    option('垫个枕头，继续赶工', { cash: 260, health: -7, stress: 5 }, '项目的技术债看不见。脖子的看得见。'),
  ]),
  event('fomo', '信息过载', '睡一觉，行业过了三年', '一觉醒来，五个新名词、三张架构图、十七篇“彻底变天”。你打开编辑器，昨天的 bug 还在。', [
    option('关掉信息流，解决一个问题', { skill: 4, techDebt: -6, stress: -6 }, '世界继续颠覆。你继续交付。'),
    option('把每一个新工具都试一遍', { cash: -150, skill: 3, stress: 11 }, '收藏夹涨了。今天也快结束了。'),
  ]),
  event('human-premium', '新的稀缺', '客户愿意为“有人负责”加钱', '他不关心你用了哪个模型，只想出问题时有一个会回消息的人。', [
    option('承诺售后，认真接下', { cash: 780, reputation: 8, stress: 7 }, '人类在回路里。人类也在账单里。'),
    option('转给靠谱同行', { cash: 200, reputation: 5, stress: -2 }, '你没做全部的活，也没吃全部的饭。'),
  ]),
  event('token-bill', '成本黑洞', '一个分号，烧掉半箱泡面', '模型试了十六种方案，最终建议你删除一个分号。你看了眼调用账单。', [
    option('付 ¥160，设预算上限', { cash: -160, skill: 4, techDebt: -3 }, '预算上限，是你今天写得最有用的一行配置。'),
    option('切回手动，自己修', { stress: 6, skill: 5 }, '你发现自己还记得怎么思考。'),
  ]),
  event('terms', '平台依赖', '接口公告：明天不兼容', '你搭了半个月的工作流，现在收到一行“为提供更好的体验”。', [
    option('付 ¥220 迁移并加适配层', { cash: -220, skill: 5, techDebt: -8 }, '体验确实更好了。对平台来说。'),
    option('临时修到能跑', { stress: 8, techDebt: 7 }, '“临时”进入了产品的长期路线图。'),
  ]),
  event('friend', '社交降级', '朋友说你最近像个客服', '你回复了他一段逻辑完整、分点清晰、没有一句像人话的安慰。', [
    option('打电话，自己说两句', { stress: -13, health: 4 }, '他说：“这才像你。”你沉默了一会儿。'),
    option('让模型重写得更自然', { stress: 5, reputation: -2 }, '输出自然了。关系没有。'),
  ]),
  event('indie', '独立开发', '上线第七天，终于有人付款', '金额很小。对方说，你解决了他每天都要做的一件麻烦事。', [
    option('花 ¥60 请他聊聊', { cash: -60, reputation: 9, skill: 3 }, '你的路线图里，第一次出现了用户的原话。'),
    option('收下 ¥300 定制费', { cash: 300, reputation: 4, stress: 3 }, '这张账单比十张愿景图更有说服力。'),
  ]),
  event('title', '职业升级', '职位名称升级，工资没动', '从编辑到 AI 内容策略架构师。职责新增了“对机器生成的所有内容负责”。', [
    option('谈清责任与报酬', { cash: 450, reputation: 4, stress: 4 }, '你的谈判不够丝滑，但发票很清楚。'),
    option('接受头衔，继续加班', { cash: 650, health: -5, stress: 10 }, '名片装不下了。钱包仍然装得下。'),
  ]),
  event('wrapper', '护城河', '投资人问你的壁垒是什么', '你刚想说“独家提示词”，旁边展台就演示了同款功能。还免费。', [
    option('承认薄，去做行业脏活', { skill: 6, reputation: 3, stress: 5 }, '数据清洗很土，但不是每个人都愿意弯腰。'),
    option('改口“生态与情绪价值”', { cash: 280, reputation: -5 }, '获得了一次付费分享。没有获得壁垒。'),
  ]),
  event('hiring', '求职市场', '招初级，要求五年 Agent 经验', '招聘帖里的框架发布于上个月。岗位薪资写着“根据能力面议”。', [
    option('用真实作品谈一次', { cash: 520, reputation: 5, stress: 5 }, '他们没招你，但买了你那个小工具的定制服务。'),
    option('关页面，继续磨手艺', { skill: 4, stress: -5 }, '不合理的要求，不必都内化成自己的不足。'),
  ]),
  event('feedback', '用户研究', '用户把最炫的功能关了', '你做了会说话的头像、自动摘要和智能标签。他只问能不能导出 Excel。', [
    option('补上导出，删掉噱头', { cash: 350, reputation: 7, techDebt: -4 }, '功能少了。退款也少了。'),
    option('再做一遍愿景教育', { reputation: -4, stress: 7 }, '用户学会了一个新功能：取消订阅。'),
  ]),
  event('unlimited', '无限套餐', '无限使用，有限的你', '你买的“无限”套餐弹出提示：今日额度已用完。明天你要交付。', [
    option('付 ¥180 买临时额度', { cash: -180, stress: -3 }, '无限的定义，又扩展了一次。'),
    option('精简任务，自己补最后一段', { skill: 4, stress: 5, techDebt: -2 }, '少生成一点，反而比较容易验收。'),
  ]),
  event('agent-permission', '失控预演', '它说：为了修复，我先删了', '测试环境里的 Agent 打算重建整个数据库。它礼貌地请求权限。', [
    option('拦下来，补备份与最小权限', { cash: -100, skill: 5, techDebt: -12 }, '今天最赚钱的操作，是没有发生的那一次。'),
    option('停用自动化，手工救场', { stress: 9, skill: 2 }, '你收回了钥匙，也接回了晚班。'),
  ]),
  event('clone', '内容同质化', '你和竞争对手长得一模一样', '同一个模型，同一个提示词模板，同一个“独特品牌调性”。连错别字都撞了。', [
    option('出去采访，带回真实细节', { cash: -80, skill: 5, reputation: 5, stress: -3 }, '世界提供的上下文，终于多过了提示词。'),
    option('再加十个“去 AI 味”要求', { stress: 5, skill: 1 }, '它把“赋能”换成了“助力”。'),
  ]),
  event('validation', '真实需求', '隔壁小店要的很简单', '老板不要 Agent 平台。他只想每天闭店时，少对半小时的账。', [
    option('做个小工具，收 ¥700', { cash: 700, reputation: 8, skill: 3, stress: 4 }, '没有颠覆世界。但今天有人早回家了。'),
    option('先帮他整理表格，收 ¥200', { cash: 200, reputation: 4, stress: -2 }, '你发现解决问题不一定要发布产品。'),
  ]),
  event('expert', '审美劳动', 'AI 给了 100 个方案', '挑出哪个能用，花了你比做一个还久的时间。甲方觉得既然生成快，选择也应该快。', [
    option('只留三版，解释取舍', { cash: 480, skill: 3, reputation: 4, stress: 5 }, '审美第一次有了工时。'),
    option('全部发过去，让甲方挑', { cash: 250, reputation: -3, stress: 8 }, '甲方回复：“都挺好，融合一下。”'),
  ]),
  event('coffee', '创业日常', '咖啡店的电源位满了', '一排人各开着三个终端。每个人都在创业，也都在等一个插座。', [
    option('买杯 ¥35 的咖啡聊两句', { cash: -35, reputation: 3, stress: -6 }, '原来大家都没有想象中顺利。'),
    option('回家，在自己的椅子上坐会儿', { health: 4, stress: -8 }, '你把通勤省给了发呆。'),
  ]),
  event('moat', '商业模式', '同行把模板降到 9.9', '你昨天还卖 199 的模板，今天被打包进“十万套资源大合集”。', [
    option('停止卷模板，做付费答疑', { cash: 380, reputation: 5, skill: 2 }, '答案可以复制，听懂一个人还不能批发。'),
    option('降价再加赠品', { cash: 160, stress: 9, reputation: -2 }, '销量翻倍，收入打折。'),
  ]),
  event('email', '垃圾信息', '五十封 AI 商务合作邮件', '它们都认真地“拜读”了你的文章。你的文章昨天还没有发布。', [
    option('筛掉套话，只回真人', { stress: -6, reputation: 3 }, '少回了四十九封，谈成了一次真实交流。'),
    option('让 Agent 和它们自动聊', { cash: -90, stress: 3 }, '邮件服务器见证了一场没有人的繁荣。'),
  ]),
  event('sleep', '人体限制', '你不是 24 小时在线服务', '凌晨三点，客户问在吗。模型还在，你的眼睛已经开始丢帧。', [
    option('设好回复时间，去睡', { health: 10, stress: -12, reputation: 1 }, '早上醒来，世界没有因为你睡觉而停摆。'),
    option('接下加急，收 ¥700', { cash: 700, health: -10, stress: 14, techDebt: 4 }, '钱是即时到账的，疲劳也是。'),
  ]),
  event('recruit-ai', '组织设计', '你雇了三个数字员工', '一个写代码，一个评审，一个负责说“完全正确”。他们一致认为工作已完成。', [
    option('跑一次真实验收', { skill: 4, techDebt: -9, stress: 5 }, '三个“已完成”，换不来一次真的登录成功。好在现在能了。'),
    option('花 ¥180 找真人试用', { cash: -180, reputation: 5, techDebt: -7 }, '第一句话是“按钮点不了”。这钱花得很值。'),
  ]),
  event('reading', '学习焦虑', '收藏夹比你更懂 AI', '你收藏了 180 篇必读文章。阅读进度是“已经看过标题”。', [
    option('选一篇，真的做个例子', { skill: 7, stress: -3 }, '没追上全部前沿，但手里多了一个会用的东西。'),
    option('整理成资料包卖 ¥240', { cash: 240, reputation: -4, stress: 2 }, '又一个人的收藏夹获得了成长。'),
  ]),
  event('landlord-ai', '现实结算', '房东也学会了用 AI', '他让模型分析了周边租金。模型很乐观。他也很乐观。你负责付钱。', [
    option('拿真实房源谈，补 ¥100', { cash: -100, stress: 4, skill: 1 }, '幻觉可以讨价还价，合同最好写清楚。'),
    option('付 ¥260，少争一回', { cash: -260, stress: -2 }, '你买到了半小时安静。'),
    option('暂时付不起，约明天再谈', { stress: 10 }, '房东没有很高兴。但至少今天没有凭空多出一笔钱。'),
  ]),
  event('learning-debt', '技能空心', '它不在线，你也不会了', '服务短暂不可用。你盯着自己发布的代码，像看一位陌生人的遗书。', [
    option('拆一段代码，弄明白', { skill: 8, techDebt: -6, stress: 5 }, '你重新获得了一小块不依赖网络的能力。'),
    option('等它恢复，先休息', { health: 6, stress: -7 }, '停机维护的不只是服务器。'),
  ]),
];

export const MILESTONES = {
  8: event('launch-day', '第 8 天 · 风口变了', '你的护城河，今天免费了', '发布会大屏上，出现了你熬夜做的核心功能。全场掌声很大，你关掉声音。', [
    option('把产品缩到一个真实小需求', { reputation: 6, skill: 4, techDebt: -5, stress: 5 }, '市场很大。你只需要服务好一小撮人。'),
    option('追下一个风口，再熬一夜', { cash: 500, stress: 13, health: -6, techDebt: 6 }, '路演稿更新了。你的疲劳没有。'),
  ]),
  16: event('midlife', '第 16 天 · 中场账单', '收入截图，不是利润截图', '朋友晒出“月入十万”。你算上算力、广告、退款和睡眠，突然很想看看他的另一张表。', [
    option('盘一次真实成本', { skill: 5, techDebt: -8, stress: -5 }, '你把“不亏钱”从谦虚，改成了一个重要指标。'),
    option('也做一场付费分享', { cash: 900, reputation: -7, stress: 8 }, '聚光灯下没人问净利润。'),
  ]),
  24: event('offer', '第 24 天 · 另一条路', '一份不性感的长期合同', '社区小商户想请你维护一套小系统。不提 AGI，不提颠覆，按月付钱。', [
    option('接 ¥1,200 维护单', { cash: 1200, reputation: 8, techDebt: 5, stress: 8 }, '你失去了一个宏大叙事，得到一个付费用户。'),
    option('留时间，做自己的小产品', { skill: 5, reputation: 3, stress: -4 }, '你决定给自己的产品留一小块不被打断的时间。'),
  ]),
  32: event('return', '第 32 天 · 活人的需求', '一个客户手写了感谢信', '他说，你的小工具让他可以准时去接女儿放学。纸上没有“赋能”两个字。', [
    option('把信贴在屏幕旁边', { reputation: 10, health: 5, stress: -12 }, '你突然想起来，最初为什么想做点东西。'),
    option('经同意，写成真实案例', { cash: 500, reputation: 6, stress: -5 }, '最好的营销，原来可以不夸张。'),
  ]),
  40: event('last-day', '第 40 天 · 到站了', '模型还会升级，你先结个账', '倒计时终于到最后一天。仓库、债务和没回的消息都在。还有今天的两格行动，留给你自己决定。', [
    option('认真收尾，不再接急单', { stress: -12, health: 5 }, '世界会继续很快。你不用每一次都跟上。'),
    option('再做最后一笔 ¥500 的活', { cash: 500, health: -5, stress: 8 }, '这次真的最后一笔。至少这局是。'),
  ]),
};

export const INTRO_EVENT = event('intro', '入场须知', '欢迎加入“人人都能当老板”的时代', '你有 40 天还清培训贷，别把身体一起抵押。每天两格行动；买卖不耗行动，换站会过一天，生活费和利息照收。', [
  option('知道了，先把今天过好', {}, '第一课：现金不等于净资产，热闹不等于生意。'),
]);

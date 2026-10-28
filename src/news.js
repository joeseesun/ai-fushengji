import { EXTRA_COPY, EDITION_SHIFTS } from './news-extra.js';
import { NEWS } from './content.js';

// Original tabloid fiction. Sources document the meme, not the invented headline.
export const NEWS_SOURCES = {
  router: { label: 'OpenRouter：调用量统计口径', url: 'https://openrouter.ai/rankings' },
  aa: { label: 'Artificial Analysis：模型榜', url: 'https://artificialanalysis.ai/leaderboards/models' },
  claw: { label: 'B 站：按 Token 收费的龙虾员工', url: 'https://www.bilibili.com/video/BV12vPmzBEGy/' },
  mini: { label: 'B 站：Mac mini 养龙虾', url: 'https://www.bilibili.com/video/BV1C49uBPEi4/' },
  slider: { label: '梁氏状态调节器：社区玩梗项目', url: 'https://github.com/cholf5/liang-slider' },
  angry: { label: 'B 站：用户彻底怒了', url: 'https://www.bilibili.com/video/BV1T97hzbEaM/' },
  rescue: { label: 'B 站：Vibe Coding Rescue', url: 'https://www.bilibili.com/video/BV1DtaozGEno/' },
  vend: { label: 'Anthropic：Project Vend', url: 'https://www.anthropic.com/research/project-vend-1' },
  distill: { label: 'B 站：蒸馏、开源与套壳', url: 'https://www.bilibili.com/video/BV18TAkzbETb/' },
};

// Stable edition IDs keep a saved day's headline intact when more copy is added.
// [suffix, headline, editorial, optional source key]. Every topic has nine editions.
const COPY = {
  router: [
    ['loop', 'OpenRouter 冲榜选手：一个用户，八个 Agent，九份账单。', '它们互相说了三万遍“收到”。客户的需求仍然是把按钮往左挪。', 'router'],
    ['retry', '调用量翻十倍！运营打开日志：原来全是重试。', '增长曲线很陡，成功率很平。老板决定先截曲线再修 bug。', 'router'],
    ['meeting', '龙虾员工改按 Token 计费，老板第一次主动宣布散会。', '昨天说“再对齐一下”的人，今天说“有事发文字”。计费教会了人类惜字。', 'claw'],
    ['refresh', '群友刷新调用榜 47 次，终于贡献了自己的活跃度。', '他还没选定模型，排行榜已经成了今天使用最熟练的工具。', 'router'],
  ],
  aa: [
    ['cropped', '新模型勇夺榜一，完整截图还在路上。', '小报编辑把横轴找回来了：原来拿第一的是“每条回答有多长”。', 'aa'],
    ['homework', '评测博主宣布王朝更替，甲方宣布表格还没对齐。', '榜一到工位之间，隔着一张合并单元格的 Excel。', 'aa'],
    ['sticker', '同一台机器人连贴三张“全球第一”，保洁阿姨以为是快递。', '上午第一，下午第二，晚上新增“综合体验第一”。奖杯比插座还多。', 'aa'],
    ['course', '榜单刚更新，讲师的新课封面先更新了。', '视频仍是去年的。老师解释：底层认知不过时，只有标题按天迭代。', 'aa'],
  ],
  b300: [
    ['family', 'B300 进群，H200 撤回了“再战十年”。', 'A100 安慰 H100，H100 安慰 H200。5090 不说话，它今晚还有游戏要打。'],
    ['jacket', '皮衣发布会又开了，旧卡群集体切换价值投资模式。', '昨日叫硬通货，今日叫沉没成本。群主说换个词，心情会好一点。'],
    ['savings', '“买得越多省得越多”，会计追问省下的钱在哪。', '销售指了指下一张采购单。会计第一次申请关闭深度思考。'],
    ['handover', '新机柜到货，老显卡主动申请转岗当暖气。', '机房少了一代旗舰，出租屋多了一项基础设施。至少冬天不算白买。'],
  ],
  local: [
    ['quant', '群友宣布跑通满血模型，截图右下角写着 4bit。', '大家争论灵魂有没有被量化，房东只关心电费有没有到账。'],
    ['mini', '养 Claw 上头了：虾还没接单，Mac mini 已分期。', '购物车叫生产资料，桌面叫数字员工宿舍。最先实现自动化的是扣款。', 'mini'],
    ['fan', '本地模型终于开口，第一句话被风扇声盖住了。', '隐私留在本地，热量也留在本地。室友问能不能只在冬天推理。'],
    ['memory', '“只差一点显存”成为今年最昂贵的六个字。', '模型下载免费，升级内存收费。群友说这是知识付费的硬件版本。'],
  ],
  normal: [
    ['quiet', '今日无新王登基，AI 群开始认真讨论午饭。', '有人推荐面馆，有人问面馆有没有 MCP。群主终于禁言了后者。'],
    ['sleep', '某开发者完整睡了八小时，醒来仍看得懂自己的代码。', '业内人士表示极不寻常，建议先排查是否误入平行宇宙。'],
    ['button', '小团队今天只修好一个按钮，客户居然付款了。', '没有融资，没有颠覆。只有一个以前点不动、现在点得动的按钮。'],
    ['offline', '全群暂停讨论 AGI，原因是群主出去遛狗了。', '狗的目标很明确：闻一下树。没有拆解任务，也没有生成路线图。'],
  ],
  free: [
    ['feature', '创业三个月，产品变成大厂设置页里的一个开关。', '投资人问护城河在哪。创始人打开设置：默认关闭，要不这算门槛？'],
    ['prompt', '模型自动补全了八千字提示词，提示词大师决定卖心法。', '实体商品没了，精神产品来了。“不要执着于术”，老师这样安慰库存。'],
    ['wrapper', '套壳创业者发现底座免费开放了自己的全部功能。', '他沉默片刻，把首页“效率工具”改成了“情绪价值陪伴”。'],
    ['cancel', '免费套餐上线，订阅退款申请比发布稿还长。', '昨天叫一杯咖啡的钱，今天客户开始认真计算一杯咖啡到底多少钱。'],
  ],
  tokens: [
    ['claw', '养虾人的第一笔被动收入，出现在模型厂商的账户里。', 'Claw 很勤奋，凌晨三点还在反思。你也很清醒，因为扣费提醒每分钟响一次。', 'claw'],
    ['loan', 'Token 贷广告：让未来的你，为现在的虾买单。', '游戏里的虚构贷款经理拍胸脯：虾可以休眠，利息全年无休。'],
    ['board', '六个 Agent 成立董事会，唯一的人类被任命为充值专员。', '会议纪要由第七个 Agent 整理。新增岗位依然由你发工资。', 'claw'],
    ['heartbeat', '虾每分钟汇报“暂无任务”，用勤奋烧光了任务预算。', '你终于学会设置休眠。它开始休息以后，家庭财务状况明显改善。', 'claw'],
  ],
  data: [
    ['ancestor', '套壳模型互相问“你是谁”，答出了同一个祖宗。', '群友开始画族谱，越画越像电源插排。最后所有分支都通向一张账单。', 'distill'],
    ['delve', '全网蒸馏大会闭幕，获奖感言全是“深入探讨”。', '评委宣布高度一致。现场唯一的人类举手：能不能换个词？', 'distill'],
    ['ocr', '人类把文档变成截图，AI 把截图还原成文档。', '中间省下多少 Token 仍在评估，截图和解图两门课已经开售。'],
    ['grandma', '模型吃了太多合成语料，奶奶的菜谱成了稀缺数据。', '奶奶问为什么“少许”不能量化。工程师说，这正是人类的护城河。'],
  ],
  video: [
    ['cat-ceo', '赛博猫一天开了十二家公司，真人负责挨个续费。', '它会跳舞、卖课、讲创业史。唯一不会的是往你的卡里打钱。'],
    ['hands', 'AI 短剧男女主终于牵手，观众开始数手指。', '导演说这是超现实主义。后期说这是今天最后一次抽卡。'],
    ['one-shot', '十分钟生成大片，背后是三天挑片和两百次重试。', '宣传视频只剪成功的十分钟。账单用长镜头记录了全部过程。'],
    ['clone', '数字分身一天直播 24 小时，本人熬夜替它处理售后。', '分身说家人们别睡，真人说求求你们快睡。生物钟首次出现利益冲突。'],
  ],
  open: [
    ['liang', '梁氏滑动变阻器拨向“梁圣”，群昵称批量改成义子。', '开源权重刚上传，朋友圈先完成了一轮家族关系重构。', 'slider'],
    ['license', '大厂宣布开源，程序员先看许可证，老板先改宣传稿。', '两人都很激动，只是激动的段落完全不同。'],
    ['weekend', '周五晚上十点开放权重，群里有人缓缓打出一个“谢谢”。', '下载进度还没到 1%，周末计划已经归零。'],
    ['fork', '仓库一夜冒出三百个分叉，原作者还在找人补文档。', '“伟大的项目！”下面有三百条评论。修复那个错别字的 PR 只有一条。'],
  ],
  privacy: [
    ['rag', '公司知识库问工资，RAG 检索出隔壁部门的离职信。', '命中率很高，权限边界很低。信息部开始认真思考什么叫“企业级”。'],
    ['mcp', '老板给 Agent 接了所有 MCP，权限图看起来像蜘蛛网。', 'Agent 问还缺什么工具。财务说缺一个让它先停下来的工具。'],
    ['skill', '同事把“请给我报销”写进 Skill，报销系统开始自我怀疑。', '安全审查第一次把 Markdown 当成需要认真读的文件。'],
    ['local-only', '“数据不出本地”演示现场，屏幕右上角弹出云端账单。', '工程师解释编排在本地，推理在云端。销售解释下一页 PPT 更精彩。'],
  ],
  subsidy: [
    ['credits', '新用户赠百万 Token，老用户赠一份情绪管理课程。', '注册按钮闪闪发光，续费按钮稳如磐石。'],
    ['coupon', '云代金券到账十万元，使用说明需要读十五分钟。', '满减、期限、机型、地区，四个条件把十万元圈成了一小块。'],
    ['timeout', '薅云补贴群宣布战果，账单提醒它们忘了关机器。', '优惠券只管算力，硬盘和带宽有自己的梦想。'],
    ['free-tier', '免费推理排队 999 位，付费按钮从来不用排队。', '平台说人人都能用上智能。没有说人人都能同时用上。'],
  ],
  agents: [
    ['rename', '旧脚本穿上 MCP 外套，路演估值当场涨了一个零。', '昨天叫定时任务，今天叫自主执行体。明天可能叫数字合伙人。'],
    ['skills', '全公司开始写 SKILL.md，唯一没有技能的是交接的人。', '文档里每条都写“自动完成”，最后一条写着“人工兜底”。'],
    ['claw-resume', '龙虾简历写“7×24 小时在线”，面试官忘了问谁充值。', '它不需要五险一金，只需要一个没有余额上限的 API Key。', 'claw'],
    ['orchestrator', '一个 Agent 干不完的活，十个 Agent 开完了启动会。', '分工非常清楚：三个规划、三个评审、三个总结，一个等你确认。'],
  ],
  slop: [
    ['dead-net', 'AI 写帖、AI 点赞、AI 总结，真人在评论区问链接呢。', '全自动内容生态已经闭环。唯一没闭环的是谁掏钱。'],
    ['shocked', '“刚刚，彻底炸了”库存过剩，编辑部开始使用“刚刚刚”。', '有人建议等事实确认后再发。大家以为他在讲冷笑话。'],
    ['ai-detector', '检测器把作者判成 AI，把 AI 写的申诉判成人类。', '平台建议本人证明本人是本人，收费工具提供代写证明服务。'],
    ['summary', '大家用 AI 写长文，再用 AI 把长文压回一句话。', '读者省下的三分钟，被作者的标题党拿去重新花了一遍。'],
  ],
  enterprise: [
    ['kpi', '老板把 Token 消耗量设成 KPI，厕所灯都开始深度思考。', '业务收入没动，仪表盘一片繁荣。IT 部门建议下月考核任务完成率。'],
    ['skill-copy', '员工被要求把自己写成 Skill，培训内容包含如何替代本人。', '交接文档第一页：如果甲方说“很简单”，请不要相信。'],
    ['ppt', '老板看完 AI 发布会，给下周排了三年的数字化任务。', '他把计划交给 AI 压缩了一次。日期没变，只是字变小了。'],
    ['tungsten', '办公室 AI 小卖部进了一柜钨块，员工本来只想买汽水。', '游戏店长说这是高密度资产。财务说确实，连抱去退款都很费劲。', 'vend'],
  ],
  human: [
    ['angry', '“用户彻底怒了”触发工单升级，终于接通一个活人。', '真人没说“您的反馈非常重要”，他先把坏掉的按钮修好了。', 'angry'],
    ['rescue', 'Vibe Coding 救火队开张：按灭火收费，按看懂代码加价。', '客户带着三天生成的十万行代码来问能否今晚修完。师傅先打开窗透气。', 'rescue'],
    ['ownership', '招聘新增稀缺岗位：知道这段代码为什么能跑的人。', '面试只有一道题：模型下线了，你还能不能把客户的问题解决。'],
    ['deliver', '客户取消“世界最强模型”需求，改成“明天能正常用”。', '报价单第一次没有写颠覆。尾款第一次没有拖延。'],
  ],
  ban: [
    ['bus', '拼车群从五人座变公交车，司机宣布靠信念续航。', '乘客问何时到站，司机回复“下一辆马上发”。'],
    ['refund', '中转站老板宣布稳如老狗，群名已改为退款登记处。', '群公告还写着长期主义。长期等候，也是一种长期。'],
    ['travel', '账号凌晨环游五大洲，本人一步没离开出租屋。', '你没出过国，登录记录却能申领环球旅行奖章。'],
    ['shared-memory', '拼车乘客问 AI 晚饭吃啥，AI 先催了另一位乘客的周报。', '上下文共享做到了，隐私共享也做到了。群友决定各回各家。'],
  ],
  'claude-new': [
    ['three-days', '新模型发布第一天：义父！第三天：是不是偷偷降智了？', '同一条提示词昨天叫神迹，今天叫诈骗。群里准备加装情绪稳压器。'],
    ['debug', 'Claude Code 修好旧 bug，又亲手栽培了三个新 bug。', '它表示这是必要的重构。你表示今晚已经没有必要睡觉。', 'rescue'],
    ['right', '模型连说八遍“你说得对”，第九遍把整个项目重写了。', '它对你的情绪理解十分到位，对你的仓库理解正在努力。', 'angry'],
    ['reset', '额度重置倒计时结束，群里准时响起打卡声。', '大家以为自己雇了 AI，结果按 AI 的排班表上班。'],
  ],
  'invite-mania': [
    ['preorder', '邀请码还没发，教你抢邀请码的课已经开班。', '老师的邀请码也没有下来，但老师的收款码早就准备好了。'],
    ['waitlist', '候补名单突破十万人，产品目前唯一可用功能是候补。', '创始人宣布需求验证完成。工程师宣布终于可以开始写登录页。'],
    ['plus-one', '全球首个通用 Agent 上线，“全球首个”当日新增七家。', '统计员建议把计量单位从“家”改成“发布会”。'],
    ['demo', '演示 Agent 包办一切，内测用户先排队点了 17 次确认。', '宣传片没有剪掉能力，它只是剪掉了所有等待。'],
  ],
  'side-hustle': [
    ['install', '上门装龙虾 ¥499，卸载 ¥599，师傅跑出商业闭环。', '装机时说错过就是错过一个时代，卸载时说回归生活更重要。', 'mini'],
    ['income', '副业群晒月入三万，细看是三个订阅一共花了三万。', '收入和支出只差一个方向，老师说这属于认知问题。'],
    ['claw-school', '龙虾还没替主人赚钱，龙虾培训班先替老师买了车。', '课程第一节：你需要更好的设备。第二节：你需要更贵的套餐。', 'claw'],
    ['next-era', '“普通人最后一次机会”发布了今年第十二个修订版。', '每一版都保证最后一次，每一版都支持分期。'],
  ],
};

const ORIGINAL_COMMENTS = {
  router: '调用量里有多少活人，多少机器人，还有多少在替机器人鼓掌的机器人？小报的计算器申请休假。',
  aa: '截图存下来是一份历史资料，今晚按截图买课可能是一份考古赞助。',
  b300: '黄牛把“价格坚挺”改成了“入手良机”。同一张卡，一天经历两个人生阶段。',
  local: '你的旧显卡又成了生产资料。昨天那句“卖了算了”，暂时撤回。',
  normal: '编辑部没有素材，决定提前下班。老板怀疑他们没有充分利用 AI。',
  free: '昨天的商业计划书今天还能用：把封面换成转型计划书就行。',
  tokens: '组织架构越来越完整，唯一迟迟没有出现的部门叫盈利部。',
  data: '训练集像一锅老卤，所有模型都闻起来似曾相识。人类终于想起自己也会写一句话。',
  video: '猫会说八国语言，主人在用第九种语言骂渲染失败。',
  open: '免费的是权重，周末的时间和家里的电表还没有收到通知。',
  privacy: '这句话让销售沉默，让法务上线，让工程师打开了那张忘记更新的架构图。',
  subsidy: '补贴像试吃，吃着吃着就要为厨房付租金了。',
  agents: '原来的按钮还在原来的位置，只是现在每次点击都更有科技感地收费。',
  slop: '创作入口越来越顺滑，观众的时间仍然只有一天 24 小时。',
  enterprise: '采购单已经签了，需求正在倒着写。大家努力证明按钮里确实含有人工智能。',
  human: '他没背过模型排行榜，但记得客户上周提的那个 bug。今天这就够了。',
  ban: '车门焊死了，司机却下车了。乘客第一次理解什么叫模型路由。',
  'claude-new': '群里暂时没有争论，因为所有人都忙着把余额换成“让我试一下”。',
  'invite-mania': '用户还没体验到产品，先完整体验了一次供需关系。',
  'side-hustle': '围观者问怎么变现，老师发来收款码。答案比课程本身简短得多。',
};
export const NEWS_EDITIONS = NEWS.flatMap(topic => [
  { id: `${topic.id}-original`, topic: topic.id, title: topic.title, comment: ORIGINAL_COMMENTS[topic.id] },
  ...[...COPY[topic.id], ...EXTRA_COPY[topic.id]].map(([suffix, title, comment, source]) => ({ id: `${topic.id}-${suffix}`, topic: topic.id, title, comment, source, market: EDITION_SHIFTS[`${topic.id}-${suffix}`] })),
]);
const byId = new Map(NEWS_EDITIONS.map(e => [e.id, e]));
const scheduled = { 8: 'free', 16: 'data', 24: 'enterprise', 32: 'human' };
export const getEdition = id => byId.get(id);

export function drawNews(s, random) {
  const seen = new Set(s.newsSeen);
  const recent = s.newsSeen.slice(-3).map(id => byId.get(id)?.topic);
  // Reserve upcoming story-day topics so even their fixed market effects get a cooldown.
  const upcoming = [1, 2, 3].map(offset => scheduled[s.day + offset]).filter(Boolean);
  const unseen = NEWS_EDITIONS.filter(e => !seen.has(e.id));
  const forced = scheduled[s.day];
  const reserved = Object.entries(scheduled).filter(([day]) => Number(day) > s.day).map(([, topic]) => topic);
  const availableTopics = NEWS.filter(n => {
    const remaining = unseen.filter(e => e.topic === n.id).length;
    return remaining > (reserved.includes(n.id) ? 1 : 0);
  });
  const eligible = availableTopics.filter(n => !recent.includes(n.id) && !upcoming.includes(n.id));
  const topics = eligible.length ? eligible : availableTopics;
  const topic = forced && availableTopics.some(n => n.id === forced) ? forced : topics[Math.floor(random(s) * topics.length)].id;
  const editions = unseen.filter(e => e.topic === topic);
  const edition = editions[Math.floor(random(s) * editions.length)];
  s.news = topic; s.newsEdition = edition.id; s.newsSeen.push(edition.id);
}

export function validNews(s) {
  const edition = byId.get(s.newsEdition);
  return edition?.topic === s.news && Array.isArray(s.newsSeen) && s.newsSeen.length >= 1 && s.newsSeen.length <= s.day
    && new Set(s.newsSeen).size === s.newsSeen.length && s.newsSeen.every(id => byId.has(id)) && s.newsSeen.at(-1) === s.newsEdition;
}

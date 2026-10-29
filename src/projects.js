// Offers and choices are derived from saved state. Looking at a project never
// consumes RNG; only choosing a risky delivery step draws an outcome.
const BRIEFS = {
  coder: [
    ['小店客服，顺便管个宇宙', '“能自动回营业时间就行。”老板发来了一张手写需求。', '“顺便接库存和开票吧，都是按钮，应该差不多。”'],
    ['给祖传系统装一扇门', '客户要一个能登录的后台，不要求颠覆行业。', '“登录做好了，顺便把隔壁公司的系统也接进来。”'],
    ['Agent 急停开关', '七个代理互相布置任务，财务只求它们先停下来。', '“能停了？再加个一键恢复，最好还能自己反思。”'],
  ],
  creator: [
    ['把发布会翻译成人话', '客户要一条短视频，讲清产品究竟能干什么。', '“顺便做中英双语、竖版横版，再给老板修一下发际线。”'],
    ['十万加不写进合同', '一家小店想拍真实体验，不承诺播放量。', '“能不能顺便保个十万加？老板说标题加个刚刚就行。”'],
    ['数字人先学会念公司名', '培训片三分钟，数字人只需别念错名字。', '“顺便出十个方言版吧，它不是会一百种语言吗？”'],
  ],
  opc: [
    ['小老板的第一个收钱按钮', '客户终于同意先上线支付，不先画生态图。', '“顺便加会员、积分和分销，今天就形成商业闭环。”'],
    ['十二页知识库交付', '店员只需要查到库存，老板只需要少被问两次。', '“顺便把我微信里的二十年经验也导进去。”'],
    ['自动报表，有人负责', '把每日营业额整理出来，金额必须对得上。', '“顺便预测一下下季度吧，最好比财务乐观一点。”'],
  ],
  worker: [
    ['把周报改成能看懂的', '客户要求只有一条：看完知道这周做了什么。', '“顺便做领导讲话稿，成果再写得有战略高度一点。”'],
    ['抢救合并单元格', '三张表对不上，需要一个愿意看 Excel 的活人。', '“顺便把去年的也对一下，去年总共才十二个月。”'],
    ['电子员工的交接文档', '把机器人的工作写清楚，给明天接班的人看。', '“顺便培训全公司吧，明天大家都要会。”'],
  ],
  grad: [
    ['论文复现，先别改世界', '学长愿意付赏金，要求在新环境跑通结果。', '“顺便冲个榜吧，导师说实验部分还差一点点。”'],
    ['让别人照文档装成功', '开源项目缺一份真实可用的入门文档。', '“顺便录视频和做官网吧，反正步骤你都熟了。”'],
    ['黑客松 Demo 要活到明天', '团队需要一个演示页，评委会真的按按钮。', '“顺便接真实用户，今晚直接开始商业化。”'],
  ],
};

export const projectBrief = (s, p = s.project) => p ? BRIEFS[s.role]?.[p.brief] : null;
export function projectOffers(s, unitPay) {
  if (s.project || s.projectDay === s.day || s.day > 38) return [];
  const first = ((s.seed ^ Math.imul(s.day, 1597334677)) >>> 0) % 3;
  return [0, 1].map(i => ({ brief: (first + i) % 3, started: s.day, due: s.day + 2,
    reward: Math.round(unitPay * (i ? 8 : 6)), need: i ? 4 : 3, progress: 0, change: 'waiting' }));
}

export const projectExpiry = (s, finishing = false) => s.project && (finishing || s.day >= s.project.due) ? { reputation: -6, stress: 10 } : null;

export function projectChoice(s, id) {
  const p = s.project;
  if (!p) return null;
  const pending = p.change === 'pending', waiting = p.change === 'waiting';
  let a;
  if (['trim', 'negotiate', 'accept', 'reuse'].includes(id)) {
    const options = {
      trim: { name: '缩范围，按原计划交', desc: '保持原工作量，项目报酬减 20%。', patch: { change: 'trim', reward: Math.round(p.reward * .8) } },
      negotiate: { name: '加价延期，写进合同', desc: '报酬加 20%，多做 1 格进度，截止延后一天。', reason: s.reputation < 40 ? '口碑达到 40 才有议价空间' : p.due >= 40 ? '已是最后档期，无法再延期' : '', patch: { change: 'negotiate', reward: Math.round(p.reward * 1.2), need: p.need + 1, due: p.due + 1 } },
      accept: { name: '都接下来，价格不变', desc: '多做 1 格进度，原价、原截止日。', patch: { change: 'accept', need: p.need + 1 } },
      reuse: { name: '复用方案，原价交付', desc: '用手艺或已有产品消化新增需求，保持原工作量与报酬。', reason: s.skill < 40 && s.products < 1 ? '需要技能 40 或至少一个已上线产品' : '', patch: { change: 'reuse' } },
    };
    a = { ...options[id], reason: !pending ? '现在没有待协商的新需求' : options[id].reason };
  } else if (id === 'steady' || id === 'rush') {
    const rush = id === 'rush', risk = (s.stress >= 70 ? 60 : s.stress >= 50 ? 45 : 30) - (s.skill >= 60 ? 10 : 0);
    a = { name: rush ? '赶工冲两格进度' : '认真做一格进度', desc: rush ? `成功推进 2 格；翻车只推进 1 格，再加 8 技术债、4 压力。翻车 ${risk}%。` : '稳定推进 1 格，交付前不发项目款。',
      reason: pending ? '先和客户谈清新增范围，再继续项目' : p.progress >= p.need ? '进度已完成，请交付或等待明日确认范围' : '', ap: 1,
      effects: { cash: rush ? -120 : -80, health: rush ? -7 : -3, stress: rush ? 13 : 6, ...(rush ? { techDebt: s.skill >= 40 ? 2 : 4 } : {}) },
      progress: rush ? 2 : 1,
      ...(rush ? { outcomes: [{ weight: 100 - risk, effects: {}, progress: 2, text: '两格进度做完了。今晚的咖啡终于有了验收标准。' }, { weight: risk, effects: { techDebt: 8, stress: 4 }, progress: 1, text: '赶出了能跑的版本，也赶出了新的坑。只推进一格。' }] } : {}) };
  } else if (id === 'deliver') {
    a = { name: '验收交付，收项目款', desc: '不耗行动。全部进度做完且范围确认后，才能结算一次。',
      reason: waiting ? '客户明天确认需求；今天先投入开发，明天才能交付' : pending ? '先谈清新增需求' : p.progress < p.need ? `还差 ${p.need - p.progress} 格进度` : '',
      effects: { cash: p.reward, reputation: 6, skill: 3, stress: -4 }, done: true };
  } else if (id === 'cancel') {
    a = { name: '退出项目，及时止损', desc: '没有项目款，已投入的工时和成本不退；口碑 −3、压力 +4。', effects: { reputation: -3, stress: 4 }, cancel: true };
  } else return null;
  a.effects ??= {};
  a.reason ||= s.day > p.due ? '项目已经过期' : a.ap && s.ap < a.ap ? '今天没有剩余行动' : s.cash + (a.effects.cash ?? 0) < 0 ? '现金不足，无法支付本次制作成本' : '';
  return a;
}

export function validProjectState(s) {
  const int = (n, lo, hi) => Number.isSafeInteger(n) && n >= lo && n <= hi;
  if (!int(s.projectDay, 0, s.day) || !int(s.projectsDone, 0, 40)) return false;
  const p = s.project;
  if (p === null) return true;
  return !!p && int(p.brief, 0, 2) && int(p.started, 1, 38) && p.started === s.projectDay && p.started <= s.day
    && int(p.due, p.started + 2, Math.min(40, p.started + 3)) && s.day <= p.due
    && int(p.need, 3, 5) && int(p.progress, 0, p.need) && int(p.reward, 0, 10000000)
    && ['waiting', 'pending', 'trim', 'negotiate', 'accept', 'reuse'].includes(p.change)
    && (p.change !== 'waiting' || s.day === p.started);
}

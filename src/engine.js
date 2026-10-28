import { GOODS, LOCATIONS, ROLES, NEWS, EVENTS, MILESTONES, INTRO_EVENT } from './content.js';
import { FOLLOWUPS, MEME_SCHEDULE, rheostat } from './memes.js';
import { MODELS, PROFILES, getModel, modelBonus, featuredModel } from './models.js';

export const VERSION = 2;
export const DAYS = 40;
export const INTEREST = .018;
export const SAVE_KEY = 'ai-fushengji-save-v1';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const integer = (v, lo = 0, hi = 1e9) => Number.isSafeInteger(v) && v >= lo && v <= hi;
const copy = (s) => structuredClone(s);
const allEvents = [INTRO_EVENT, ...EVENTS, ...FOLLOWUPS, ...Object.values(MILESTONES)];

// RNG lives in the save: reopening a page cannot reroll a quote or an event.
function random(s) {
  let n = s.rng | 0;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  s.rng = n >>> 0;
  return s.rng / 4294967296;
}
function shuffle(s, list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const getLocation = s => LOCATIONS.find(l => l.id === s.location);
export const getNews = s => NEWS.find(n => n.id === s.news);
export const getEvent = s => {
  const e = allEvents.find(e => e.id === s.event);
  if (!e) return null;
  if (!e.featured) return e;
  const name = featuredModel(s).name;
  return { ...e, title: e.title.replaceAll('{model}', name), text: e.text.replaceAll('{model}', name) };
};
export const usedSpace = s => GOODS.reduce((n, g) => n + s.inventory[g.id].qty, 0);
export const salePrice = (s, id) => Math.max(1, Math.floor(s.prices[id] * .9));
export const inventoryValue = s => GOODS.reduce((n, g) => n + s.inventory[g.id].qty * salePrice(s, g.id), 0);
export const netWorth = s => s.cash + inventoryValue(s) - s.debt;
export const productIncome = s => Math.max(0, Math.floor(s.products * Math.max(25, 140 + s.reputation * 1.6 - s.techDebt * 1.3) * (getNews(s)?.product ?? 1)));
export const dailyCost = s => 90 + (s.location === 'home' ? 0 : 40) + 20 + s.products * 12;
export const dailyInterest = s => Math.ceil(s.debt * INTEREST);

function log(s, text, kind = 'normal') {
  s.journal.unshift({ day: s.day, text, kind });
  s.journal = s.journal.slice(0, 240);
}

function market(s) {
  s.previousPrices = { ...s.prices };
  const forced = s.day === 8 ? 'free' : s.day === 16 ? 'data' : s.day === 24 ? 'enterprise' : s.day === 32 ? 'human' : null;
  s.news = forced ?? NEWS[Math.floor(random(s) * NEWS.length)].id;
  const news = getNews(s), place = getLocation(s);
  for (const g of GOODS) {
    const age = Math.max(.22, 1 - g.decay * (s.day - 1));
    s.prices[g.id] = Math.max(8, Math.round(g.base * age * (.65 + random(s) * 1.05) * (place.factors[g.id] ?? 1) * (news.factors[g.id] ?? 1)));
    s.history[g.id] = [...(s.history[g.id] ?? []), s.prices[g.id]].slice(-8);
  }
}

export function newGame(roleId = 'coder', seed = Date.now() >>> 0) {
  const role = ROLES.find(r => r.id === roleId) ?? ROLES[0];
  const s = {
    version: VERSION, seed: (seed >>> 0) || 1, rng: (seed >>> 0) || 1, role: role.id,
    day: 1, location: 'market', cash: role.cash, debt: role.debt,
    health: 90, stress: role.stress, skill: role.skill, reputation: role.reputation,
    techDebt: 0, products: 0, progress: 0, ap: 2, capacity: 18,
    inventory: Object.fromEntries(GOODS.map(g => [g.id, { qty: 0, cost: 0 }])),
    prices: {}, previousPrices: {}, history: {}, news: 'normal',
    event: 'intro', eventDeck: [], eventIndex: 0, journal: [], receipts: [],
    seen: ['intro'], followups: [], lastEvent: null, stance: 50,
    model: null, modelUntil: 0,
    totalEarned: 0, totalInterest: 0, jobsDone: 0, tradeProfit: 0, daysRested: 0,
    borrowed: 0, lastBorrowDay: -10, status: 'playing', ending: null,
  };
  s.eventDeck = shuffle(s, EVENTS.map(e => e.id));
  market(s);
  log(s, role.story, 'story');
  return s;
}

export function effectText(effects) {
  const labels = { cash: '现金', health: '健康', stress: '压力', skill: '技能', reputation: '口碑', techDebt: '技术债' };
  return Object.entries(effects).map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? '+' : ''}${value}${key === 'cash' ? ' 元' : ''}`).join(' · ') || '不消耗行动';
}

function applyEffects(s, effects) {
  for (const [key, amount] of Object.entries(effects)) {
    s[key] += amount;
    if (['health', 'stress', 'skill', 'reputation', 'techDebt'].includes(key)) s[key] = clamp(s[key], 0, 100);
    if (key === 'cash' && amount > 0) s.totalEarned += amount;
  }
}

export function actionInfo(s, action) {
  const bonus = modelBonus(s);
  const job = 360 + s.skill * 6 + s.reputation * 3 + (s.location === 'jobs' ? 160 : 0) + (bonus?.work ?? 0);
  const infos = {
    work: { name: '认真接一单', desc: '不卖奇迹，按约交付。', icon: 'BriefcaseBusiness', effects: { cash: job, health: -4, stress: 8, reputation: 2 }, after: '交付完成。客户说“收到”，这两个字比一百颗星值钱。' },
    rush: { name: '熬夜赶急单', desc: '现金来得快，技术债也是。', icon: 'Zap', effects: { cash: Math.floor(job * 1.65), health: -9, stress: 15, techDebt: 10, reputation: -1 }, after: '钱到了。你把明天的自己设成了负责人。' },
    learn: { name: '弄懂一点原理', desc: '多一块不会被版本更新删掉的能力。', icon: 'BookOpen', effects: { cash: -80, skill: 7 + (s.location === 'opensource' ? 3 : 0) + (bonus?.learn ?? 0), stress: 3 }, after: '学会了一点。不是看过，不是收藏，是会了。' },
    rest: { name: '关机休息', desc: '让活人退出后台，回到前台。', icon: 'Coffee', effects: { health: 16 + (s.location === 'home' ? 6 : 0), stress: -22 }, after: '没有产出的一格行动，也算在认真生活。' },
    build: { name: '做自己的产品', desc: `进度 ${s.progress}/3 · 做满 3 次上线一个`, icon: 'PackagePlus', effects: { cash: -(260 + s.products * 90), health: -2, stress: 6, techDebt: 3 + (bonus?.build ?? 0), reputation: 1 }, after: '又完成了一小块。不是“平台”，是一个具体的问题。', reason: s.skill < 20 ? '技能达到 20 后可研发' : s.products >= 6 ? '最多维护 6 个产品' : '' },
    maintain: { name: '还一点技术债', desc: '修旧坑，也保护每天的产品收入。', icon: 'Wrench', effects: { cash: -90, techDebt: -18, stress: -5, skill: 2 }, after: '删掉一层包装。你终于又能看懂自己的系统了。' },
    expand: { name: '扩容云仓库', desc: `多放 10 件 · 当前 ${s.capacity} 件`, icon: 'HardDrive', effects: { cash: -(700 + (s.capacity - 18) * 40) }, after: '空间变大了。别把它当成一定要买满的理由。', reason: s.capacity >= 58 ? '仓库已到上限' : '' },
  };
  const info = infos[action];
  if (!info) return null;
  return { ...info, reason: info.reason || (s.cash + (info.effects.cash ?? 0) < 0 ? '现金不足' : s.ap < 1 ? '今天的行动已用完' : '') };
}

export function endingFor(s) {
  const worth = netWorth(s);
  if (s.health <= 0) return { id: 'health', title: '人类进程已挂起', subtitle: '身体替你点了“强制退出”。', text: '模型的上下文可以扩容，人的承受力不能。下次给休息留一格；健康降到 0 会提前结束。' };
  if (s.stress >= 100) return { id: 'burnout', title: '上下文已满', subtitle: '你记住了所有新名词，却忘了自己为什么开始。', text: '压力到达 100，今天先到这里。关掉一点通知，拒绝一点需求，并不会让你失去整个时代。' };
  if (s.debt > 50000) return { id: 'debt', title: '被利息接管的人生', subtitle: '最大的复利，发生在借款合同里。', text: '欠款超过 50,000，信用额度被收回。下次先留生活费、早点还款，别拿欠款截图当融资新闻。' };
  if (s.debt === 0 && s.products >= 3 && s.reputation >= 45 && s.health >= 40 && s.stress < 75)
    return { id: 'company', title: '一人公司，两脚着地', subtitle: '没有颠覆行业，但有人离不开你的产品。', text: '你用几个具体的小工具换来了持续收入，也没有把自己当成一次性耗材。这家公司，终于有人。' };
  if (worth >= 18000 && (s.health < 45 || s.stress >= 70))
    return { id: 'rich', title: '有钱，没空活', subtitle: '财务报表很漂亮，体检报告另说。', text: '你成功把未来的精力贴现成了今天的现金。下一阶段的核心 KPI，可以是好好睡觉。' };
  if (s.debt === 0 && s.health >= 70 && s.stress <= 40)
    return { id: 'human', title: '人类保留区', subtitle: '账还清了，你也还在。', text: '你没有跑赢所有模型，只是按时吃饭、交付、睡觉。这个时代很快，你依然拥有自己的速度。' };
  if (s.debt === 0 && worth >= 15000)
    return { id: 'independent', title: '小而自由', subtitle: '风口一直在换，你的账户终于不靠许愿。', text: '你会看价格，也会看需求。下次再有人问你的护城河，你可以先把账结清再回答。' };
  if (s.debt > 0)
    return { id: 'subscription', title: '订阅制人生', subtitle: '工具续费了，希望还没到期。', text: '40 天过去，你依然欠着钱。收入和利润之间隔着一排小字；你至少已经知道，下次要先读哪一行。' };
  return { id: 'finish', title: '体面收工', subtitle: '不必成为传说，也能把日子过下去。', text: '贷款清零，故事暂时停在这里。你没错过整个时代，你只是没有把每一个风口都当成自己的命运。' };
}

function checkFailure(s) {
  if (s.health <= 0 || s.stress >= 100 || s.debt > 50000) {
    s.status = 'ended'; s.ending = endingFor(s); s.event = null;
    log(s, s.ending.title, 'ending');
  }
}

export function transition(original, command) {
  const fail = error => ({ state: original, error, message: '' });
  if (!command || typeof command.type !== 'string') return fail('这个动作不存在。');
  if (original.status !== 'playing') return fail('本局已经结算，开始新一局再试。');
  if (original.event && command.type !== 'choose') return fail('先回应眼前这件事，再继续今天。');
  const s = copy(original);
  let message = '';
  switch (command.type) {
    case 'model': {
      const model = MODELS.find(m => m.id === command.id);
      if (!model) return fail('这个模型不在当前目录中。');
      if (getModel(s)) return fail('当前搭子还在合同期，结束后再换，别重复付费。');
      const profile = PROFILES[model.profile];
      if (s.cash < profile.fee) return fail('现金不够，先靠自己也能玩。');
      s.cash -= profile.fee; s.model = model.id; s.modelUntil = Math.min(DAYS, s.day + 4);
      message = `签下 ${model.name}，支付游戏币 ¥${profile.fee}，有效至第 ${s.modelUntil} 天。不会自动续费。`;
      log(s, message, 'model'); break;
    }
    case 'choose': {
      const e = getEvent(s), choice = e?.options[command.index];
      if (!integer(command.index, 0, 9) || !choice) return fail('请选择一个有效选项。');
      if (s.cash + (choice.effects.cash ?? 0) < 0) return fail('现金不够，换一个不花钱的选择。');
      if (choice.stance && command.stance !== undefined && !integer(command.stance, 0, 100)) return fail('滑块档位应在 0 到 100 之间。');
      applyEffects(s, choice.effects); s.event = null; s.lastEvent = e.id;
      message = choice.result;
      if (choice.stance) {
        s.stance = command.stance ?? s.stance;
        const setting = rheostat(s.stance); applyEffects(s, setting.effects);
        message = `今日称呼：${setting.name}。${message}`;
      }
      if (choice.outcomes) {
        let roll = random(s) * choice.outcomes.reduce((n, o) => n + o.weight, 0);
        const outcome = choice.outcomes.find(o => (roll -= o.weight) < 0) ?? choice.outcomes.at(-1);
        applyEffects(s, outcome.effects); message = outcome.text;
      }
      if (choice.followUp && !s.followups.some(f => f.id === choice.followUp) && !s.seen.includes(choice.followUp))
        s.followups.push({ id: choice.followUp, day: Math.min(DAYS - 1, s.day + choice.delay) });
      log(s, `${e.title} → ${choice.label}。${message}`, 'event');
      break;
    }
    case 'buy':
    case 'sell': {
      const g = GOODS.find(g => g.id === command.id);
      if (!g || !integer(command.qty, 1, 1000)) return fail('请输入 1 到 1,000 之间的整数数量。');
      const holding = s.inventory[g.id];
      if (command.type === 'buy') {
        const cost = s.prices[g.id] * command.qty;
        if (usedSpace(s) + command.qty > s.capacity) return fail('仓库放不下了，先卖出或扩容。');
        if (cost > s.cash) return fail('现金不足，少买一点。');
        s.cash -= cost; holding.qty += command.qty; holding.cost += cost;
        message = `买入 ${command.qty} ${g.unit}${g.name}，花费 ¥${cost.toLocaleString('zh-CN')}。`;
      } else {
        if (holding.qty < command.qty) return fail('持仓不够，不能卖出不存在的东西。');
        const income = salePrice(s, g.id) * command.qty;
        const cost = command.qty === holding.qty ? holding.cost : Math.round(holding.cost * command.qty / holding.qty);
        s.cash += income; holding.qty -= command.qty; holding.cost -= cost; s.tradeProfit += income - cost;
        s.totalEarned += Math.max(0, income - cost);
        message = `卖出 ${command.qty} ${g.unit}${g.name}，到账 ¥${income.toLocaleString('zh-CN')}（盈亏 ${income - cost >= 0 ? '+' : ''}${income - cost}）。`;
      }
      log(s, message, 'trade'); break;
    }
    case 'action': {
      const info = actionInfo(s, command.id);
      if (!info) return fail('这个行动不存在。');
      if (info.reason) return fail(info.reason);
      applyEffects(s, info.effects); s.ap--;
      if (command.id === 'work' || command.id === 'rush') s.jobsDone++;
      if (command.id === 'rest') s.daysRested++;
      if (command.id === 'expand') s.capacity += 10;
      if (command.id === 'build') {
        s.progress++;
        if (s.progress === 3) { s.products++; s.progress = 0; message = `第 ${s.products} 个小产品上线。每天开始带来收入，也需要维护。`; }
      }
      message ||= info.after;
      log(s, `${info.name}：${effectText(info.effects)}。${message}`, 'action'); break;
    }
    case 'repay': {
      if (!integer(command.amount, 1)) return fail('还款金额须为正整数。');
      if (command.amount > s.debt) return fail('这比欠款还多，按剩余欠款还就好。');
      if (command.amount > s.cash) return fail('现金不足，请先赚到这笔钱。');
      s.cash -= command.amount; s.debt -= command.amount;
      message = s.debt === 0 ? '培训贷还清了。人生第一次，不是为了“回本”而学习。' : `已还款 ¥${command.amount}，剩余欠款 ¥${s.debt}。`;
      log(s, message, 'finance'); break;
    }
    case 'borrow': {
      if (s.day - s.lastBorrowDay < 5) return fail('周转额度每 5 天只能用一次。');
      if (s.borrowed >= 6000 || s.debt + 1500 > 20000) return fail('周转额度已用完。');
      s.cash += 1500; s.debt += 1500; s.borrowed += 1500; s.lastBorrowDay = s.day;
      message = '借到 ¥1,500。每天按 1.8% 计息，周转不是收入。';
      log(s, message, 'finance'); break;
    }
    case 'travel':
    case 'finish': {
      const finishing = command.type === 'finish';
      if (finishing && s.day !== DAYS) return fail('第 40 天才可最终结算。');
      if (!finishing && s.day >= DAYS) return fail('今天是最后一天，请清理账目后结算。');
      if (!finishing && !LOCATIONS.some(l => l.id === command.location)) return fail('目的地不存在。');
      // Bills apply to the day just lived, before moving. Day 40 is billed once too.
      const revenue = productIncome(s), cost = dailyCost(s), interest = dailyInterest(s);
      const shortage = Math.max(0, cost - s.cash - revenue);
      s.cash = Math.max(0, s.cash + revenue - cost);
      s.debt += interest + shortage; s.totalInterest += interest; s.totalEarned += revenue;
      const wear = 1 + (s.stress >= 70 ? 5 : s.stress >= 50 ? 2 : 0);
      s.health = Math.max(0, s.health - wear);
      s.receipts.unshift({ day: s.day, revenue, cost, interest, shortage });
      s.receipts = s.receipts.slice(0, DAYS);
      log(s, `日结：产品 +¥${revenue}，生活与工具 −¥${cost}，利息 +¥${interest}${shortage ? `，缺口 ¥${shortage} 转欠款` : ''}。`, 'bill');
      checkFailure(s);
      if (s.status === 'ended') break;
      if (finishing) {
        // Liquidation and repayment happen once, with the displayed bid quote.
        const liquidation = inventoryValue(s);
        s.cash += liquidation;
        for (const g of GOODS) s.inventory[g.id] = { qty: 0, cost: 0 };
        const payment = Math.min(s.cash, s.debt); s.cash -= payment; s.debt -= payment;
        log(s, `最终清算：库存回收 ¥${liquidation}，自动还债 ¥${payment}。`, 'finance');
        s.status = 'ended'; s.ending = endingFor(s); s.event = null;
        message = s.ending.subtitle;
      } else {
        s.day++; s.location = command.location; s.ap = 2; market(s);
        const sequel = s.followups.find(f => f.day <= s.day);
        s.event = MILESTONES[s.day]?.id ?? MEME_SCHEDULE[s.day] ?? sequel?.id;
        if (s.event === sequel?.id && sequel) s.followups = s.followups.filter(f => f !== sequel);
        if (!s.event) {
          const reserved = Object.values(MEME_SCHEDULE);
          do { s.event = s.eventDeck[s.eventIndex++]; } while (s.event && (s.seen.includes(s.event) || reserved.includes(s.event)));
        }
        s.event ??= null;
        if (s.event && !s.seen.includes(s.event)) s.seen.push(s.event);
        const shock = getEvent(s)?.shock;
        if (shock) for (const [id, factor] of Object.entries(shock)) {
          s.prices[id] = Math.max(8, Math.round(s.prices[id] * factor));
          s.history[id][s.history[id].length - 1] = s.prices[id];
        }
        message = `第 ${s.day} 天，到达${getLocation(s).name}。`;
      }
      break;
    }
    default: return fail('这个动作不存在。');
  }
  checkFailure(s);
  return { state: s, error: null, message: message || s.ending?.subtitle || '' };
}

// Only accept bounded, structurally valid saves. Text is escaped by the renderer too.
export function isValidSave(s) {
  if (!s || typeof s !== 'object' || s.version !== VERSION) return false;
  if (!integer(s.day, 1, DAYS) || !integer(s.rng, 1, 0xffffffff) || !integer(s.seed, 1, 0xffffffff)) return false;
  if (!ROLES.some(r => r.id === s.role) || !LOCATIONS.some(l => l.id === s.location) || !NEWS.some(n => n.id === s.news)) return false;
  for (const k of ['cash', 'debt', 'totalEarned', 'totalInterest', 'jobsDone', 'daysRested', 'borrowed']) if (!integer(s[k])) return false;
  if (!integer(s.tradeProfit, -1e9) || !integer(s.lastBorrowDay, -10, DAYS)) return false;
  for (const k of ['health', 'stress', 'skill', 'reputation', 'techDebt']) if (!integer(s[k], 0, 100)) return false;
  if (!integer(s.ap, 0, 2) || !integer(s.products, 0, 6) || !integer(s.progress, 0, 2) || ![18, 28, 38, 48, 58].includes(s.capacity)) return false;
  if (!s.inventory || !s.prices || !s.previousPrices || !s.history) return false;
  for (const g of GOODS) {
    const item = s.inventory[g.id];
    if (!item || !integer(item.qty, 0, s.capacity) || !integer(item.cost) || (!item.qty && item.cost !== 0)) return false;
    if (!integer(s.prices[g.id], 1, 1e7)) return false;
    if (s.previousPrices[g.id] !== undefined && !integer(s.previousPrices[g.id], 1, 1e7)) return false;
    if (!Array.isArray(s.history[g.id]) || s.history[g.id].length < 1 || s.history[g.id].length > 8 || !s.history[g.id].every(v => integer(v, 1, 1e7))) return false;
  }
  if (usedSpace(s) > s.capacity) return false;
  if (!Array.isArray(s.eventDeck) || s.eventDeck.length !== EVENTS.length || new Set(s.eventDeck).size !== EVENTS.length || !s.eventDeck.every(id => EVENTS.some(e => e.id === id))) return false;
  if (!integer(s.eventIndex, 0, EVENTS.length) || (s.event !== null && !allEvents.some(e => e.id === s.event))) return false;
  if (!integer(s.stance, 0, 100) || !Array.isArray(s.seen) || s.seen.length > allEvents.length || new Set(s.seen).size !== s.seen.length || !s.seen.every(id => allEvents.some(e => e.id === id))) return false;
  if ((s.model !== null && !MODELS.some(m => m.id === s.model)) || !integer(s.modelUntil, 0, DAYS)) return false;
  if (s.lastEvent !== null && !allEvents.some(e => e.id === s.lastEvent)) return false;
  if (!Array.isArray(s.followups) || s.followups.length > FOLLOWUPS.length || !s.followups.every(f => f && integer(f.day, 1, DAYS) && FOLLOWUPS.some(e => e.id === f.id))) return false;
  if (!['playing', 'ended'].includes(s.status) || (s.status === 'ended' && (!s.ending || typeof s.ending.title !== 'string' || s.event !== null))) return false;
  if (s.status === 'playing' && (s.ending !== null || s.health <= 0 || s.stress >= 100 || s.debt > 50000)) return false;
  if (!Array.isArray(s.journal) || s.journal.length > 240 || !s.journal.every(x => x && integer(x.day, 1, DAYS) && typeof x.text === 'string' && x.text.length <= 1200 && typeof x.kind === 'string')) return false;
  if (!Array.isArray(s.receipts) || s.receipts.length > DAYS || !s.receipts.every(r => r && integer(r.day, 1, DAYS) && ['revenue', 'cost', 'interest', 'shortage'].every(k => integer(r[k])))) return false;
  if (s.status === 'ended') s.ending = endingFor(s);
  return true;
}

export function parseSave(text) {
  try {
    if (typeof text !== 'string' || text.length > 250000) return null;
    const s = JSON.parse(text);
    if (s?.version === 1 && Array.isArray(s.eventDeck) && integer(s.eventIndex, 0, s.eventDeck.length)) {
      const oldIds = s.eventDeck;
      if (new Set(oldIds).size !== oldIds.length || !oldIds.every(id => EVENTS.some(e => e.id === id))) return null;
      s.seen = [...new Set(['intro', ...oldIds.slice(0, s.eventIndex), ...(s.event ? [s.event] : [])])];
      s.eventDeck = [...oldIds, ...EVENTS.map(e => e.id).filter(id => !oldIds.includes(id))];
      s.followups = []; s.stance = 50; s.lastEvent = null; s.model = null; s.modelUntil = 0; s.version = VERSION;
      for (const g of GOODS.filter(g => ['b300', 'rtx'].includes(g.id))) {
        s.inventory[g.id] = { qty: 0, cost: 0 }; s.prices[g.id] = g.base;
        s.previousPrices[g.id] = g.base; s.history[g.id] = [g.base];
      }
    }
    return isValidSave(s) ? s : null;
  } catch { return null; }
}

export function shareText(s) {
  const end = s.ending ?? endingFor(s);
  return `《AI 浮生记》｜${end.title}\n活到了第 ${s.day} / 40 天，净资产 ¥${netWorth(s).toLocaleString('zh-CN')}。\n健康 ${s.health} · 压力 ${s.stress} · 小产品 ${s.products} 个\n${end.subtitle}\n你能在 AI 时代，保住多少钱和多少自己？`;
}

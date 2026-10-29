import { GOODS, LOCATIONS, ROLES, NEWS, EVENTS, MILESTONES, INTRO_EVENT, RUMORS, ARRIVALS, WRITE_OUTCOMES, ACTION_ROLLS, ACTION_FLAVOR, OPENING_GOODS, GOODS_PER_DAY, QUESTS, PERKS, DRAFT_DAYS, RENT_DAYS, RENT_LATE_RATE, GOOD_OUTCOMES, BAD_OUTCOMES, VIPS, ITEMS, DEPTH_STEP, DEPTH_FLOOR } from './content.js';
import { FOLLOWUPS, MEME_SCHEDULE, rheostat } from './memes.js';
import { MODELS, PROFILES, getModel, modelBonus, featuredModel } from './models.js';
import { drawNews, getEdition, validNews } from './news.js';
import { EXTRA_GOODS, EXTRA_MARKET_FACTORS } from './goods-extra.js';
import { careerOffer, careerDemand, careerAction } from './careers.js';
import { RULESET, MAX_COMMANDS, cleanCommand, validProof } from './run-proof.js';

export const VERSION = 10;
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
export const getNews = s => {
  const topic = NEWS.find(n => n.id === s.news), edition = getEdition(s.newsEdition);
  const copy = edition?.topic === s.news ? edition : {};
  const factors = { ...topic.factors, ...(s.newsLegacy ? {} : { ...EXTRA_MARKET_FACTORS[topic.id], ...copy.market }) };
  const detail = Object.entries(factors).map(([id, factor]) => `${GOODS.find(g => g.id === id).short} ×${factor}`).join(' · ');
  return { ...topic, ...copy, id: topic.id, factors, detail: `${detail || '市场平静，留意各站价差。'}${topic.product ? ` · 产品当日收入 ×${topic.product}` : ''}` };
};
export const nextStop = s => LOCATIONS[(LOCATIONS.findIndex(l => l.id === s.location) + 1) % LOCATIONS.length].id;
export const travelFare = (s, location) => location === nextStop(s) || location === s.location ? 0 : 120;
export const gameResult = s => s.health <= 0 || s.stress >= 100 || s.debt > 50000 ? '提前出局' : s.day === DAYS && s.status === 'ended' ? (s.debt === 0 ? '通关成功' : '未通关') : '挑战中';
export const getEvent = s => {
  const e = allEvents.find(e => e.id === s.event);
  if (!e) return null;
  if (!e.featured) return e;
  const name = featuredModel(s).name;
  return { ...e, title: e.title.replaceAll('{model}', name), text: e.text.replaceAll('{model}', name) };
};
export const getRumor = s => RUMORS.find(r => r.id === s.rumor) ?? null;
export const getArrival = s => {
  const a = s.arrival && ARRIVALS.find(a => a.id === s.arrival.id);
  if (!a) return null;
  const n = s.arrival.amount, i = a.amounts?.indexOf(n) ?? -1;
  return { ...a, text: a.text.replace('{n}', n.toLocaleString('zh-CN')), note: i >= 0 ? a.notes[i] : a.note, effects: a.key ? { [a.key]: n } : a.effects };
};
export const modelFee = (s, model) => s.role === 'grad' ? Math.ceil(model.fee / 2) : model.fee;
export const expandCost = s => 700 + (s.capacity - 18) * 40;
export const sells = (s, id) => s.available.includes(id);
export const hasPerk = (s, id) => !!s.perks?.includes(id);
const baseBuy = (s, id) => hasPerk(s, 'scalper') ? Math.max(2, Math.round(s.prices[id] * .95)) : s.prices[id];
const baseSale = (s, id) => Math.max(1, Math.min(baseBuy(s, id) - 1, Math.floor(s.prices[id] * (hasPerk(s, 'scale') ? .93 : .9))));
const traded = (s, id, side) => s.flow?.[id]?.[side] ?? 0;
// Price of the k-th unit traded today at this station: buying lifts the ask, selling sinks the bid.
const unitBuy = (s, id, k) => Math.round(baseBuy(s, id) * (1 + DEPTH_STEP * k));
const unitSale = (s, id, k) => Math.max(1, Math.floor(baseSale(s, id) * Math.max(DEPTH_FLOOR, 1 - DEPTH_STEP * k)));
export const buyPrice = (s, id) => unitBuy(s, id, traded(s, id, 'b'));
export const buyCost = (s, id, qty) => { let n = 0; for (let i = 0; i < qty; i++) n += unitBuy(s, id, traded(s, id, 'b') + i); return n; };
export const sellIncome = (s, id, qty) => { let n = 0; for (let i = 0; i < qty; i++) n += unitSale(s, id, traded(s, id, 's') + i); return n; };
export const depth = (s, id) => ({ bought: traded(s, id, 'b'), sold: traded(s, id, 's'), bidCut: Math.round(Math.min(1 - DEPTH_FLOOR, DEPTH_STEP * traded(s, id, 's')) * 100), askLift: Math.round(DEPTH_STEP * traded(s, id, 'b') * 100) });
export const activeVips = s => (s.vips ?? []).filter(v => v.from <= s.day && s.day <= v.until).map(v => ({ ...VIPS.find(x => x.id === v.id), ...v }));
export const upcomingVips = s => (s.vips ?? []).filter(v => v.from > s.day).map(v => ({ ...VIPS.find(x => x.id === v.id), ...v }));
const aura = (s, key, fallback) => activeVips(s).reduce((n, v) => v.aura[key] === undefined ? n : key === 'work' || key === 'rush' ? n * v.aura[key] : n + v.aura[key], fallback);
export const itemFor = (s, action) => Object.keys(s.items ?? {}).find(id => ITEMS[id].action === action && s.items[id] > 0) ?? null;
export const nightlyWear = s => Math.max(0, 1 + (s.stress >= 70 ? 5 : s.stress >= 50 ? 2 : 0) - (hasPerk(s, 'chair') ? 1 : 0));
export const rentDue = s => s.rent && !s.rent.paid ? s.rent.due : 0;
const emptyStats = () => ({ best: null, worst: null, crits: 0, flops: 0, hospital: 0, viral: 0, rentPaid: 0, rentLate: 0, visits: {} });
export const getQuest = s => s.quest && QUESTS.find(q => q.id === s.quest.id);
export function questProgress(s) {
  const q = getQuest(s); if (!q) return null;
  const b = s.quest.base;
  const value = { tradeProfit: s.tradeProfit - b.tradeProfit, repaid: b.debt - s.debt, skill: s.skill - b.skill, cash: s.cash - b.cash, reputation: s.reputation - b.reputation, calm: s.stress }[q.track];
  return { ...q, value, done: q.track === 'calm' ? value < q.need : value >= q.need };
}
// Typical quote for today, ignoring station and news, so players can tell cheap from expensive.
export const referencePrice = (s, id) => {
  const g = GOODS.find(g => g.id === id);
  return Math.round(g.base * Math.max(.22, 1 - g.decay * (s.day - 1)) * 1.175);
};
export function priceHeat(s, id) {
  const ratio = s.prices[id] / referencePrice(s, id);
  if (ratio >= 2) return { id: 'hot', label: '暴涨', ratio };
  if (ratio >= 1.3) return { id: 'high', label: '偏贵', ratio };
  if (ratio <= .5) return { id: 'crash', label: '跳水', ratio };
  if (ratio <= .75) return { id: 'cheap', label: '便宜', ratio };
  return { id: 'fair', label: '平价', ratio };
}
export const usedSpace = s => GOODS.reduce((n, g) => n + s.inventory[g.id].qty, 0);
// Selling is always below buying, even with both trade perks, so a same-day round trip never prints money.
export const salePrice = (s, id) => unitSale(s, id, traded(s, id, 's'));
export const inventoryValue = s => GOODS.reduce((n, g) => n + s.inventory[g.id].qty * salePrice(s, g.id), 0);
export const netWorth = s => s.cash + inventoryValue(s) - s.debt;
export const productIncome = s => Math.max(0, Math.floor(s.products * Math.max(25, 140 + s.reputation * 1.6 - s.techDebt * 1.3) * (getNews(s)?.product ?? 1) * (s.role === 'opc' ? 1.4 : 1) * (hasPerk(s, 'cofounder') ? 1.2 : 1)));
export const dailyCost = s => 90 + (s.location === 'home' ? 0 : 40) + 20 + s.products * 12 - (hasPerk(s, 'coupon') ? 40 : 0);
export const dailyInterest = s => Math.ceil(s.debt * (hasPerk(s, 'lowrate') ? .012 : INTEREST));

const pick = (lines, n) => lines[Math.abs(n) % lines.length];
const BUY_LINES = ['黄牛对你竖起了大拇指。', '你已经开始想象它暴涨的样子了。', '仓库里传来一声轻轻的叹息。', '韭菜也有春天，对吧？', '下单那一刻，你感觉自己是巴菲特。'];
const PROFIT_LINES = ['低买高卖，你就是中关村巴菲特。', '这一单，够吃一个月沙县。', '黄牛看你的眼神变了：同行。', '截图发朋友圈，配文“运气好”。'];
const LOSS_LINES = ['割肉的声音很轻，心很疼。', '交学费了，学费没有发票。', '你安慰自己：这叫止损，不叫亏。', '仓库清爽了，钱包也清爽了。'];
const REPAY_LINES = ['催收短信少了一条。', '信用分在偷偷上涨。', '利息君表示很遗憾。'];

// The year-end persona: first matching rule wins. Pure function of the saved state, so the report never rerolls.
export function personaFor(s) {
  const st = s.stats ?? emptyStats(), top = Object.entries(st.visits).sort((a, b) => b[1] - a[1])[0];
  const place = top && LOCATIONS.find(l => l.id === top[0]);
  const rules = [
    [st.hospital >= 2, '福报战神', '医院 VIP，护士都认识你。下次记得先买人体工学椅。'],
    [st.viral >= 3, '流量收割机', '三次十万加。你不是在写稿，你是在开盲盒，而且一直开出金的。'],
    [s.tradeProfit >= 20000, '中关村倒爷', '你对价差的嗅觉，比模型对上下文的记忆还长。'],
    [st.crits >= 8, '天选锦鲤', '暴击 8 次以上。建议把你的头像设为转发锦鲤。'],
    [st.flops >= 8, '非酋本酋', '翻车 8 次以上。不是你不行，是随机数生成器针对你。'],
    [s.daysRested >= 18, '躺平宗师', '休息次数比加班多。你证明了：人类的核心竞争力是睡觉。'],
    [s.jobsDone >= 40, '人肉 Agent', '接了四十多单。你比任何 Agent 都更像 Agent，而且不会死循环。'],
    [s.products >= 3, '一人独角兽', '三个小产品在跑。估值暂时为零，但现金流是真的。'],
    [s.perks?.length >= 4, '外挂玩家', '装满了外挂。别人在玩游戏，你在玩构筑。'],
    [st.rentLate >= 2, '房东的噩梦', '房租拖了两次以上。房东已经把你写进了他的年终总结。'],
    [!!place && top[1] >= 14, `${place?.name}钉子户`, `在${place?.name}待了 ${top?.[1]} 天。你不是在那儿上班，你是住那儿了。`],
  ];
  const hit = rules.find(r => r[0]);
  return hit ? { title: hit[1], text: hit[2] } : { title: '普通但努力的碳基生物', text: '没有传奇，也没有翻车。你只是认真地过完了 40 天，这很难得。' };
}

function log(s, text, kind = 'normal') {
  s.journal.unshift({ day: s.day, text, kind });
  s.journal = s.journal.slice(0, 240);
}

function market(s) {
  s.newsLegacy = false;
  s.previousPrices = { ...s.prices };
  drawNews(s, random);
  s.flow = {};
  scheduleVips(s);
  const news = getNews(s), place = getLocation(s), present = activeVips(s);
  const vipFactor = id => present.reduce((n, v) => n * (v.global[id] ?? 1) * (v.station === s.location ? v.local[id] ?? 1 : 1), 1);
  for (const g of GOODS) {
    const age = Math.max(.22, 1 - g.decay * (s.day - 1));
    s.prices[g.id] = Math.max(8, Math.round(g.base * age * (.65 + random(s) * 1.05) * (place.factors[g.id] ?? 1) * (news.factors[g.id] ?? 1) * vipFactor(g.id)));
    s.history[g.id] = [...(s.history[g.id] ?? []), s.prices[g.id]].slice(-8);
  }
  // Put at least two headline-affected goods on today's shelf, then rotate the rest.
  const featured = shuffle(s, Object.keys(news.factors)).slice(0, 2);
  const picked = s.day === 1 ? OPENING_GOODS : [...featured, ...shuffle(s, GOODS.map(g => g.id).filter(id => !featured.includes(id)))].slice(0, GOODS_PER_DAY);
  s.available = GOODS.map(g => g.id).filter(id => picked.includes(id));
  s.rumor = null;
  const rumors = RUMORS.filter(r => s.available.includes(r.good));
  if (s.day > 1 && rumors.length && random(s) < .4) {
    const r = rumors[Math.floor(random(s) * rumors.length)];
    s.prices[r.good] = Math.max(8, Math.round(s.prices[r.good] * r.factor));
    s.history[r.good][s.history[r.good].length - 1] = s.prices[r.good];
    s.rumor = r.id;
  }
  s.arrival = null;
  const here = ARRIVALS.filter(a => a.loc === s.location);
  if (s.day > 1 && here.length && random(s) < .55) {
    const a = here[Math.floor(random(s) * here.length)];
    s.arrival = { id: a.id, amount: a.amounts ? a.amounts[Math.floor(random(s) * a.amounts.length)] : 0 };
    const got = getArrival(s);
    applyEffects(s, got.effects);
    log(s, `到站：${got.text}${got.note}`, 'arrival');
  }
  // What the player saw here, for the map. Only the station visited today is updated.
  s.intel = { ...(s.intel ?? {}), [s.location]: { day: s.day, cheap: s.available.filter(id => ['crash', 'cheap'].includes(priceHeat(s, id).id)), dear: s.available.filter(id => ['hot', 'high'].includes(priceHeat(s, id).id)) } };
  const quests = QUESTS.filter(q => q.track === 'skill' ? s.skill + q.need <= 100 : q.track === 'reputation' ? s.reputation + q.need <= 100 : q.track === 'repaid' ? s.debt >= q.need : true);
  s.quest = s.day > 1 ? { id: quests[Math.floor(random(s) * quests.length)].id, base: { tradeProfit: s.tradeProfit, debt: s.debt, skill: s.skill, cash: s.cash, reputation: s.reputation } } : null;
  s.draft = DRAFT_DAYS.includes(s.day) ? shuffle(s, PERKS.map(p => p.id).filter(id => !hasPerk(s, id))).slice(0, 3) : null;
  s.rent = RENT_DAYS[s.day] ? { due: RENT_DAYS[s.day], paid: false } : null;
  if (s.stats) s.stats.visits[s.location] = (s.stats.visits[s.location] ?? 0) + 1;
  for (const v of s.vips) if (v.from <= s.day && s.day <= v.until && v.station === s.location && !v.claimed) {
    const vip = VIPS.find(x => x.id === v.id), item = ITEMS[vip.item];
    s.items[vip.item] = (s.items[vip.item] ?? 0) + item.charges; v.claimed = true;
    log(s, `偶遇${vip.name}「${vip.title}」，拿到道具「${item.name}」：${item.desc}。`, 'vip');
  }
}

// A seeded itinerary creates real quiet days: 5–7 days between one-day visits.
// Only tomorrow's opportunity is revealed. Inspecting/reloading cannot reroll it.
function scheduleVips(s) {
  s.vips = (s.vips ?? []).filter(v => v.until >= s.day);
  let from = 4 + (s.seed % 3), index = 0;
  while (from <= DAYS) {
    if (from >= s.day && from <= s.day + 1 && !s.vips.length) {
      const vip = VIPS[((s.seed >>> 8) + index) % VIPS.length];
      s.vips.push({ id: vip.id, station: vip.station, from, until: from, claimed: false });
    }
    index++;
    from += 5 + (((s.seed ^ Math.imul(index, 1597334677)) >>> 0) % 3);
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
    prices: {}, previousPrices: {}, history: {}, news: 'normal', newsEdition: null, newsSeen: [], rumor: null, arrival: null, lastWrite: null, lastAction: null, available: [], intel: {}, quest: null, questsDone: 0, perks: [], draft: null, rent: null, stats: emptyStats(), vips: [], items: {}, flow: {},
    event: 'intro', eventDeck: [], eventIndex: 0, journal: [], receipts: [],
    seen: ['intro'], followups: [], lastEvent: null, stance: 50,
    model: null, modelUntil: 0,
    totalEarned: 0, totalInterest: 0, jobsDone: 0, tradeProfit: 0, daysRested: 0,
    borrowed: 0, lastBorrowDay: -10, status: 'playing', ending: null, failure: null,
    proof: { ruleset: RULESET, commands: [] },
  };
  s.eventDeck = shuffle(s, EVENTS.map(e => e.id));
  market(s);
  log(s, role.story, 'story');
  return s;
}

export function effectText(effects) {
  const labels = { cash: '现金', health: '健康', stress: '压力', skill: '技能', reputation: '口碑', techDebt: '技术债', debt: '欠款' };
  return Object.entries(effects).map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? '+' : ''}${value}${key === 'cash' ? ' 元' : ''}`).join(' · ') || '不消耗行动';
}

function applyEffects(s, effects) {
  for (const [key, amount] of Object.entries(effects)) {
    s[key] += amount;
    if (['health', 'stress', 'skill', 'reputation', 'techDebt'].includes(key)) s[key] = clamp(s[key], 0, 100);
    if (key === 'cash' && amount > 0) s.totalEarned += amount;
  }
}

// Odds and payouts shown to the player are the ones rolled.
export function writeOutcomes(s) {
  const mult = (s.role === 'creator' ? 1.5 : 1) * (s.location === 'stream' ? 1.5 : 1);
  const base = WRITE_OUTCOMES.map(o => s.role === 'creator' ? (o.id === 'viral' ? 16 : o.id === 'meh' ? 22 : o.weight) : o.weight);
  // Perks move odds into “meh” so the total stays 100.
  const weights = WRITE_OUTCOMES.map((o, i) => base[i] - (hasPerk(s, 'gacha') && ['gacha', 'limited'].includes(o.id) ? Math.floor(base[i] / 2) : 0) + (hasPerk(s, 'koi') && o.id === 'viral' ? 6 : 0) + (o.id === 'viral' ? aura(s, 'viral', 0) + (itemFor(s, 'write') ? 15 : 0) : 0));
  const meh = WRITE_OUTCOMES.findIndex(o => o.id === 'meh');
  weights[meh] += 100 - weights.reduce((n, w) => n + w, 0);
  return WRITE_OUTCOMES.map((o, i) => ({ ...o, weight: weights[i], effects: { ...(o.cash ? { cash: Math.round(o.cash * mult) + (o.cash > 0 ? modelBonus(s)?.work ?? 0 : 0) } : {}), ...o.effects } }));
}

export const combinedEffects = (base, extra) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) out[k] = (out[k] ?? 0) + v;
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
};

export function actionInfo(s, action) {
  if (!Object.hasOwn(ACTION_FLAVOR, action)) return null;
  const bonus = modelBonus(s), role = s.role;
  const offer = careerOffer(s), demand = careerDemand(s);
  const wage = Math.round((offer.base + s.skill * offer.skill + s.reputation * offer.rep + (s.location === 'jobs' ? 160 : 0)) * offer.mult * offer.rate * (demand?.active ? demand.rate : 1));
  const craft = s.skill >= 60 ? 4 : s.skill >= 40 ? 2 : 0;
  const job = Math.round(wage * (hasPerk(s, 'keyboard') ? 1.15 : 1) * aura(s, 'work', 1)) + (bonus?.work ?? 0);
  const infos = {
    work: { name: '认真接一单', desc: '不卖奇迹，按约交付。', icon: 'BriefcaseBusiness', effects: { cash: job, health: -4, stress: 8, reputation: 2 }, after: '交付完成。客户说“收到”，这两个字比一百颗星值钱。' },
    rush: { name: '熬夜赶急单', desc: '现金来得快，技术债也是。', icon: 'Zap', effects: { cash: Math.floor(job * 1.65 * aura(s, 'rush', 1)), health: -9, stress: 15, techDebt: Math.max(0, (role === 'coder' ? 5 : 10) - craft), reputation: -1 }, after: '钱到了。你把明天的自己设成了负责人。' },
    learn: { name: '弄懂一点原理', desc: '多一块不会被版本更新删掉的能力。', icon: 'BookOpen', effects: { cash: -80, skill: 7 + (s.location === 'opensource' ? 3 : s.location === 'hackathon' ? 2 : 0) + (role === 'grad' ? 4 : 0) + (hasPerk(s, 'monitor') ? 3 : 0) + aura(s, 'learn', 0) + (bonus?.learn ?? 0), stress: 3 }, after: '学会了一点。不是看过，不是收藏，是会了。' },
    rest: { name: '关机休息', desc: '让活人退出后台，回到前台。', icon: 'Coffee', effects: { health: 16 + (s.location === 'home' ? 6 : 0) + (role === 'worker' ? 6 : 0) + (hasPerk(s, 'pillow') ? 4 : 0), stress: -22 - (hasPerk(s, 'pillow') ? 8 : 0) - aura(s, 'rest', 0) }, after: '没有产出的一格行动，也算在认真生活。' },
    build: { name: '做自己的产品', desc: `进度 ${s.progress}/3 · 做满 3 次上线一个`, icon: 'PackagePlus', effects: { cash: -Math.round((260 + s.products * 90) * (role === 'opc' ? .7 : 1)), health: -2, stress: 6, techDebt: Math.max(0, 3 - craft + (bonus?.build ?? 0) - (role === 'coder' ? 2 : 0) - (hasPerk(s, 'cofounder') ? 3 : 0)), reputation: 1 }, after: '又完成了一小块。不是“平台”，是一个具体的问题。', reason: s.skill < 20 ? '技能达到 20 后可研发' : s.products >= 6 ? '最多维护 6 个产品' : '' },
    write: { name: '写稿发帖', desc: '抽卡式创作：可能 10 万+，也可能住院。', icon: 'PenLine', effects: { health: -3, stress: 5 }, outcomes: writeOutcomes(s), after: '' },
    maintain: { name: '还一点技术债', desc: '修旧坑，也保护每天的产品收入。', icon: 'Wrench', effects: { cash: -90, techDebt: -18, stress: -5, skill: 2 }, after: '删掉一层包装。你终于又能看懂自己的系统了。' },
    social: { name: '去饭局社交', desc: '扫码加了 200 个好友，真朋友 0.5 个。', icon: 'Users', effects: { cash: -120, health: -2, stress: -3, reputation: 4 }, after: '' },
  };
  const info = infos[action];
  if (!info) return null;
  const activity = careerAction(s, action);
  info.name = activity.name;
  info.process = activity.process;
  info.flavors = ACTION_FLAVOR[action].map(line => `「${activity.name}」：${line}`);
  if (action === 'work') {
    info.desc = `${offer.label}专属委托 · ${offer.grade ? `手艺加价 ${offer.grade * 20}% · ` : ''}${offer.client ? `熟客加价 ${offer.client * 10}% · ` : ''} ${demand?.active ? '新闻加价 30% · ' : ''}${bonus ? `搭子另加 ¥${bonus.work}` : '今日报价已含职业与地点加成'}`;
    info.flavors[0] = activity.story;
    info.flavors[1] = `${activity.story} 甲方终于把“收到”变成了转账。`;
  }
  if (['work', 'rush', 'write', 'learn', 'build'].includes(action) && bonus) info.assist = action === 'learn' ? `搭子学习 +${bonus.learn}` : action === 'build' ? `搭子技术债 ${bonus.build}` : action === 'write' ? `有稿费时搭子 +¥${bonus.work}` : `含搭子 +¥${action === 'rush' ? Math.floor(job * 1.65) - Math.floor(wage * 1.65) : bonus.work}`;
  if (role === 'worker' && info.effects.stress > 0) info.effects = { ...info.effects, stress: Math.round(info.effects.stress * .6) };
  if (hasPerk(s, 'headphones') && info.effects.stress > 0) info.effects = { ...info.effects, stress: Math.max(0, info.effects.stress - 2) };
  if (aura(s, 'calm', 0) && info.effects.stress > 0) info.effects = { ...info.effects, stress: Math.max(0, info.effects.stress - aura(s, 'calm', 0)) };
  const item = itemFor(s, action);
  if (item) {
    const e = { ...info.effects };
    if (item === 'leather') { e.cash = Math.round(e.cash / 2); e.techDebt = Math.max(0, (e.techDebt ?? 0) - 3); }
    if (item === 'bowl') e.cash += 300;
    if (item === 'rocket') e.cash = Math.round(e.cash * 1.5);
    if (item === 'bbq') e.skill += 5;
    if (item === 'manual') { e.techDebt -= 20; e.stress -= 10; }
    if (item === 'plush') e.health += 10;
    info.effects = e; info.item = item;
  }
  if (ACTION_ROLLS[action]) {
    const rolls = ACTION_ROLLS[action].map(({ bonus: { cashRate, ...rest }, ...r }) => ({ ...r, effects: { ...(cashRate ? { cash: Math.round((info.effects.cash ?? 0) * cashRate) } : {}), ...rest } }));
    // Launch parties and hackathons are where the angels drink.
    if (action === 'social' && ['launch', 'hackathon'].includes(s.location)) rolls[0].weight = 14;
    if (action === 'work') rolls.find(r => r.id === 'stiffed').weight = s.reputation >= 60 ? 0 : s.reputation >= 30 ? 5 : 10;
    if (action === 'rush') rolls.find(r => r.id === 'spaghetti').weight += s.stress >= 70 ? 20 : s.stress >= 50 ? 10 : 0;
    if (hasPerk(s, 'koi')) for (const r of rolls) if (GOOD_OUTCOMES.includes(r.id)) r.weight += 6;
    info.outcomes = [{ id: 'normal', rank: '', weight: 100 - rolls.reduce((n, r) => n + r.weight, 0), effects: {}, text: '' }, ...rolls];
    if (action === 'work') for (const outcome of info.outcomes) {
      if (outcome.id === 'jackpot') outcome.text = offer.jackpot;
      if (outcome.id === 'stiffed') outcome.text = offer.stiffed;
    }
  }
  return { ...info, reason: info.reason || (s.cash + (info.effects.cash ?? 0) < 0 ? '现金不足' : s.ap < 1 ? '今天的行动已用完' : '') };
}

export function endingFor(s) {
  const worth = netWorth(s);
  if (s.health <= 0) return { id: 'health', title: '人类进程已挂起', subtitle: '身体替你点了“强制退出”，没有弹窗确认。', text: '模型可以重启，你的腰椎不行。显卡坏了能换，人坏了只能挂号。下次给休息留一格；健康降到 0 会提前结束。' };
  if (s.stress >= 100) return { id: 'burnout', title: '上下文已满', subtitle: '你记住了所有新名词，却忘了自己为什么开始。', text: '压力 100，系统提示：“请开启新对话。”关掉几个群、拒绝几个需求，你不会错过整个时代——它每周都会重新发布一次。' };
  if (s.debt > 50000) return { id: 'debt', title: '被利息接管的人生', subtitle: '你没等到 AGI，先等到了催收。', text: '欠款超过 50,000，额度被收回。最大的复利不在模型能力曲线上，在你的借款合同里。下次先留生活费，别拿欠款截图当融资新闻。' };
  if (s.debt === 0 && s.products >= 3 && s.reputation >= 45 && s.health >= 40 && s.stress < 75)
    return { id: 'company', title: '一人公司，两脚着地', subtitle: '没有颠覆行业，但有人离不开你的产品。', text: '估值为零，现金流为正。你用几个具体的小工具换来了持续收入，也没把自己当成一次性耗材。这家公司全员一人，但终于有人。' };
  if (worth >= 18000 && (s.health < 45 || s.stress >= 70))
    return { id: 'rich', title: '有钱，没空活', subtitle: '财务报表很漂亮，体检报告另说。', text: '你成功把未来十年的精力，贴现成了今天的现金。下一阶段的核心 KPI 只有一个：睡满八小时，不看手机。' };
  if (s.debt === 0 && s.health >= 70 && s.stress <= 40)
    return { id: 'human', title: '人类保留区', subtitle: '账还清了，你也还在。', text: '你没有跑赢任何一个模型，只是按时吃饭、交付、睡觉。模型每周都在进化，而你这 40 天，好像也进化了一点点。' };
  if (s.debt === 0 && worth >= 15000)
    return { id: 'independent', title: '小而自由', subtitle: '风口一直在换，你的账户终于不靠许愿。', text: '你会看价差，也会看需求。下次再有人问你的护城河在哪，你可以先把账结清，再慢慢回答。' };
  if (s.debt > 0)
    return { id: 'subscription', title: '订阅制人生', subtitle: '工具续费了，希望还没到期。', text: '40 天过去，账还没清。你的人生像一个自动续费的会员：每天都在扣钱，偶尔也有新功能。下次先读合同的小字。' };
  return { id: 'finish', title: '体面收工', subtitle: '不必成为传说，也能把日子过下去。', text: '贷款清零。你没有追上每一个风口，也没被任何一个风口吹走。在这个人人都说“刚刚”的时代，这就叫赢。' };
}

function checkFailure(s) {
  if (s.status !== 'ended' && (s.health <= 0 || s.stress >= 100 || s.debt > 50000)) {
    s.status = 'ended'; s.ending = endingFor(s); s.event = null;
    log(s, s.ending.title, 'ending');
  }
}

export function transition(original, command) {
  const fail = error => ({ state: original, error, message: '' });
  if (!command || typeof command.type !== 'string') return fail('这个动作不存在。');
  if (original.status !== 'playing') return fail('本局已经结算，开始新一局再试。');
  const s = copy(original);
  let message = '';
  switch (command.type) {
    case 'ignore-event': {
      const event = getEvent(s);
      if (!event) return fail('今天没有待处理的遭遇。');
      message = `略过「${event.title}」，没有替你选择，不消耗行动。`;
      s.event = null; log(s, message, 'skip'); break;
    }
    case 'model': {
      const model = MODELS.find(m => m.id === command.id);
      if (!model) return fail('这个模型不在当前目录中。');
      if (getModel(s)) return fail('当前搭子还在合同期，结束后再换，别重复付费。');
      const fee = modelFee(s, model);
      if (s.cash < fee) return fail('现金不够，先靠自己也能玩。');
      s.cash -= fee; s.model = model.id; s.modelUntil = Math.min(DAYS, s.day + 4);
      message = `签下 ${model.name}，支付游戏币 ¥${fee}，有效至第 ${s.modelUntil} 天。不会自动续费。`;
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
      if (!sells(s, g.id)) return fail(`这一站今天不收${g.short}，换个地方再交易。`);
      const holding = s.inventory[g.id];
      if (command.type === 'buy') {
        const cost = buyCost(s, g.id, command.qty);
        if (usedSpace(s) + command.qty > s.capacity) return fail('仓库放不下了，先卖出或扩容。');
        if (cost > s.cash) return fail('现金不足，少买一点。');
        s.cash -= cost; holding.qty += command.qty; holding.cost += cost;
        s.flow[g.id] = { b: traded(s, g.id, 'b') + command.qty, s: traded(s, g.id, 's') };
        message = `买入 ${command.qty} ${g.unit}${g.name}，花费 ¥${cost.toLocaleString('zh-CN')}。${pick(BUY_LINES, s.day + command.qty)}`;
      } else {
        if (holding.qty < command.qty) return fail('持仓不够，不能卖出不存在的东西。');
        const income = sellIncome(s, g.id, command.qty);
        s.flow[g.id] = { b: traded(s, g.id, 'b'), s: traded(s, g.id, 's') + command.qty };
        const cost = command.qty === holding.qty ? holding.cost : Math.round(holding.cost * command.qty / holding.qty);
        s.cash += income; holding.qty -= command.qty; holding.cost -= cost; s.tradeProfit += income - cost;
        s.totalEarned += Math.max(0, income - cost);
        const profit = income - cost;
        if (!s.stats.best || profit > s.stats.best.profit) s.stats.best = { id: g.id, profit };
        if (!s.stats.worst || profit < s.stats.worst.profit) s.stats.worst = { id: g.id, profit };
        message = `卖出 ${command.qty} ${g.unit}${g.name}，到账 ¥${income.toLocaleString('zh-CN')}（${profit >= 0 ? '赚' : '亏'} ¥${Math.abs(profit).toLocaleString('zh-CN')}）。${pick(profit >= 0 ? PROFIT_LINES : LOSS_LINES, s.day + command.qty)}`;
      }
      log(s, message, 'trade'); break;
    }
    case 'action': {
      const info = actionInfo(s, command.id);
      if (!info) return fail('这个行动不存在。');
      if (info.reason) return fail(info.reason);
      applyEffects(s, info.effects); s.ap--;
      if (info.item) { s.items[info.item]--; if (!s.items[info.item]) delete s.items[info.item]; }
      if (info.outcomes) {
        let roll = random(s) * info.outcomes.reduce((n, o) => n + o.weight, 0);
        const o = info.outcomes.find(o => (roll -= o.weight) < 0) ?? info.outcomes.at(-1);
        applyEffects(s, o.effects);
        const pool = info.flavors ?? [''], flavor = o.id === 'normal' ? Math.floor(random(s) * pool.length) : 0;
        s.lastAction = { id: command.id, outcome: o.id, flavor };
        if (GOOD_OUTCOMES.includes(o.id)) s.stats.crits++;
        if (BAD_OUTCOMES.includes(o.id)) s.stats.flops++;
        if (o.id === 'hospital') s.stats.hospital++;
        if (o.id === 'viral') s.stats.viral++;
        if (command.id === 'write') s.lastWrite = o.id;
        if (command.id === 'work' || command.id === 'rush') s.jobsDone++;
        if (command.id === 'rest') s.daysRested++;
        if (command.id === 'build') {
          s.progress++;
          if (s.progress === 3) { s.products++; s.progress = 0; }
        }
        const text = o.id === 'normal' ? pool[flavor] : o.text;
        message = `${o.rank ? `【${o.rank}】` : ''}${text}${command.id === 'build' && s.progress === 0 ? `第 ${s.products} 个小产品上线！` : ''}`;
        log(s, `${info.name}：${message}（${effectText(combinedEffects(info.effects, o.effects))}）`, 'action');
        break;
      }
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
    case 'perk': {
      if (!s.draft) return fail('今天没有可以挑的外挂。');
      if (!s.draft.includes(command.id)) return fail('只能从这三张里挑一张。');
      const perk = PERKS.find(p => p.id === command.id);
      s.perks.push(perk.id); s.draft = null;
      message = `装上外挂「${perk.name}」：${perk.desc}。${perk.quote}`;
      log(s, message, 'perk'); break;
    }
    case 'rent': {
      const due = rentDue(s);
      if (!due) return fail('今天不用交房租。');
      if (s.cash < due) return fail(`房租 ¥${due}，现金不够。先卖点货或接单。`);
      s.cash -= due; s.rent.paid = true; s.stats.rentPaid++;
      message = `交了 ¥${due.toLocaleString('zh-CN')} 房租。房东满意地走了，顺手提醒你“下次准时”。`;
      log(s, message, 'finance'); break;
    }
    case 'expand': {
      if (s.capacity >= 58) return fail('仓库已到上限。');
      const cost = expandCost(s);
      if (s.cash < cost) return fail('现金不够扩仓。');
      s.cash -= cost; s.capacity += 10;
      message = `仓库扩到 ${s.capacity} 件，花了 ¥${cost}。别把它当成一定要囤满的理由。`;
      log(s, message, 'finance'); break;
    }
    case 'repay': {
      if (!integer(command.amount, 1)) return fail('还款金额须为正整数。');
      if (command.amount > s.debt) return fail('这比欠款还多，按剩余欠款还就好。');
      if (command.amount > s.cash) return fail('现金不足，请先赚到这笔钱。');
      s.cash -= command.amount; s.debt -= command.amount;
      message = s.debt === 0 ? '培训贷还清了。人生第一次，不是为了“回本”而学习。' : `已还款 ¥${command.amount}，剩余欠款 ¥${s.debt}。${pick(REPAY_LINES, s.day + command.amount)}`;
      log(s, message, 'finance'); break;
    }
    case 'borrow': {
      if (s.day - s.lastBorrowDay < 5) return fail('周转额度每 5 天只能用一次。');
      if (s.borrowed >= 6000 || s.debt + 1500 > 20000) return fail('周转额度已用完。');
      s.cash += 1500; s.debt += 1500; s.borrowed += 1500; s.lastBorrowDay = s.day;
      message = '借到 ¥1,500。日息照算，周转不是收入——花呗也这么说过。';
      log(s, message, 'finance'); break;
    }
    case 'travel':
    case 'finish': {
      const finishing = command.type === 'finish';
      if (finishing && s.day !== DAYS) return fail('第 40 天才可最终结算。');
      if (!finishing && s.day >= DAYS) return fail('今天是最后一天，请清理账目后结算。');
      if (!finishing && !LOCATIONS.some(l => l.id === command.location)) return fail('目的地不存在。');
      const fare = finishing ? 0 : travelFare(s, command.location);
      if (s.cash < fare) return fail(`打车需要 ¥${fare}，现金不足。可免费去下一站或留在原地。`);
      if (s.event) { log(s, `收工略过「${getEvent(s).title}」：未获得选项收益，也未触发选项后续。`, 'skip'); s.event = null; }
      if (fare) { s.cash -= fare; log(s, `打车去${LOCATIONS.find(l => l.id === command.location).name}，车费 ¥${fare}。`, 'travel'); }
      if (s.draft) { log(s, '外挂没挑就收工了，这一轮的三张卡作废。', 'skip'); s.draft = null; }
      const owed = rentDue(s);
      if (owed) {
        const late = Math.round(owed * RENT_LATE_RATE);
        s.debt += late; s.stress = clamp(s.stress + 12, 0, 100); s.reputation = clamp(s.reputation - 3, 0, 100); s.rent.paid = true; s.stats.rentLate++;
        log(s, `没交房租。房东：“那就记账上。”¥${late.toLocaleString('zh-CN')} 计入欠款，压力 +12，口碑 −3。`, 'finance');
      }
      const quest = questProgress(s);
      if (quest?.done) {
        applyEffects(s, quest.reward); s.questsDone++;
        log(s, `委托完成：${quest.title}，奖励 ${effectText(quest.reward)}。`, 'quest');
      }
      s.quest = null;
      // Bills apply to the day just lived, before moving. Day 40 is billed once too.
      const revenue = productIncome(s), cost = dailyCost(s), interest = dailyInterest(s);
      const shortage = Math.max(0, cost - s.cash - revenue);
      s.cash = Math.max(0, s.cash + revenue - cost);
      s.debt += interest + shortage; s.totalInterest += interest; s.totalEarned += revenue;
      s.health = Math.max(0, s.health - nightlyWear(s));
      s.receipts.unshift({ day: s.day, revenue, cost, interest, shortage, fare });
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
  if (s.status === 'ended' && failureReason(s)) {
    const reason = failureReason(s);
    s.failure = { key: reason.key, before: original[reason.key], after: s[reason.key], source: commandLabel(original, command), detail: s.journal.find(j => j.kind !== 'ending')?.text ?? '' };
  }
  if (s.proof) {
    const entry = cleanCommand(command);
    if (!entry || s.proof.commands.length >= MAX_COMMANDS) s.proof = null;
    else s.proof.commands.push(entry);
  }
  return { state: s, error: null, message: message || s.ending?.subtitle || '' };
}

export function failureReason(s) {
  if (s.health <= 0) return { key: 'health', label: '健康', title: '健康耗尽，提前出局', rule: '健康降到 0 就会出局', advice: '给休息留一格；压力高时，收工还会额外消耗健康。' };
  if (s.stress >= 100) return { key: 'stress', label: '压力', title: '压力达到上限，提前出局', rule: '压力达到 100 就会出局', advice: '休息基础减压 22，偶尔会被工作群打断；别把两格行动都拿去硬扛。' };
  if (s.debt > 50000) return { key: 'debt', label: '欠款', title: '欠款超过额度，提前出局', rule: '欠款超过 ¥50,000 就会出局', advice: '先卖货还债，留出生活费；每天的利息也会计入欠款。' };
  return null;
}

export function commandLabel(s, command) {
  if (command.type === 'action') return actionInfo(s, command.id)?.name ?? '今日安排';
  if (command.type === 'choose') return `${getEvent(s)?.title ?? '今日遭遇'} → ${getEvent(s)?.options[command.index]?.label ?? '作出选择'}`;
  if (command.type === 'travel') return `第 ${s.day} 天收工 → ${LOCATIONS.find(l => l.id === command.location)?.name ?? '下一站'}`;
  if (command.type === 'finish') return '最后一天结算';
  return '本次操作';
}

// Use visible odds/effects, never peek at the next RNG draw to warn a player.
export function commandRisk(s, command) {
  if (!['action', 'choose', 'travel', 'finish'].includes(command.type) || s.status !== 'playing') return null;
  let base = copy(s), outcomes = [{ weight: 1, effects: {} }];
  if (command.type === 'action') {
    const info = actionInfo(s, command.id);
    if (!info || info.reason) return null;
    applyEffects(base, info.effects); outcomes = info.outcomes ?? outcomes;
  } else if (command.type === 'choose') {
    const choice = getEvent(s)?.options[command.index];
    if (!choice || s.cash + (choice.effects.cash ?? 0) < 0) return null;
    applyEffects(base, choice.effects);
    if (choice.stance) applyEffects(base, rheostat(command.stance ?? s.stance).effects);
    outcomes = choice.outcomes ?? outcomes;
  } else if (['travel', 'finish'].includes(command.type)) {
    if (command.type === 'travel' && !LOCATIONS.some(l => l.id === command.location)) return null;
    const fare = command.type === 'finish' ? 0 : travelFare(s, command.location);
    if (s.cash < fare) return null;
    base.cash -= fare;
    const quest = questProgress(base); if (quest?.done) applyEffects(base, quest.reward);
    base.debt += dailyInterest(base) + Math.max(0, dailyCost(base) - base.cash - productIncome(base));
    if (rentDue(base)) { base.debt += Math.round(rentDue(base) * RENT_LATE_RATE); base.stress = clamp(base.stress + 12, 0, 100); }
    base.health = Math.max(0, base.health - nightlyWear(base));
    if (!failureReason(base) && command.type === 'travel') {
      const arrivals = ARRIVALS.filter(a => a.loc === command.location);
      if (arrivals.length) outcomes = [{ weight: .45, effects: {} }, ...arrivals.flatMap(a => a.amounts ? a.amounts.map(n => ({ weight: .55 / arrivals.length / a.amounts.length, effects: { [a.key]: n } })) : [{ weight: .55 / arrivals.length, effects: a.effects }])];
    }
  } else return null;
  const total = outcomes.reduce((n, o) => n + o.weight, 0), risks = [];
  let weight = 0;
  for (const outcome of outcomes) {
    const after = copy(base); applyEffects(after, outcome.effects);
    const reason = failureReason(after);
    if (reason) { weight += outcome.weight; risks.push(reason); }
  }
  if (!weight) return null;
  return { title: commandLabel(s, command), probability: Math.round(weight / total * 1000) / 10,
    reasons: [...new Map(risks.map(r => [r.key, { ...r, current: s[r.key] }])).values()] };
}

// Only accept bounded, structurally valid saves. Text is escaped by the renderer too.
export function isValidSave(s) {
  if (!s || typeof s !== 'object' || s.version !== VERSION) return false;
  if (!integer(s.day, 1, DAYS) || !integer(s.rng, 1, 0xffffffff) || !integer(s.seed, 1, 0xffffffff)) return false;
  if (!ROLES.some(r => r.id === s.role) || !LOCATIONS.some(l => l.id === s.location) || !NEWS.some(n => n.id === s.news)) return false;
  if (!validNews(s)) return false;
  if (s.newsLegacy !== undefined && typeof s.newsLegacy !== 'boolean') return false;
  for (const k of ['cash', 'debt', 'totalEarned', 'totalInterest', 'jobsDone', 'daysRested', 'borrowed']) if (!integer(s[k])) return false;
  if (!integer(s.tradeProfit, -1e9) || !integer(s.lastBorrowDay, -10, DAYS)) return false;
  for (const k of ['health', 'stress', 'skill', 'reputation', 'techDebt']) if (!integer(s[k], 0, 100)) return false;
  if (!integer(s.ap, 0, 2) || !integer(s.products, 0, 6) || !integer(s.progress, 0, 2) || ![18, 28, 38, 48, 58].includes(s.capacity)) return false;
  if (s.rumor !== null && !RUMORS.some(r => r.id === s.rumor)) return false;
  if (!Array.isArray(s.available) || s.available.length !== GOODS_PER_DAY || new Set(s.available).size !== GOODS_PER_DAY || !s.available.every(id => GOODS.some(g => g.id === id))) return false;
  if (!s.intel || typeof s.intel !== 'object' || Array.isArray(s.intel) || !Object.entries(s.intel).every(([loc, v]) => LOCATIONS.some(l => l.id === loc) && v && integer(v.day, 1, DAYS) && ['cheap', 'dear'].every(k => Array.isArray(v[k]) && v[k].every(id => GOODS.some(g => g.id === id))))) return false;
  if (s.quest !== null && !(s.quest && QUESTS.some(q => q.id === s.quest.id) && s.quest.base && ['tradeProfit', 'debt', 'skill', 'cash', 'reputation'].every(k => integer(s.quest.base[k], -1e9)))) return false;
  if (!integer(s.questsDone, 0, DAYS)) return false;
  if (!Array.isArray(s.perks) || s.perks.length > DRAFT_DAYS.length || new Set(s.perks).size !== s.perks.length || !s.perks.every(id => PERKS.some(p => p.id === id))) return false;
  if (s.draft !== null && !(Array.isArray(s.draft) && s.draft.length >= 1 && s.draft.length <= 3 && new Set(s.draft).size === s.draft.length && s.draft.every(id => PERKS.some(p => p.id === id) && !s.perks.includes(id)))) return false;
  if (s.rent !== null && !(s.rent && integer(s.rent.due, 1, 1e6) && typeof s.rent.paid === 'boolean')) return false;
  if (!Array.isArray(s.vips) || s.vips.length > 3 || !s.vips.every(v => v && VIPS.some(x => x.id === v.id && x.station === v.station) && integer(v.from, 1, DAYS) && (v.until === v.from || v.until === v.from + 1) && typeof v.claimed === 'boolean')) return false;
  if (!s.items || typeof s.items !== 'object' || Array.isArray(s.items) || !Object.entries(s.items).every(([id, n]) => ITEMS[id] && integer(n, 1, 20))) return false;
  if (!s.flow || typeof s.flow !== 'object' || Array.isArray(s.flow) || !Object.entries(s.flow).every(([id, f]) => GOODS.some(g => g.id === id) && f && integer(f.b, 0, 1000) && integer(f.s, 0, 1000))) return false;
  const st = s.stats, trade = t => t === null || (t && GOODS.some(g => g.id === t.id) && integer(t.profit, -1e9));
  if (!st || !trade(st.best) || !trade(st.worst) || !['crits', 'flops', 'hospital', 'viral', 'rentPaid', 'rentLate'].every(k => integer(st[k], 0, 1000)) || !st.visits || typeof st.visits !== 'object' || !Object.entries(st.visits).every(([loc, n]) => LOCATIONS.some(l => l.id === loc) && integer(n, 0, DAYS))) return false;
  if (s.arrival !== null && !(s.arrival && ARRIVALS.some(a => a.id === s.arrival.id && (a.amounts ? a.amounts.includes(s.arrival.amount) : s.arrival.amount === 0)))) return false;
  if (s.lastWrite !== null && !WRITE_OUTCOMES.some(o => o.id === s.lastWrite)) return false;
  if (s.lastAction !== null && !(s.lastAction && ACTION_FLAVOR[s.lastAction.id] && integer(s.lastAction.flavor, 0, ACTION_FLAVOR[s.lastAction.id].length - 1)
    && (s.lastAction.outcome === 'normal' || [...(ACTION_ROLLS[s.lastAction.id] ?? []), ...(s.lastAction.id === 'write' ? WRITE_OUTCOMES : [])].some(o => o.id === s.lastAction.outcome)))) return false;
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
      s.followups = []; s.stance = 50; s.lastEvent = null; s.model = null; s.modelUntil = 0; s.version = 2;
    }
    if (s?.version === 2 && s.inventory && s.prices && s.previousPrices && s.history) {
      // v3 swapped three goods. Holdings of retired goods are sold at their last quote; RNG and day are untouched.
      let refund = 0;
      for (const id of Object.keys(s.inventory).filter(id => !GOODS.some(g => g.id === id))) {
        const qty = s.inventory[id]?.qty, price = s.prices[id];
        if (integer(qty) && integer(price)) refund += Math.max(1, Math.floor(price * .9)) * qty;
        for (const key of ['inventory', 'prices', 'previousPrices', 'history']) delete s[key][id];
      }
      for (const g of GOODS) if (!s.inventory[g.id]) {
        s.inventory[g.id] = { qty: 0, cost: 0 }; s.prices[g.id] = g.base; s.previousPrices[g.id] = g.base; s.history[g.id] = [g.base];
      }
      if (integer(s.cash)) s.cash += refund;
      if (Array.isArray(s.journal) && refund) s.journal.unshift({ day: s.day, text: `货架换新：下架的旧货按回收价折现 ¥${refund}。`, kind: 'finance' });
      if (s.rumor && !RUMORS.some(r => r.id === s.rumor)) s.rumor = null;
      s.arrival = null; s.lastWrite = null; s.version = 3;
    }
    if (s?.version === 3 && s.inventory && s.prices && s.previousPrices && s.history) {
      // v4 added goods and per-station availability; the opening set keeps today's market as it was.
      for (const g of GOODS) if (!s.inventory[g.id]) {
        s.inventory[g.id] = { qty: 0, cost: 0 }; s.prices[g.id] = g.base; s.previousPrices[g.id] = g.base; s.history[g.id] = [g.base];
      }
      s.available = [...OPENING_GOODS]; s.intel = {}; s.quest = null; s.questsDone = 0; s.version = 4;
    }
    if (s?.version === 4) {
      // Keep today's original headline, quotes and RNG. Only future days draw new copy.
      s.newsEdition = `${s.news}-original`; s.newsSeen = [s.newsEdition]; s.version = 5;
    }
    if (s?.version === 5 && s.inventory && s.prices && s.previousPrices && s.history) {
      // New shelves join tomorrow. Preserve all existing holdings, quotes, day and RNG.
      for (const g of EXTRA_GOODS) if (!s.inventory[g.id]) {
        s.inventory[g.id] = { qty: 0, cost: 0 }; s.prices[g.id] = g.base; s.history[g.id] = [g.base];
      }
      s.newsLegacy = true; s.version = 6;
    }
    if (s?.version === 6) { s.proof = null; s.failure = null; s.version = 7; }
    if (s?.version === 7) {
      // v8 adds perks, rent days and the year-end report. Old runs keep playing; the old ruleset cannot be replayed on the leaderboard.
      s.perks = []; s.draft = null; s.rent = null; s.stats = emptyStats(); s.proof = null; s.version = 8;
    }
    if (s?.version === 8) {
      // v9 adds VIP visits, items and market depth. Today's quotes stay; the first VIP is announced tomorrow.
      s.vips = []; s.items = {}; s.flow = {}; s.proof = null; s.version = 9;
    }
    if (s?.version === 9) {
      // Preserve balances, RNG, today's prices and already announced visits.
      // Old command histories must never be replayed under the new economy.
      s.proof = null; s.version = VERSION;
    }
    if (s?.version === VERSION && Array.isArray(s.eventDeck)) {
      // Saves from before new events were added keep their order; new events join the end of the deck.
      s.rumor ??= null; s.arrival ??= null; s.lastWrite ??= null; s.lastAction ??= null;
      if (!validProof(s.proof)) s.proof = null;
      if (!(s.failure && ['health', 'stress', 'debt'].includes(s.failure.key) && integer(s.failure.before) && integer(s.failure.after) && typeof s.failure.source === 'string' && s.failure.source.length <= 200 && typeof s.failure.detail === 'string' && s.failure.detail.length <= 1200)) s.failure = null;
      // A contract on a model that left the roster ends early instead of invalidating the save.
      if (s.model !== null && s.model !== undefined && !MODELS.some(m => m.id === s.model)) { s.model = null; s.modelUntil = 0; }
      s.eventDeck = [...s.eventDeck, ...EVENTS.map(e => e.id).filter(id => !s.eventDeck.includes(id))];
    }
    return isValidSave(s) ? s : null;
  } catch { return null; }
}

export function shareText(s) {
  const end = s.ending ?? endingFor(s);
  const persona = personaFor(s);
  return `《AI 浮生记》｜${gameResult(s)} · ${end.title}\n我的 AI 浮生人格：【${persona.title}】${persona.text}\n活到了第 ${s.day} / 40 天，净资产 ¥${netWorth(s).toLocaleString('zh-CN')}。\n健康 ${s.health} · 压力 ${s.stress} · 小产品 ${s.products} 个\n${failureReason(s)?.rule ?? end.subtitle}${s.failure ? `\n最后一步：${s.failure.source}` : ''}\n你能在 AI 时代，保住多少钱和多少自己？`;
}

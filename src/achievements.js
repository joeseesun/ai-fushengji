import { netWorth, priceHeat } from './engine.js';
import { MODELS } from './models.js';

// Achievements are judged from the state change a command made, so they cannot be farmed by reloading.
export const ACHIEVEMENTS = [
  { id: 'first-pot', title: '第一桶金', desc: '交易累计净赚 ¥1,000', test: (p, s) => s.tradeProfit >= 1000 },
  { id: 'peak-sell', title: '卖在山顶', desc: '在“暴涨”时卖出货品', test: (p, s, c) => c.type === 'sell' && priceHeat(p, c.id).id === 'hot' },
  { id: 'bottom-buy', title: '抄底大师', desc: '在“跳水”时买入货品', test: (p, s, c) => c.type === 'buy' && priceHeat(p, c.id).id === 'crash' },
  { id: 'viral', title: '十万加', desc: '写稿抽出 SSR 爆款', test: (p, s, c) => c.type === 'action' && s.lastAction?.outcome === 'viral' },
  { id: 'fubao', title: '福报', desc: '熬夜写稿写进了医院', test: (p, s, c) => c.type === 'action' && s.lastAction?.outcome === 'hospital' },
  { id: 'angel', title: '天使降临', desc: '饭局上遇到投资人', test: (p, s, c) => c.type === 'action' && s.lastAction?.outcome === 'investor' },
  { id: 'jackpot', title: '甲方是好人', desc: '接单暴击，甲方当场加钱', test: (p, s, c) => c.type === 'action' && c.id !== 'rush' && s.lastAction?.outcome === 'jackpot' },
  { id: 'debt-free', title: '无债一身轻', desc: '提前还清全部欠款', test: (p, s) => p.debt > 0 && s.debt === 0 && s.status === 'playing' },
  { id: 'whale-keeper', title: '鲸鱼饲养员', desc: '同时持有 10 只大肥鱼毛绒', test: (p, s) => s.inventory.whale?.qty >= 10 },
  { id: 'gpu-rich', title: 'GPU Rich', desc: '同时持有 10 张 H200 机时券', test: (p, s) => s.inventory.compute?.qty >= 10 },
  { id: 'carpool', title: '车队长', desc: '同时持有 5 个 Claude 拼车位', test: (p, s) => s.inventory.claude?.qty >= 5 },
  { id: 'unicorn', title: '一人独角兽', desc: '上线 3 个小产品', test: (p, s) => s.products >= 3 },
  { id: 'tourist', title: '北京一日游', desc: '八个地点都去过', test: (p, s) => Object.keys(s.intel ?? {}).length >= 8 },
  { id: 'big-spender', title: '只用最贵的', desc: '签下最贵的 AI 搭子', test: (p, s, c) => c.type === 'model' && c.id === MODELS[0].id },
  { id: 'quests', title: '靠谱打工人', desc: '完成 5 个每日委托', test: (p, s) => s.questsDone >= 5 },
  { id: 'net50k', title: '小有身家', desc: '净资产达到 ¥50,000', test: (p, s) => netWorth(s) >= 50000 },
  { id: 'net100k', title: '浮生六位数', desc: '净资产达到 ¥100,000', test: (p, s) => netWorth(s) >= 100000 },
  { id: 'zero', title: '余额 0.00', desc: '现金归零，还活着', test: (p, s) => s.cash === 0 && s.status === 'playing' },
  { id: 'burnout', title: '上下文已满', desc: '压力爆表，提前下线', test: (p, s) => s.ending?.id === 'burnout' },
  { id: 'company', title: '两脚着地', desc: '达成“一人公司”结局', test: (p, s) => s.ending?.id === 'company' },
  { id: 'human', title: '人类保留区', desc: '达成“人类保留区”结局', test: (p, s) => s.ending?.id === 'human' },
  { id: 'rich', title: '有钱，没空活', desc: '达成“有钱，没空活”结局', test: (p, s) => s.ending?.id === 'rich' },
  { id: 'build', title: '外挂玩家', desc: '一局装满 4 张外挂', test: (p, s) => s.perks?.length >= 4 },
  { id: 'tenant', title: '模范租客', desc: '三次房租日都按时交租', test: (p, s) => s.stats?.rentPaid >= 3 },
  { id: 'landlord-nightmare', title: '房东的噩梦', desc: '一局拖欠两次房租', test: (p, s) => s.stats?.rentLate >= 2 },
  { id: 'koi', title: '天选锦鲤', desc: '一局暴击 8 次', test: (p, s) => s.stats?.crits >= 8 },
  { id: 'survivor', title: '撑到最后一天', desc: '完成 40 天并结算', test: (p, s) => s.status === 'ended' && s.day === 40 },
];

const ACH_KEY = 'ai-fushengji-achievements', RUN_KEY = 'ai-fushengji-runs';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export const unlocked = () => { const v = read(ACH_KEY, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };
export function checkAchievements(prev, next, command) {
  const have = unlocked(), fresh = ACHIEVEMENTS.filter(a => !have[a.id] && (() => { try { return a.test(prev, next, command); } catch { return false; } })());
  if (fresh.length) { for (const a of fresh) have[a.id] = new Date().toISOString().slice(0, 10); write(ACH_KEY, have); }
  return fresh;
}

// Local leaderboard: the best runs on this device only. Nothing leaves the browser.
export const runs = () => { const v = read(RUN_KEY, []); return Array.isArray(v) ? v.filter(r => r && Number.isFinite(r.worth)) : []; };
export function recordRun(s, roleName) {
  const list = runs();
  if (list.some(r => r.seed === s.seed && r.day === s.day && r.worth === netWorth(s))) return list.findIndex(r => r.seed === s.seed) + 1;
  const entry = { seed: s.seed, worth: netWorth(s), day: s.day, ending: s.ending.title, role: roleName, date: new Date().toISOString().slice(0, 10) };
  const top = [...list, entry].sort((a, b) => b.worth - a.worth).slice(0, 10);
  write(RUN_KEY, top);
  const rank = top.indexOf(entry);
  return rank >= 0 ? rank + 1 : null;
}

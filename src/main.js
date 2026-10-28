import { createElement, Monitor, Terminal, PenTool, Coffee, Cpu, Presentation, BriefcaseBusiness, GraduationCap, GitFork, House, ScrollText, Workflow, Database, Box, Contact, BookOpen, PackagePlus, Wrench, Zap, HardDrive, ArrowRight, ArrowUpRight, ArrowDownRight, Wallet, Heart, Brain, ReceiptText, CircleHelp, RotateCcw, Download, Upload, X, ChevronRight, NotebookPen, Info, Copy, Check, ShieldCheck, ChartNoAxesCombined, Save, CircleDollarSign, Video, PenLine, Trophy, Building2, Sparkles, Volume2, VolumeX, Users, Map as MapIcon, Award, MapPin } from 'lucide';
import { GOODS, LOCATIONS, ROLES, EVENTS, MILESTONES, WRITE_OUTCOMES, ACTION_FLAVOR } from './content.js';
import { sfx, sfxEnabled, setSfx } from './sfx.js';
import { CAST, SOURCES, MEME_CATALOG, rheostat } from './memes.js';
import { MODELS, PROFILES, MODEL_DATE, getModel, featuredModel, modelTier, modelBlurb } from './models.js';
import { ACHIEVEMENTS, checkAchievements, unlocked, runs, recordRun } from './achievements.js';
import { newGame, transition, parseSave, SAVE_KEY, getEvent, getLocation, getNews, getRumor, getArrival, modelFee, combinedEffects, expandCost, sells, questProgress, priceHeat, referencePrice, usedSpace, salePrice, inventoryValue, netWorth, productIncome, dailyCost, dailyInterest, actionInfo, effectText, shareText } from './engine.js';
import { version as APP_VERSION } from '../package.json';
import './style.css';
import './memes.css';
import './screen.css';
import './v3.css';
import { layoutPages, pageFrame } from './pagination.js';

const icons = { Monitor, Terminal, PenTool, Coffee, Cpu, Presentation, BriefcaseBusiness, GraduationCap, GitFork, House, ScrollText, Workflow, Database, Box, Contact, BookOpen, PackagePlus, Wrench, Zap, HardDrive, ArrowRight, ArrowUpRight, ArrowDownRight, Wallet, Heart, Brain, ReceiptText, CircleHelp, RotateCcw, Download, Upload, X, ChevronRight, NotebookPen, Info, Copy, Check, ShieldCheck, ChartNoAxesCombined, Save, CircleDollarSign, Video, PenLine, Trophy, Building2, Sparkles, Volume2, VolumeX, Users, Map: MapIcon, Award, MapPin };
const icon = (name, cls = '') => createElement(icons[name] ?? Info, { width: 18, height: 18, 'stroke-width': 1.6, 'aria-hidden': 'true', class: `icon ${cls}` }).outerHTML;
const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compactEffects = effects => effectText(effects).replaceAll(' 元', '').replace('现金 ', '¥').split(' · ').map(t => `<span>${esc(t.replaceAll(' ', ''))}</span>`).join('');
const money = value => `¥${Math.round(value).toLocaleString('zh-CN')}`;
const app = document.querySelector('#app'), modal = document.querySelector('#modal');
let activePane = 'event', nextStation = 'jobs', pickedRole = 'coder';
let pendingAnim = null, lastRank = null;
let state = null, saved = null, toastTimer, restoreFocus = null, saveError = '', startupNotice = '', tradeContext = null;
try { const raw = localStorage.getItem(SAVE_KEY); saved = raw ? parseSave(raw) : null; if (raw && !saved) startupNotice = '旧存档无法读取，尚未覆盖。你可以导出原始存档备份，或开始新一局。'; } catch { startupNotice = '浏览器限制了本地存储。仍可游玩，请手动导出存档。'; }

function notify(text, error = false) {
  const el = document.querySelector('#toast'); el.textContent = text; el.className = `show${error ? ' error' : ''}`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = '', error ? 6500 : 4500);
}
function persist() {
  if (!state) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saved = state; saveError = ''; }
  catch { saveError = '自动存档失败。请用“存档”导出，关闭网页会丢失本次进度。'; }
}
function dispatch(command) {
  if (!state) return false;
  const result = transition(state, command);
  if (result.error) { notify(result.error, true); return false; }
  const focusKey = document.activeElement?.dataset?.focus, prev = state;
  state = result.state;
  const fresh = checkAchievements(prev, state, command);
  if (state.status === 'ended' && prev.status === 'playing') lastRank = recordRun(state, ROLES.find(r => r.id === state.role).name);
  if (command.type === 'travel') activePane = 'event';
  if (command.type === 'choose') activePane = 'actions';
  persist(); render();
  if (command.type === 'travel') { clearTimeout(toastTimer); document.querySelector('#toast').className = ''; if (state.status === 'playing') { pendingAnim = prev; briefing(); sfx.morning(); } }
  else if (command.type === 'action') { pendingAnim = prev; actionResult(prev, command.id); }
  else {
    notify(result.message);
    if (modal.open) pendingAnim = prev; else animateStats(prev);
    if (command.type === 'sell') { const gain = state.tradeProfit - prev.tradeProfit; gain > 0 ? sfx.register() : sfx.thud(); }
    else if (command.type === 'buy') sfx.tick();
    else if (command.type === 'repay') sfx.coins(prev.debt - state.debt);
    else if (command.type === 'choose') (state.cash > prev.cash ? sfx.coins(state.cash - prev.cash) : sfx.pop());
    else sfx.pop();
  }
  if (fresh.length) setTimeout(() => celebrate(fresh), command.type === 'action' ? 1500 : 200);
  if (command.type === 'travel' || command.type === 'action') {}
  else if (command.type === 'choose') document.querySelector('.action-tile.suggested')?.focus({ preventScroll: true });
  else if (command.type === 'action' && state.ap === 0) document.querySelector('.end-day-button')?.focus({ preventScroll: true });
  else if (focusKey) document.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
  return true;
}
function closeModal() {
  modal.close(); tradeContext = null;
  if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
  if (pendingAnim && state) { const prev = pendingAnim; pendingAnim = null; animateStats(prev); }
}
function celebrate(list) {
  list.forEach((a, i) => setTimeout(() => {
    const el = document.createElement('div'); el.className = 'ach-toast'; el.setAttribute('role', 'status');
    el.innerHTML = `${icon('Award')}<span><small>成就解锁</small><b>${esc(a.title)}</b><em>${esc(a.desc)}</em></span>`;
    document.body.append(el); sfx.sparkle(); setTimeout(() => el.remove(), 4200);
  }, i * 900));
}
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Numbers move where the player is looking: float the change, count up, and fly a few coins in.
function animateStats(prev) {
  if (!prev || !state || state.status !== 'playing') return;
  const good = { cash: 1, debt: -1, health: 1, stress: -1 };
  for (const key of Object.keys(good)) {
    const delta = state[key] - prev[key], box = document.querySelector(`.stat[data-stat="${key}"]`);
    if (!delta || !box) continue;
    const float = document.createElement('span');
    float.className = `float-num ${delta * good[key] > 0 ? 'up' : 'down'}`;
    float.textContent = `${delta > 0 ? '+' : '−'}${['cash', 'debt'].includes(key) ? money(Math.abs(delta)) : Math.abs(delta)}`;
    box.append(float); setTimeout(() => float.remove(), 1600);
    if (reducedMotion()) continue;
    const strong = box.querySelector('strong'), from = prev[key], to = state[key], start = performance.now();
    if (['cash', 'debt'].includes(key) && strong) {
      const step = now => { const t = Math.min(1, (now - start) / 650), v = from + (to - from) * (1 - (1 - t) ** 3); strong.textContent = money(v); if (t < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
    if (key === 'cash' && delta > 0) for (let i = 0; i < Math.min(8, 1 + Math.floor(delta / 250)); i++) {
      const c = document.createElement('i'); c.className = 'coin-fly';
      c.style.setProperty('--dx', `${Math.round((Math.random() - .5) * 120)}px`); c.style.setProperty('--d', `${i * 55}ms`);
      box.append(c); setTimeout(() => c.remove(), 1200 + i * 55);
    }
  }
}
const PROCESS = {
  work: ['正在和甲方对齐颗粒度…', '甲方：“能不能再大气一点？”', 'AI 正在生成第 3 版…', '把“马上好”说了第 4 遍…', '正在等甲方回复“收到”…'],
  rush: ['第三杯咖啡生效中…', '凌晨两点，键盘冒烟…', 'Stack Overflow 已关闭，改问 AI…', '注释写着“别问，能跑”…'],
  social: ['扫码加好友…', '交换名片（每张都写着 CEO）…', '听隔壁讲他的 AGI 计划…', '抢最后一块毛肚…'],
  write: ['正在想一个震惊体标题…', '配图抽卡中（第 17 次）…', '把“颠覆”改成“重塑”…', '检查有没有写 delve…', '等平台审核…'],
  learn: ['打开论文，先看图…', '关掉第 9 个“三分钟看懂”…', '跟着官方文档跑示例…', '在纸上画 Attention…'],
  rest: ['手机放进抽屉…', '关闭 37 个群的通知…', '盖好被子，抱紧鲸鱼…', '梦里没有新模型发布…'],
  build: ['画了三个按钮的原型…', '给产品起个不带 AI 的名字…', '部署到一台 5 美元的服务器…', '第一位用户正在路上…'],
  maintain: ['打开三年前的代码，深呼吸…', '删除“临时方案”…', '补测试，抓到两只 bug…'],
};
const GOOD_RANKS = new Set(['SSR', 'SR', '暴击', '顿悟', '满血', '灵感', '清爽']);
function actionResult(prev, id) {
  const last = state.lastAction, info = actionInfo({ ...prev, ap: 1, event: null }, id);
  const o = (last && last.id === id && info.outcomes?.find(x => x.id === last.outcome)) || { id: 'normal', rank: '', effects: {} };
  const total = o.effects ? combinedEffects(info.effects, o.effects) : info.effects;
  const text = o.id === 'normal' ? (ACTION_FLAVOR[id]?.[last?.flavor ?? 0] || info.after) : o.text;
  const launched = id === 'build' && state.products > prev.products;
  const art = o.art || (id === 'write' ? null : `act-${id}`);
  const steps = [...(PROCESS[id] ?? ['处理中…'])].sort(() => Math.random() - .5).slice(0, 3);
  const good = GOOD_RANKS.has(o.rank) || launched, bad = o.rank && !good;
  openModal(info.name, pageFrame(`${art ? sceneArt(art, '', 'act-art') : roleArt(state.role, 'gacha-sprite')}<div class="act-stage"><div class="act-run"><div class="act-progress"><i></i></div><p class="act-step">${esc(steps[0])}</p></div><div class="act-result">${o.rank ? `<div class="gacha-rank ${good ? 'rank-good' : 'rank-bad'}">${esc(o.rank)}</div>` : ''}${launched ? `<div class="gacha-rank rank-good">新品上线</div>` : ''}<p class="gacha-text">${esc(text)}${launched ? ` 第 ${state.products} 个小产品上线，明天开始每天收钱。` : ''}</p><span class="effect-chips">${compactEffects(total)}</span></div></div>`, '结果') + `<div class="modal-actions sticky-actions"><button class="primary cta" id="act-continue">跳过 ${icon('ArrowRight')}</button></div>`);
  modal.classList.add('fit', 'act-modal');
  const stage = modal.querySelector('.act-stage'), button = modal.querySelector('#act-continue'), line = modal.querySelector('.act-step');
  let shown = false; const timers = [];
  const reveal = () => {
    if (shown) return; shown = true; timers.forEach(clearTimeout);
    stage.classList.add('done'); layoutPages(modal);
    button.innerHTML = `${good ? '爽，继续' : bad ? '行吧，继续' : '继续'} ${icon('ArrowRight')}`;
    if (bad && !reducedMotion()) { modal.classList.remove('shake'); void modal.offsetWidth; modal.classList.add('shake'); }
    if (o.id === 'hospital') sfx.alarm();
    else if (bad) sfx.fail();
    else if (o.id === 'jackpot' || o.id === 'viral' || launched) sfx.jackpot();
    else if (good) { sfx.sparkle(); if (total.cash > 0) setTimeout(() => sfx.coins(total.cash), 250); }
    else if (total.cash > 0) sfx.coins(total.cash);
    else if (id === 'rest') sfx.calm();
    else if (id === 'learn') sfx.sparkle();
    else sfx.pop();
  };
  button.onclick = () => { if (shown) closeModal(); else reveal(); };
  if (reducedMotion()) { reveal(); return; }
  steps.slice(1).forEach((t, i) => timers.push(setTimeout(() => { line.textContent = t; sfx.tick(); }, 330 * (i + 1))));
  timers.push(setTimeout(reveal, 1050));
}
function openModal(title, html, wide = false, scroll = false) {
  if (modal.open) modal.close();
  restoreFocus = document.activeElement;
  modal.className = wide ? 'wide' : '';
  modal.innerHTML = `<div class="window-title"><span id="modal-title">${esc(title)}</span><button class="window-close" data-ui="close-modal" aria-label="关闭对话框">${icon('X')}</button></div><div class="modal-content ${scroll ? 'scroll' : ''}">${scroll || html.includes('class="page-frame') ? html : pageFrame(html, '内容')}</div>`;
  modal.showModal();
  layoutPages(modal);
  modal.querySelectorAll('img').forEach(img => img.addEventListener('load', () => layoutPages(modal), { once: true }));
}
modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
modal.addEventListener('click', e => { if (e.target === modal) { const r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });

const monitorArt = `<svg class="monitor-art" viewBox="0 0 260 200" role="img" aria-label="一台还在运转的旧电脑"><path fill="#123e3d" d="M30 177h196v8H30z"/><path fill="#9caa9e" stroke="#283c35" stroke-width="4" d="M31 21h190v127H31z"/><path fill="#e1e0ce" stroke="#35483d" stroke-width="3" d="M24 15h190v127H24z"/><path fill="#203a43" stroke="#7f8e7d" stroke-width="6" d="M39 30h158v92H39z"/><path fill="#f4da8b" d="M78 60h12v12H78zm64 0h12v12h-12zM91 86h51v6H91z"/><path fill="#b4bfaa" d="M105 143h32v19h-32z"/><path fill="#e1e0ce" stroke="#35483d" stroke-width="3" d="M84 160h73v10H84zM44 175h161l14 15H31z"/><path stroke="#9ca38e" stroke-width="3" d="M54 181h138M66 187h116"/><path fill="#244d40" d="M189 132h9v4h-9z"/><text x="116" y="49" text-anchor="middle" fill="#90b7a5" font-size="8" font-family="monospace">HUMAN.EXE</text></svg>`;

function chrome(body) {
  return `<div class="desktop ${state?.status === 'playing' ? 'is-playing' : 'is-intro'}"><aside class="desktop-icons" aria-label="桌面工具"><button data-ui="home-screen" aria-label="返回游戏">${icon('Monitor')}<span>我的人生</span></button><button data-ui="journal">${icon('NotebookPen')}<span>生存日记</span></button><button data-ui="help">${icon('CircleHelp')}<span>生存指南</span></button><div class="desktop-note">人类进程<br>尚未退出</div></aside><main class="game-window"><div class="window-title"><span>${icon('Monitor')} AI 浮生记.exe <span class="title-hint">— HUMAN IS STILL IN THE LOOP</span></span><button class="window-close" data-ui="help" aria-label="查看玩法">?</button></div><nav class="menu" aria-label="游戏菜单"><button data-ui="new">新开局<span>(N)</span></button><button data-ui="journal">账本<span>(B)</span></button><button data-ui="save">存档<span>(S)</span></button><button data-ui="gallery">梗图<span>(M)</span></button><button data-ui="models">模型<span>(AI)</span></button><button data-ui="achievements">成就<span>(A)</span></button><button data-ui="help">玩法<span>(H)</span></button><button data-ui="sfx" class="sfx-toggle" aria-pressed="${sfxEnabled()}" aria-label="音效">${icon(sfxEnabled() ? 'Volume2' : 'VolumeX')}<span>${sfxEnabled() ? '音效开' : '静音'}</span></button><button class="boss-button" data-ui="boss">老板来了 <kbd>F2</kbd></button></nav>${saveError ? `<div class="save-warning" role="alert">${esc(saveError)} <button data-ui="export">导出存档</button></div>` : ''}${body}<footer class="window-status"><span>${icon('ShieldCheck')} ${state ? (saveError ? '请手动导出存档' : '进度自动保存在本机') : '无需登录 · 无需充值'}</span><span class="community-actions"><button data-ui="support" aria-label="打赏支持" title="打赏支持">${icon('Coffee')}</button><button data-ui="follow" aria-label="关注作者" title="关注作者">${icon('Contact')}</button><a href="https://tuijian.qiaomu.ai/" target="_blank" rel="noopener">乔木推荐</a><span>v${APP_VERSION}</span></span></footer></main></div><footer class="taskbar"><button data-ui="home-screen">${icon('Monitor')} <b>开始</b></button><span class="task-active">AI 浮生记</span><span class="taskbar-end">Powered by <a href="https://qiaomu.ai/" target="_blank" rel="noopener">向阳乔木</a><span class="task-clock">${state ? `DAY ${String(state.day).padStart(2, '0')}` : '40 DAYS'}</span></span></footer>`;
}

const roleArt = (id, cls = '') => `<img class="role-sprite ${cls}" src="/art/roles/${id}.webp" alt="" width="200" height="300" decoding="async">`;
function welcome() {
  const r = ROLES.find(r => r.id === pickedRole) ?? ROLES[0];
  const tabs = ROLES.map(x => `<button class="role-tab" role="radio" aria-checked="${x.id === r.id}" data-ui="pick-role" data-id="${x.id}">${roleArt(x.id)}<span>${x.name}</span></button>`).join('');
  const stat = (label, value, cls = '') => `<span class="${cls}"><small>${label}</small><b>${value}</b></span>`;
  return `<div class="welcome v3"><section class="welcome-hero" aria-label="AI 浮生记"><div class="hero-copy"><span class="hero-kicker">像素生存 · 40 天 · 嘴很毒</span><h1>AI 浮生记</h1><p>模型在进化。<br>你还好吗？</p><div class="opening-numbers"><span><b>40</b>天还清</span><span><b>¥8k+</b>培训贷</span><span><b>∞</b>个“最后的机会”</span></div></div></section><section class="role-panel"><div class="panel-heading"><h2>选一个你</h2><span>没有天选之人，只有天选之债</span></div>${startupNotice ? `<div class="notice">${esc(startupNotice)}</div>` : ''}${saved ? `<button class="resume cta" data-ui="resume">${icon('Save')}<span><b>继续上次的人生</b><small>第 ${saved.day} 天 · ${saved.status === 'ended' ? '查看结局' : getLocation(saved).name} · 现金 ${money(saved.cash)}</small></span>${icon('ArrowRight')}</button>` : ''}<div class="role-tabs" role="radiogroup" aria-label="选择身份">${tabs}</div><article class="role-card" aria-live="polite">${roleArt(r.id, 'big')}<div class="role-info"><span class="role-title">${esc(r.title)}</span><h3>${esc(r.name)}</h3><p class="role-quote">“${esc(r.quote)}”</p><ul class="role-skills">${r.skills.map(([n, d]) => `<li>${icon('Sparkles')}<b>${esc(n)}</b><span>${esc(d)}</span></li>`).join('')}</ul><p class="role-weak">弱点：${esc(r.weakness)}</p><div class="role-stats">${stat('现金', money(r.cash))}${stat('欠款', money(r.debt), 'negative')}${stat('技能', r.skill)}${stat('口碑', r.reputation)}${stat('压力', r.stress)}</div></div></article><button class="primary start-button ${saved ? '' : 'cta'}" data-ui="start">以「${esc(r.name)}」开局 ${icon('ArrowRight')}</button><button class="text-button start-hint" data-ui="help">${icon('CircleHelp')} 第一次玩？看一分钟指南</button></section></div>`;
}
function stats() {
  return `<header class="dashboard-header"><div class="day-block"><strong>第 <b data-testid="day">${String(state.day).padStart(2, '0')}</b> 天 <small>/ 40</small></strong><span>${getLocation(state).name}</span></div><div class="stats"><div class="stat" data-stat="cash"><span>现金<strong data-testid="cash">${money(state.cash)}</strong></span></div><div class="stat debt" data-stat="debt"><span>欠款<strong data-testid="debt">${money(state.debt)}</strong></span><button class="stat-action" data-ui="finance" aria-label="还款与借款">还款</button></div><div class="stat ${state.health < 30 ? 'danger' : ''}" data-stat="health"><span>健康<strong>${state.health}<em>/100</em></strong><span class="meter"><i style="width:${state.health}%"></i></span></span></div><div class="stat ${state.stress >= 70 ? 'danger' : ''}" data-stat="stress"><span>压力<strong>${state.stress}<em>/100</em></strong><span class="meter stress"><i style="width:${state.stress}%"></i></span></span></div></div></header>`;
}

function marketPanel() {
  const locked = !!state.event;
  const rows = GOODS.filter(g => sells(state, g.id)).map(g => {
    const delta = state.previousPrices[g.id] ? Math.round((state.prices[g.id] / state.previousPrices[g.id] - 1) * 100) : 0;
    const item = state.inventory[g.id], canBuy = state.cash >= state.prices[g.id] && usedSpace(state) < state.capacity;
    const heat = priceHeat(state, g.id), avg = item.qty ? Math.round(item.cost / item.qty) : 0, gain = salePrice(state, g.id) >= avg;
    return `<div class="quote-row heat-${heat.id}" role="row"><div role="cell"><button class="goods-info" data-ui="good-info" data-id="${g.id}"><img class="good-icon" src="/art/goods/${g.id}.webp" alt="" width="24" height="24">${g.name}</button><small><span class="heat-tag" title="平常约 ${money(referencePrice(state, g.id))}">${heat.label}</span> <span class="delta ${delta >= 0 ? 'positive' : 'negative'}">${state.day === 1 ? '首日' : `${delta >= 0 ? '+' : ''}${delta}%`}</span></small></div><div class="quote-prices" role="cell"><b>${money(state.prices[g.id])}</b><small>${money(salePrice(state, g.id))}</small></div><div class="quote-holding" role="cell">${item.qty ? `<b>${item.qty}<small>均¥${avg}</small></b><small class="pl ${gain ? 'positive' : 'negative'}" title="现在全部卖出：到账 ${money(salePrice(state, g.id) * item.qty)}，成本 ${money(item.cost)}">卖出${gain ? '赚' : '亏'}${money(Math.abs(salePrice(state, g.id) * item.qty - item.cost))}</small>` : '<b>0</b><small>空仓</small>'}</div><div class="trade-buttons" role="cell"><button data-ui="buy" data-id="${g.id}" data-focus="buy-${g.id}" aria-label="买入${g.name}" ${locked || !canBuy ? 'disabled' : ''}>买</button><button data-ui="sell" data-id="${g.id}" data-focus="sell-${g.id}" aria-label="卖出${g.name}" ${locked || !item.qty ? 'disabled' : ''}>卖</button></div></div>`;
  }).join('');
  return `<section class="panel market-panel screen-pane" data-pane="market"><div class="panel-heading"><h2>${icon('ChartNoAxesCombined')} 交易所</h2><span class="market-capacity">仓位 ${usedSpace(state)}/${state.capacity}<button class="text-button expand-button" data-ui="expand" ${state.event || state.capacity >= 58 ? 'disabled' : ''}>${icon('HardDrive')} 扩仓</button></span></div><div class="quotes" role="table" aria-label="今日货品行情"><div class="quote-row quote-labels" role="row"><span role="columnheader">货品 / 涨跌</span><span role="columnheader">买价 / 卖价</span><span role="columnheader">持有 / 盈亏</span><span role="columnheader">买卖</span></div>${pageFrame(rows, '货品', 'market-pages')}</div><p class="panel-note">${(() => { const away = GOODS.filter(g => !sells(state, g.id) && state.inventory[g.id].qty); return away.length ? `仓里还有 ${away.map(g => `${g.short}×${state.inventory[g.id].qty}`).join('、')}：本站今天不收，换地方卖` : locked ? '先处理事件，交易不耗行动。' : `本站今天只收这 ${state.available.length} 样货 · 跳水时买，换站等暴涨再卖`; })()}</p></section>`;
}

function eventPanel() {
  const e = getEvent(state), previous = MEME_CATALOG.find(m => m.id === state.lastEvent);
  const content = e ? `${e.meme ? memeArt(e) : sceneArt(`loc-${state.location}`, getLocation(state).full)}<div class="event-intro"><span class="event-tag">${esc(e.tag)}</span><h3 id="event-heading" tabindex="-1">${esc(e.title)}</h3></div>${e.text.match(/[^。！？]+[。！？]?/g)?.map(t => `<p class="event-story">${esc(t)}</p>`).join('') ?? ''}${e.shock ? `<div class="market-shock">行情已变：${Object.entries(e.shock).map(([id, v]) => `${GOODS.find(g => g.id === id).short} ×${v}`).join(' · ')}<small>已计入交易所当前报价。</small></div>` : ''}${e.interaction === 'rheostat' ? `<div class="rheostat"><label for="stance">今日称谓：<b id="stance-name">${rheostat(state.stance).name}</b></label><input id="stance" type="range" min="0" max="100" value="${state.stance}" aria-describedby="stance-effect"><div class="rheostat-labels"><span>梁子</span><span>梁老师</span><span>梁圣 / 义父</span></div><small id="stance-effect">${effectText(rheostat(state.stance).effects)}</small></div>` : ''}${e.options.map((o, i) => `<button class="event-choice ${e.options.length === 1 ? 'cta' : ''}" data-ui="choose" data-index="${i}" ${state.cash + (o.effects.cash ?? 0) < 0 ? 'disabled' : ''}><span>${esc(o.label)}${icon('ArrowUpRight')}</span><small ${o.stance ? 'data-stance-effect' : ''}>${effectText(o.stance ? rheostat(state.stance).effects : o.effects)}${state.cash + (o.effects.cash ?? 0) < 0 ? ' · 现金不足' : ''}</small>${o.outcomes ? `<small class="risk-outcomes">${o.outcomes.map(r => `${r.weight}%：${effectText(r.effects)}`).join('；')}</small>` : ''}${o.followUp ? '<small class="sequel-hint">以后还会有下文…</small>' : ''}</button>`).join('')}` : `<div class="event-intro">${previous ? memeArt(previous) : ''}<span class="event-tag">${icon('Check')} 这关过了</span><h3 id="event-heading" tabindex="-1">${state.ap ? '接下来，安排今天。' : '今天的行动完成了。'}</h3></div><p class="event-story">${esc(state.journal.find(j => j.kind === 'event')?.text || '把时间花在值得的事情上。')}</p><div class="next-card"><b>${state.ap ? `还可以行动 ${state.ap} 次` : '可以结束今天了'}</b><p>${state.ap ? '接单拿钱；累了就休息。想发展长期收入，可以学习、研发。' : state.day === 40 ? '准备好了，点底部“结算这 40 天”。最后一次整理持仓和欠款。' : '买卖和还款不耗行动，想做就做。准备好了，点底部“结束今天”。'}</p><button data-ui="show-pane" data-pane="actions">${state.ap ? '去安排行动' : '查看今日行动'} ${icon('ArrowRight')}</button></div>`;
  return `<section class="panel event-panel screen-pane ${e ? 'pending' : ''}" data-pane="event" aria-labelledby="event-heading"><div class="panel-heading"><h2>${icon('NotebookPen')} ${e ? '① 先处理这件事' : '今日遭遇'}</h2><span>${e ? '选一项 · 不耗行动' : '已处理'}</span></div>${pageFrame(content, '事件', 'event-pages')}<div class="event-footer">人物情节为虚构恶搞${e?.meme ? `<button class="inline-link" data-ui="meme-detail" data-id="${e.id}">梗的出处 ↗</button>` : ''}</div></section>`;
}

function sceneArt(name, caption = '', cls = '') {
  return `<figure class="scene-art ${cls}"><img src="/art/scenes/${name}.webp" alt="" width="800" height="450" decoding="async">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
}
function briefing() {
  const l = getLocation(state), news = getNews(state), rumor = getRumor(state), arrival = getArrival(state);
  openModal(`第 ${state.day} 天 · AI 浮生早报`, pageFrame(`${sceneArt(`loc-${l.id}`, '', 'brief-hero')}<div class="brief-place"><small>你到了</small><b>${esc(l.full)}</b><span>${esc(l.line)}</span></div>${arrival ? `<div class="brief-arrival"><b>到站小事</b><p>${esc(arrival.text)}</p><em>${esc(arrival.note)}</em><span class="effect-chips">${compactEffects(arrival.effects)}</span></div>` : ''}${rumor ? `<div class="brief-news breaking">${sceneArt(rumor.art)}<div><small>本站突发 · 只在今天</small><b>${esc(rumor.title)}</b><span>${esc(GOODS.find(g => g.id === rumor.good).short)} 报价 ×${rumor.factor}</span></div></div>` : ''}<div class="brief-news">${sceneArt(news.art)}<div><small>今日头条</small><b>${esc(news.title)}</b><span>${esc(news.detail)}</span></div></div>`, '早报') + `<div class="modal-actions sticky-actions"><button class="primary cta" data-ui="close-modal">开始今天 ${icon('ArrowRight')}</button></div>`, true);
  modal.classList.add('briefing', 'fit');
}
// Pin positions on the map art, in percent.
const MAP_PINS = { market: [20, 16], launch: [75, 17], jobs: [16, 40], course: [79, 40], opensource: [18, 62], stream: [46, 66], hackathon: [80, 63], home: [55, 87] };
function openMap() {
  if (!state || state.event) return;
  openModal('北京地图 · 明天去哪', `<p class="map-intro">每晚选一个地方过夜，第二天在那里醒来。不同地方：<b>收的货不同、价格不同</b>（低买高卖靠这个）；各有<b>专属加成</b>；到站还有不同的小事。去过的地方会记下当天的行情。</p><div class="map-wrap"><img src="/art/scenes/map.webp" alt="" width="1200" height="800">${LOCATIONS.map(l => `<button class="map-pin ${l.id === nextStation ? 'picked' : ''} ${l.id === state.location ? 'here' : ''}" style="left:${MAP_PINS[l.id][0]}%;top:${MAP_PINS[l.id][1]}%" data-ui="map-pick" data-id="${l.id}" aria-label="${esc(l.name)}">${icon(l.icon)}<span>${esc(l.name)}</span></button>`).join('')}</div><div class="map-detail" aria-live="polite"></div>`, true, true);
  modal.classList.add('map-modal');
  drawMapDetail();
}
function drawMapDetail() {
  const box = modal.querySelector('.map-detail'); if (!box) return;
  modal.querySelectorAll('.map-pin').forEach(p => p.classList.toggle('picked', p.dataset.id === nextStation));
  const l = LOCATIONS.find(l => l.id === nextStation), intel = state.intel?.[l.id];
  const names = ids => ids.map(id => GOODS.find(g => g.id === id).short).join('、') || '无';
  const tops = Object.entries(l.factors).sort((a, b) => a[1] - b[1]);
  box.innerHTML = `<div class="map-card">${sceneArt(`loc-${l.id}`, '', 'map-thumb')}<div><b>${esc(l.full)}${l.id === state.location ? ' · 你在这里' : ''}</b><p>${esc(l.line)}</p><p class="map-perk">${icon('Sparkles')} ${esc(l.specialty)}</p><p class="map-trend">常年便宜：${names(tops.filter(t => t[1] < 1).slice(0, 3).map(t => t[0]))} · 常年贵：${names(tops.filter(t => t[1] > 1).slice(-3).map(t => t[0]))}</p><p class="map-intel">${intel ? `第 ${intel.day} 天来过：当时便宜 ${names(intel.cheap)}；贵 ${names(intel.dear)}` : '还没来过，行情未知。'}</p></div></div><div class="modal-actions"><button data-ui="close-modal">再想想</button><button class="primary cta" data-ui="map-go" data-id="${l.id}">${icon('MapPin')} 明天就去${esc(l.name)}</button></div>`;
}
function openAchievements() {
  const have = unlocked(), list = runs();
  openModal(`成就与排行 · 已解锁 ${ACHIEVEMENTS.filter(a => have[a.id]).length}/${ACHIEVEMENTS.length}`, `<div class="ach-grid">${ACHIEVEMENTS.map(a => `<div class="ach ${have[a.id] ? 'got' : ''}">${icon('Award')}<span><b>${have[a.id] ? esc(a.title) : '？？？'}</b><small>${esc(a.desc)}</small></span></div>`).join('')}</div><h3 class="rank-title">本机排行榜 · 最好的 10 局</h3>${list.length ? `<ol class="rank-list">${list.map(r => `<li><b>${money(r.worth)}</b><span>${esc(r.role)} · ${esc(r.ending)} · 第 ${r.day} 天</span><small>${esc(r.date)}</small></li>`).join('')}</ol>` : '<p class="muted">还没有结算过的一局。打完 40 天（或提前下线）就会上榜。</p>'}<p class="muted">成就和排行只存在这台设备的浏览器里，不上传。</p>`, true, true);
  modal.classList.add('models');
}
function portrait(art, cls = '') {
  const c = CAST[art] ?? CAST.worker;
  return `<span class="cast-portrait ${cls}" role="img" aria-label="${c.name}的原创像素插画" style="background-position:${c.x}% ${c.y}%"></span>`;
}
function memeArt(e) {
  return `<figure class="meme-art">${portrait(e.meme.art)}<figcaption>${esc(e.meme.caption).replaceAll('\n', '<br>')}<small>AI 浮生记 / 网络梗虚构演出</small></figcaption></figure>`;
}
function gallery() {
  const seen = (state ?? saved)?.seen ?? [];
  const unlocked = MEME_CATALOG.filter(m => seen.includes(m.id));
  openModal('梗图回收站 · 互联网不会替你还贷', `<div class="gallery-intro"><b>已收集 ${unlocked.length} / ${MEME_CATALOG.length}</b><p>碰见事件就能收集。各局的随机遭遇不同，有些梗要做出选择才有后续。</p></div>${pageFrame(MEME_CATALOG.map(e => seen.includes(e.id) ? `<button class="meme-tile" data-ui="meme-detail" data-id="${e.id}">${memeArt(e)}<strong>${esc(e.title.replace('{model}', '新模型'))}</strong></button>` : `<div class="meme-tile locked"><span>?</span><strong>尚未遭遇</strong><small>${e.tag}</small></div>`).join(''), '梗图')}<p class="muted">全部插画为本作生成的原创像素插画；网络来源用于说明梗的传播，不代表首发认定。领袖对白与事件为虚构。</p>`, true);
}
function memeDetail(id) {
  const e = MEME_CATALOG.find(m => m.id === id);
  if (!e || !(state ?? saved)?.seen?.includes(id)) return;
  const source = SOURCES[e.meme.source];
  openModal(e.title.replace('{model}', '新模型'), `${memeArt(e)}<p>${esc(e.text.replaceAll('{model}', '新模型'))}</p><p class="muted">网络梗改编，人物情节为虚构；游戏插画为原创生成，未搬运第三方表情包。</p>${source?.url ? `<a class="source-link" href="${esc(source.url)}" target="_blank" rel="noopener">查看传播样例：${esc(source.name)} ${icon('ArrowUpRight')}</a>` : '<p class="muted">本作根据 AI 打工生活创作的原创段子。</p>'}<div class="modal-actions"><button data-ui="gallery">回到梗图图鉴</button><button data-ui="close-modal">继续过日子</button></div>`);
}
function modelSquare() {
  openModal('模型广场 · 你选模型，账单选你', `<p class="model-intro">${MODELS.length} 个模型条目 · 国内外 ${new Set(MODELS.map(m => m.family)).size} 个家族 · 名称核对 ${MODEL_DATE}。租约使用游戏币，最多 5 天；无需真实 API，不会自动续费。下面加成为游戏设定。</p><div class="model-filters"><input id="model-search" type="search" placeholder="搜索模型 / 家族，例如 Kimi、豆包" aria-label="搜索模型"><select id="model-region" aria-label="模型地区"><option value="全部">全部模型</option><option>国内</option><option>海外</option></select></div>${state?.event ? '<p class="model-status">先处理今天的事件，再来签约。</p>' : state && getModel(state) ? `<p class="model-status">当前搭子 ${esc(getModel(state).name)}，合约至第 ${state.modelUntil} 天。到期后可以换模型，不会自动续费。</p>` : !state || state.status !== 'playing' ? '<p class="model-status">开局后可用游戏币签约，当前仅供浏览。</p>' : ''}<div class="model-scroll" tabindex="0" aria-label="模型列表，可上下滑动"></div>`, true, true);
  modal.classList.add('models');
  const draw = () => {
    const q = document.querySelector('#model-search').value.toLowerCase(), region = document.querySelector('#model-region').value;
    const found = MODELS.filter(m => `${m.name} ${m.family}`.toLowerCase().includes(q) && (region === '全部' || region === m.region));
    document.querySelector('.model-scroll').innerHTML = found.length ? found.map(m => {
      const fee = state ? modelFee(state, m) : m.fee, active = state && getModel(state), disabled = !state || state.status !== 'playing' || state.event || active || state.cash < fee;
      const value = Math.min(5, Math.max(1, Math.round(m.work / m.fee * 2.2)));
      return `<article class="model-card"><div class="model-card-top">${portrait(m.art, 'mini')}<span><small>${m.region} · ${m.family} · ${PROFILES[m.profile].label}</small><h3>${esc(m.name)}</h3></span><em class="tier tier-${modelTier(m)}">${modelTier(m)}</em></div><p>${m.joke}</p><div class="model-perks">${modelBlurb(m)}<span class="value">性价比 ${'★'.repeat(value)}${'☆'.repeat(5 - value)}</span></div><div class="model-card-bottom"><a href="${esc(m.source)}" target="_blank" rel="noopener">来源 ↗</a><button data-ui="hire-model" data-id="${esc(m.id)}" ${disabled ? 'disabled' : ''}>${active?.id === m.id ? '已签约' : `${money(fee)} / ${state ? Math.min(5, 41 - state.day) : 5} 天`}</button></div></article>`;
    }).join('') : '<p class="empty-models">没有找到这个名字。可以试试模型家族名。</p>';
  };
  document.querySelector('#model-search').oninput = draw; document.querySelector('#model-region').onchange = draw; draw();
}

function actionPanel() {
  // Day one teaches with a glowing pick; afterwards only a warning when the body needs rest.
  const tutorial = state.day === 1, tired = state.health < 45 || state.stress > 65;
  const suggested = tutorial ? (state.role === 'creator' ? 'write' : 'work') : tired ? 'rest' : null;
  const actions = ['work', 'write', 'rush', 'learn', 'rest', 'social', 'build', 'maintain'];
  const rows = [0, 2, 4, 6].map(start => `<div class="action-row">${actions.slice(start, start + 2).map(id => {
    const a = actionInfo(state, id);
    return `<button class="action-tile ${id === suggested && !state.event && state.ap ? `suggested ${tutorial ? 'cta' : 'warn'}` : ''}" data-ui="action" data-id="${id}" data-focus="action-${id}" ${state.event || a.reason ? 'disabled' : ''}><span class="action-name">${icon(a.icon)}<strong>${a.name}</strong>${id === suggested && state.ap && !state.event ? `<em>${tutorial ? '新手试试' : '该歇了'}</em>` : ''}</span><small class="action-effects">${a.reason || (id === 'write' ? `<span>抽卡¥0–${Math.max(...a.outcomes.map(o => o.effects.cash ?? 0))}</span><span>爆款${a.outcomes[0].weight}%</span><span>住院${a.outcomes.at(-1).weight}%</span>` : `${compactEffects(a.effects)}${a.outcomes ? `<span class="odds">${a.outcomes.slice(1).map(r => `${r.rank}${r.weight}%`).join(' ')}</span>` : ''}`)}</small></button>`;
  }).join('')}</div>`).join('');
  const current = getModel(state);
  return `<section class="panel actions-panel screen-pane" data-pane="actions"><div class="panel-heading"><h2>${icon('Coffee')} ② 安排今天</h2><span class="action-pips">剩余 ${state.ap} / 2 次</span></div>${pageFrame(`<p class="action-instruction">${state.event ? '先选一个事件回应，再安排行动。' : state.ap ? `${tutorial ? '第一次？先点亮着的那个试试。' : tired ? '身体在报警，建议先「关机休息」。' : '今天想怎么过？赚钱、变强、回血，自己挑。'}每件事耗 1 次。` : '今天干完了。点右下角亮着的「结束今天」。'}</p>${rows}<div class="compact-tools"><button class="compact-company" data-ui="company">档案 · 技能 ${state.skill} · 产品 ${state.products}</button><button class="compact-model" data-ui="models" title="${esc(current?.name ?? '查看模型广场')}">${icon('Cpu')}<span>${current ? '已签模型 · 查看' : '选 AI 搭子'}</span>${icon('ChevronRight')}</button></div>`, '行动', 'action-pages')}</section>`;
}

function companyPanel() {
  return `<section class="panel company-panel"><div class="panel-heading"><h2>${icon('Box')} 你的底气</h2><span>${ROLES.find(r => r.id === state.role).name}</span></div><div class="skill-row"><span>技能 <b>${state.skill}</b></span><span>口碑 <b>${state.reputation}</b></span><span>技术债 <b class="${state.techDebt >= 50 ? 'negative' : ''}">${state.techDebt}</b></span></div><div class="product-line"><span>${icon('PackagePlus')} 已上线 <b>${state.products}</b> 个小产品</span><b class="positive">+${money(productIncome(state))}<small> / 今天</small></b></div><div class="product-progress">${[0, 1, 2].map(n => `<span class="${n < state.progress ? 'done' : ''}"></span>`).join('')}<small>下个产品 ${state.progress}/3</small></div><p class="company-note">技术债会吃掉产品收益。每份收入背后，都得有个活人维护。</p><div class="company-bottom"><span>仓库存货估值 <b>${money(inventoryValue(state))}</b></span><button data-ui="expand" ${state.event || state.capacity >= 58 ? 'disabled' : ''}>${icon('HardDrive')} 扩仓</button></div></section>`;
}

function travelPanel() {
  const l = LOCATIONS.find(l => l.id === nextStation) ?? LOCATIONS[2];
  return `<footer class="day-end"><div class="destination"><span class="destination-label">③ ${state.day === 40 ? '最后一天' : '明天去哪'}</span>${state.day === 40 ? '<strong>准备人生结算</strong>' : `<button class="map-button" data-ui="map" aria-label="打开地图选择明天去哪，当前：${esc(l.name)}">${icon('Map')}<span><b>${esc(l.name)}${state.location === l.id ? '（原地）' : ''}</b><small>点开地图换地方</small></span></button>`}</div><div class="day-end-note"><b>${state.event ? '先回应事件 →' : state.ap ? `还可行动 ${state.ap} 次，也可提前收工` : state.day === 40 ? '已到终点，准备结算' : '今日行动完成，准备出发'}</b><span>${state.day === 40 ? '清仓 → 扣费 → 自动还债' : esc(l.specialty)}</span></div><button class="primary end-day-button ${!state.event && !state.ap ? 'cta' : ''}" data-ui="${state.day === 40 ? 'finish' : 'end-day'}" ${state.event ? 'disabled' : ''}>${state.day === 40 ? '结算这 40 天' : '结束今天'} ${icon('ArrowRight')}</button><div class="day-bill"><span>今晚：生活 −${money(dailyCost(state))} · 利息 +${money(dailyInterest(state))} 债务${state.products ? ` · 产品 +${money(productIncome(state))}` : ''}</span><button class="inline-link" data-ui="bill">账单详情</button></div></footer>`;
}

function game() {
  const step = state.event ? 1 : state.ap ? 2 : 3;
  const news = getNews(state), rumor = getRumor(state);
  return `<div class="game-content" data-active-pane="${activePane}" data-step="${step}">${stats()}<div class="flow-guide"><div><b>目标：40 天内还清欠款，活着收工</b><span id="next-step" role="status">${step === 1 ? '现在：今天的瓜来了，挑一个回应。' : step === 2 ? `现在：还能干 ${state.ap} 件事${state.day === 1 ? '，先试试亮着的那个' : '，自己挑'}。` : state.day === 40 ? '现在：点亮的「结算这 40 天」。' : '现在：挑好下一站，点亮的「结束今天」。'}<small>${step === 1 ? ' 回应完才能干别的。' : ' 低买高卖、还款不耗行动。'}</small></span>${(() => { const q = questProgress(state); return q ? `<span class="quest-chip ${q.done ? 'done' : ''}" title="今天收工时检查，完成就发奖励">${q.done ? '✓' : '委托'} ${esc(q.title)}${q.track === 'calm' ? `（现在 ${q.value}）` : q.done ? '' : `（${q.track === 'cash' || q.track === 'tradeProfit' || q.track === 'repaid' ? money(Math.max(0, q.value)) : Math.max(0, q.value)}/${q.track === 'cash' || q.track === 'tradeProfit' || q.track === 'repaid' ? money(q.need) : q.need}）`} · 奖 ${esc(effectText(q.reward))}</span>` : ''; })()}</div><ol class="day-steps" aria-label="每日流程"><li ${step === 1 ? 'aria-current="step"' : ''}>${step > 1 ? '✓' : '1'} 事件</li><li ${step === 2 ? 'aria-current="step"' : ''}>${step > 2 ? '✓' : '2'} 行动</li><li ${step === 3 ? 'aria-current="step"' : ''}>3 ${state.day === 40 ? '结算' : '过夜'}</li></ol></div><button class="news-ticker ${rumor ? 'breaking' : ''}" data-ui="news">${icon('ReceiptText')}<span>${rumor ? `<b>本站突发</b> ${esc(rumor.title)}` : `<b>快讯</b> ${esc(news.title)}`}</span>${icon('ChevronRight')}</button><nav class="pane-tabs" aria-label="游戏面板">${[['event', state.event ? '① 待办事件' : '✓ 今日遭遇'], ['actions', `② 行动 ${state.ap}/2`], ['market', '交易所']].map(([id, label]) => `<button data-ui="show-pane" data-pane="${id}" aria-pressed="${activePane === id}" class="${activePane !== id && ((step === 1 && id === 'event') || (step === 2 && id === 'actions')) ? 'cta' : ''}">${label}</button>`).join('')}</nav><div class="play-grid">${eventPanel()}${actionPanel()}${marketPanel()}</div>${travelPanel()}</div>`;
}

function ending() {
  const e = state.ending;
  return `<div class="ending-screen"><div class="ending-receipt">${pageFrame(`<div class="receipt-top"><span>AI 浮生记 · 人生结算单</span><span>NO. ${String(state.seed).slice(-6)}</span></div>${lastRank ? `<div class="ending-rank">本机排行第 ${lastRank} 名</div>` : ''}<div class="ending-role">${roleArt(state.role)}<span><b>${esc(ROLES.find(r => r.id === state.role).name)}</b><small>${esc(ROLES.find(r => r.id === state.role).title)}</small></span></div><span class="ending-kicker">${state.day === 40 ? '40 天已过，世界还在更新' : `在第 ${state.day} 天，按下了暂停`}</span><h1>${e.title}</h1><p class="ending-subtitle">${e.subtitle}</p><div class="receipt-total"><span>最终净资产</span><strong>${money(netWorth(state))}</strong></div><dl class="receipt-stats"><div><dt>手头现金</dt><dd>${money(state.cash)}</dd></div><div><dt>剩余债务</dt><dd>${money(state.debt)}</dd></div><div><dt>身体电量 / 精神压力</dt><dd>${state.health} / ${state.stress}</dd></div><div><dt>小产品 / 接单数</dt><dd>${state.products} / ${state.jobsDone}</dd></div><div><dt>累计利息</dt><dd>${money(state.totalInterest)}</dd></div><div><dt>认真休息过</dt><dd>${state.daysRested} 次</dd></div></dl><p class="ending-text">${e.text}</p><div class="receipt-stamp">${state.debt === 0 && state.health > 0 ? '本人仍在' : '下次再来'}<small>HUMAN VERIFIED</small></div><div class="receipt-bottom">模型还会升级。你先好好吃顿饭。</div>`, '结局')}</div><div class="ending-actions"><button class="primary" data-ui="copy-result">${icon('Copy')} 复制我的结局</button><button data-ui="result-image">${icon('Download')} 保存结局卡</button><button data-ui="new">${icon('RotateCcw')} 换种活法</button><button data-ui="journal">${icon('NotebookPen')} 回看这一路</button></div></div>`;
}

function render() { app.innerHTML = chrome(!state ? welcome() : state.status === 'ended' ? ending() : game()); layoutPages(app); }

function startGame() {
  const role = pickedRole;
  const start = () => { state = newGame(role); activePane = 'event'; startupNotice = ''; persist(); closeModal(); render(); window.scrollTo(0, 0); };
  if (saved || startupNotice) {
    openModal('开始新的人生', '<p>新开局会替换本机存档。旧的一局可以先导出保存。</p><div class="modal-actions"><button data-ui="export">导出旧存档</button><button class="primary" id="confirm-start">替换存档，开始</button></div>');
    document.querySelector('#confirm-start').onclick = start;
  } else start();
}

function trade(id, type) {
  const g = GOODS.find(g => g.id === id); if (!g || !state) return;
  const maximum = type === 'buy' ? Math.min(state.capacity - usedSpace(state), Math.floor(state.cash / state.prices[id])) : state.inventory[id].qty;
  if (maximum < 1) return;
  tradeContext = { id, type, maximum };
  openModal(`${type === 'buy' ? '买入' : '卖出'} · ${g.name}`, `<p class="trade-description">${g.desc}</p><div class="quote"><span>每${g.unit}${type === 'buy' ? '买入' : '回收'}价</span><b>${money(type === 'buy' ? state.prices[id] : salePrice(state, id))}</b></div><label class="input-label" for="quantity">交易数量（最多 ${maximum} ${g.unit}）</label><div class="quantity-row"><button data-qty="-1" aria-label="减少数量">−</button><input id="quantity" type="number" min="1" max="${maximum}" step="1" value="1" inputmode="numeric"><button data-qty="1" aria-label="增加数量">+</button><button id="quantity-max">全部</button></div><input class="quantity-range" aria-label="调整数量" type="range" min="1" max="${maximum}" value="1"><div id="trade-total" class="trade-total"></div><div class="modal-actions"><button data-ui="close-modal">取消</button><button class="primary" id="trade-submit">确认${type === 'buy' ? '买入' : '卖出'}</button></div><p class="muted">买卖不消耗行动。同日反复买卖会损失价差。</p>`);
  tradeContext = { id, type, maximum };
  const input = document.querySelector('#quantity'), range = document.querySelector('.quantity-range');
  const update = () => {
    const qty = Number(input.value), valid = Number.isInteger(qty) && qty >= 1 && qty <= maximum;
    if (valid) range.value = qty;
    document.querySelector('#trade-submit').disabled = !valid;
    document.querySelector('#trade-total').textContent = valid ? `${type === 'buy' ? '合计支出' : '合计到账'} ${money(qty * (type === 'buy' ? state.prices[id] : salePrice(state, id)))}` : '请输入有效的整数数量';
  };
  input.oninput = update; range.oninput = () => { input.value = range.value; update(); };
  modal.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => { input.value = Math.max(1, Math.min(maximum, Number(input.value || 1) + Number(b.dataset.qty))); update(); });
  document.querySelector('#quantity-max').onclick = () => { input.value = maximum; update(); };
  document.querySelector('#trade-submit').onclick = () => { if (dispatch({ type, id, qty: Number(input.value) })) closeModal(); };
  update();
}

function finance() {
  if (!state) return;
  const max = Math.min(state.cash, state.debt);
  openModal('培训贷 · 把账还给过去', `<div class="finance-numbers"><span>欠款 <b>${money(state.debt)}</b></span><span>现金 <b>${money(state.cash)}</b></span></div><p>日息 1.8%，今天将新增 ${money(dailyInterest(state))} 欠款。还款不消耗行动，记得留生活费。</p><label class="input-label" for="repayment">还款金额</label><input id="repayment" type="number" min="1" max="${max}" step="1" value="${Math.min(1000, max)}" inputmode="numeric"><div class="modal-actions"><button id="repay-max" ${!max || state.event || state.status === 'ended' ? 'disabled' : ''}>尽可能还清</button><button class="primary" id="repay" ${!max || state.event || state.status === 'ended' ? 'disabled' : ''}>确认还款</button></div><hr><h3>应急周转</h3><p class="muted">借 ¥1,500，每 5 天限一次，全局最多 ¥6,000；也按日息 1.8% 计入债务。${state.event ? '先回应当前事件。' : ''}</p><button id="borrow" ${state.event || state.status === 'ended' || state.day - state.lastBorrowDay < 5 || state.borrowed >= 6000 || state.debt + 1500 > 20000 ? 'disabled' : ''}>查看借款确认</button>`);
  document.querySelector('#repay').onclick = () => { if (dispatch({ type: 'repay', amount: Number(document.querySelector('#repayment').value) })) closeModal(); };
  document.querySelector('#repay-max').onclick = () => { document.querySelector('#repayment').value = max; };
  document.querySelector('#borrow').onclick = () => { openModal('确认借入 ¥1,500', '<p>借款会增加债务。单这笔本金，每天新增约 ¥27 利息，之后利息也计息。</p><div class="modal-actions"><button data-ui="close-modal">先不借</button><button id="confirm-borrow">确认借款</button></div>'); document.querySelector('#confirm-borrow').onclick = () => { if (dispatch({ type: 'borrow' })) closeModal(); }; };
}

function travel(location) {
  if (!state || state.event) return;
  const target = LOCATIONS.find(l => l.id === location);
  if (!target) return;
  const go = () => { closeModal(); dispatch({ type: 'travel', location }); };
  if (state.ap > 0) {
    openModal(`去${target.name} · 过一天`, `<p>今天还有 <b>${state.ap} 格行动</b>没用。现在出发，这些行动会作废。</p><p>日结：生活与工具 ${money(dailyCost(state))}，新增利息 ${money(dailyInterest(state))}，产品收入 ${money(productIncome(state))}。</p><div class="modal-actions"><button data-ui="close-modal">再做点事</button><button class="primary" id="confirm-travel">结束今天，出发</button></div>`);
    document.querySelector('#confirm-travel').onclick = go;
  } else go();
}

function journal() {
  const s = state ?? saved;
  if (!s) { notify('人生还没开局，账本暂时是空的。'); return; }
  openModal('生存日记 · 每一笔都算数', `<div class="ledger-summary"><span>净资产 <b>${money(netWorth(s))}</b></span><span>交易净盈亏 <b>${money(s.tradeProfit)}</b></span><span>已付/计提利息 <b>${money(s.totalInterest)}</b></span></div>${pageFrame(s.journal.map(j => `<div class="journal-row"><span>DAY ${String(j.day).padStart(2, '0')}</span><p>${esc(j.text)}</p></div>`).join(''), '账本')}`, true);
}

function help() {
  openModal('生存指南 · 边玩边学', pageFrame(`<div class="help-step"><b>永远只看黄色那个按钮。</b><p>每一步最该点的按钮会亮成黄色并轻轻闪：开局、回应事件、建议的行动、结束今天、早报里的“开始今天”。不想照做也可以，别的按钮都能点。</p></div><div class="help-step"><b>40 天内还清欠款，活着收工。</b><p>健康归零、压力到 100，或债务超过 ¥50,000 会提前结束。所有行动都是游戏数值。</p></div><div class="help-step"><b>五种身份，五种活法</b><p>程序员接单多、熬夜少欠技术债；AI 自媒体写稿翻倍、爆款率高；一人公司产品赚得多、研发便宜，但欠得也多；打工人抗压；应届生学得快、签模型半价，但最穷。</p></div><div class="help-step"><b>① 处理事件</b><p>选一个回应，不花行动。长事件点“继续阅读”翻页，每个选项都写明代价；有概率的选项也标明结果。</p></div><div class="help-step"><b>② 两次行动</b><p>接单赚现金，休息恢复健康、降低压力。写稿发帖是抽卡：可能 10 万+，也可能被限流、抽出六指图，甚至熬夜住院，概率都写在格子上。学习涨技能；研发 3 次上线 1 个产品，每天自动收收入，技术债会降低收益。</p></div><div class="help-step"><b>交易和还款都不耗行动</b><p>先处理事件，然后可低买高卖、还债、租模型。回收价低于买价 10%，同日倒手会亏钱。别把生活费全压进库存。</p></div><div class="help-step"><b>③ 结束今天</b><p>点“明天去哪”打开北京地图选地方，再点“结束今天”才过一天。每个地方每天只收 12 种货里的 8 种，价格也不同；去过的地方会在地图上记下当时哪些便宜、哪些贵。生活费约 ¥110–150，加产品维护；债务日息 1.8%。到站后有一份早报：可能领到发布会车马费、黑客松奖金，也可能被房东涨租；还有当天头条和“本站突发”暴涨暴跌。</p></div><div class="help-step"><b>每日委托、成就和排行</b><p>从第 2 天起，顶部会给一个当天小目标，比如“今天倒货赚 ¥500”，收工时达成就发奖励。成就和本机排行榜在菜单“成就”里，只存在这台设备上。仓库满了可以在交易所点“扩仓”，花钱不占行动。</p></div><div class="help-step"><b>第 40 天手动结算</b><p>最后一天仍可行动和交易。确认后按回收价清仓，扣当天费用，再自动还债。</p></div><div class="help-step"><b>看不下的内容，点按钮翻页。</b><p>小屏幕用“事件 / 交易所 / 行动”切换，当前目标和结束今天按钮始终可见；不用上下左右滑动。进度保存在本机，“存档”可以导出或导入。</p></div><div class="help-step"><b>关于本作</b><p>原创 ${EVENTS.length} 个日常事件、${Object.keys(MILESTONES).length} 个阶段剧情。人物情节为虚构恶搞，无需 API key，不调用付费模型。</p><p>灵感来自 <a href="https://github.com/chrisguo/beijing_fushengji" target="_blank" rel="noopener">郭祥昊《北京浮生记》</a>，未使用原版代码或素材。</p></div><div class="modal-actions"><button data-ui="support">打赏支持</button><button data-ui="follow">关注作者</button><button data-ui="news" ${!state ? 'disabled' : ''}>今日快讯</button></div>`, '玩法'), true);
}

function download(content, name, mime = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportSave() {
  let raw = state ? JSON.stringify(state, null, 2) : saved ? JSON.stringify(saved, null, 2) : '';
  if (!raw) { try { raw = localStorage.getItem(SAVE_KEY) || ''; } catch {} }
  if (!raw) { notify('还没有可导出的存档。'); return; }
  download(raw, `AI浮生记-第${(state ?? saved)?.day ?? '未知'}天.json`);
}
function saveDialog() {
  openModal('存档 · 允许人生暂停', `<p>进度自动保存在当前浏览器。换设备之前，导出一份存档。</p><div class="modal-actions"><button data-ui="export">${icon('Download')} 导出存档</button><label class="file-button">${icon('Upload')} 导入存档<input id="import-file" type="file" accept=".json,application/json"></label></div><p class="muted">导入前会确认替换，不会上传到服务器。</p>`);
  document.querySelector('#import-file').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 250000) { notify('存档过大，请选择游戏导出的 JSON 文件。', true); return; }
    try {
      const imported = parseSave(await file.text());
      if (!imported) { notify('存档格式不正确或版本不兼容，当前进度未改变。', true); return; }
      openModal('替换当前存档？', `<p>将载入第 ${imported.day} 天，现金 ${money(imported.cash)} 的存档。当前进度会被替换。</p><div class="modal-actions"><button data-ui="close-modal">取消</button><button class="primary" id="confirm-import">确认导入</button></div>`);
      document.querySelector('#confirm-import').onclick = () => { state = imported; activePane = state.event ? 'event' : 'actions'; persist(); closeModal(); render(); notify('存档已载入，接着过日子。'); };
    } catch { notify('文件读取失败，请重新选择存档。', true); }
  };
}

function resultImage() {
  if (!state || state.status !== 'ended') return;
  const c = document.createElement('canvas'); c.width = 1000; c.height = 1240;
  const x = c.getContext('2d'); x.fillStyle = '#176764'; x.fillRect(0, 0, 1000, 1240); x.fillStyle = '#fffced'; x.fillRect(65, 65, 870, 1110);
  x.fillStyle = '#25392f'; x.font = '28px sans-serif'; x.fillText('AI 浮生记 · 人生结算单', 120, 140); x.font = '22px monospace'; x.fillText(`DAY ${state.day} / 40`, 120, 200);
  x.font = 'bold 56px sans-serif'; x.fillText(state.ending.title, 120, 310, 760); x.font = '25px sans-serif'; x.fillText(state.ending.subtitle, 120, 370, 760);
  x.strokeStyle = '#9a9e8f'; x.setLineDash([8, 8]); x.beginPath(); x.moveTo(120, 420); x.lineTo(880, 420); x.stroke();
  x.font = '26px sans-serif'; x.fillText('最终净资产', 120, 485); x.font = 'bold 72px monospace'; x.fillText(money(netWorth(state)), 120, 580);
  const rows = [['手头现金', money(state.cash)], ['剩余债务', money(state.debt)], ['健康 / 压力', `${state.health} / ${state.stress}`], ['上线产品', `${state.products} 个`], ['认真休息', `${state.daysRested} 次`]];
  x.font = '28px sans-serif'; rows.forEach(([label, value], i) => { x.textAlign = 'left'; x.fillText(label, 120, 680 + i * 65); x.textAlign = 'right'; x.fillText(value, 870, 680 + i * 65); });
  x.textAlign = 'left'; x.font = '27px sans-serif'; x.fillText('模型还会升级。你先好好吃顿饭。', 120, 1070); x.font = '20px sans-serif'; x.fillText('AI 浮生记 · 40 天，保住多少钱和多少自己？', 120, 1120);
  c.toBlob(blob => { if (blob) download(blob, `AI浮生记-${state.ending.title}.png`, 'image/png'); else notify('图片导出失败，可以先复制结局。', true); });
}

function boss() {
  openModal('2026 Q4 人效提升与工作量再分配.xlsx', `<div class="boss-sheet"><h2>关于提升人效的第九次复盘</h2><table><thead><tr><th>项目</th><th>上周</th><th>本周</th><th>结论</th></tr></thead><tbody><tr><td>模型效率</td><td>100%</td><td>200%</td><td>持续提升</td></tr><tr><td>需求数量</td><td>100%</td><td>400%</td><td>潜力巨大</td></tr><tr><td>本人薪资</td><td>100%</td><td>100%</td><td>保持稳定</td></tr><tr><td>会议时长</td><td>8 小时</td><td>16 小时</td><td>加强沟通</td></tr></tbody></table><p>当前工作：研究如何通过 AI 减少关于 AI 的会议。</p></div><button data-ui="close-modal">老板走了，回到人生</button>`, true);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ui]'); if (!b || b.disabled) return;
  const action = b.dataset.ui;
  const map = {
    start: startGame, resume: () => { state = saved; activePane = state.event ? 'event' : 'actions'; render(); },
    new: () => { if (state?.status === 'playing') { openModal('暂时放下这一局', '<p>返回开局页后，当前进度仍会保存。选好新角色并确认，才会替换。</p><div class="modal-actions"><button data-ui="close-modal">继续这一局</button><button id="back-to-welcome">返回角色选择</button></div>'); document.querySelector('#back-to-welcome').onclick = () => { closeModal(); state = null; render(); }; } else { state = null; render(); } },
    'home-screen': () => { if (modal.open) closeModal(); window.scrollTo({ top: 0, behavior: 'auto' }); },
    choose: () => dispatch({ type: 'choose', index: Number(b.dataset.index), stance: Number(document.querySelector('#stance')?.value ?? state.stance) }),
    'show-pane': () => { activePane = b.dataset.pane; document.querySelector('.game-content').dataset.activePane = activePane; document.querySelectorAll('.pane-tabs button').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.pane === activePane))); layoutPages(app); },
    'end-day': () => travel(nextStation),
    company: () => openModal('产品与个人档案', companyPanel()),
    sfx: () => { setSfx(!sfxEnabled()); b.setAttribute('aria-pressed', String(sfxEnabled())); b.innerHTML = `${icon(sfxEnabled() ? 'Volume2' : 'VolumeX')}<span>${sfxEnabled() ? '音效开' : '静音'}</span>`; if (sfxEnabled()) sfx.coins(300); },
    'pick-role': () => { pickedRole = b.dataset.id; sfx.pop(); render(); document.querySelector(`.role-tab[data-id="${pickedRole}"]`)?.focus({ preventScroll: true }); },
    news: () => openModal('今日快讯 · 游戏模拟行情', `${getRumor(state) ? `<div class="market-shock">本站突发：${esc(getRumor(state).title)}<small>${esc(GOODS.find(g => g.id === getRumor(state).good).short)}报价 ×${getRumor(state).factor}，只在今天、只在这一站。</small></div>` : ''}${sceneArt(getNews(state).art)}<h3>${esc(getNews(state).title)}</h3><p>${esc(getNews(state).detail)}</p><p>ROUTER 小报：${esc(featuredModel(state).name)} · ${esc(getNews(state).traffic ?? '发布会永不打烊')}</p><p class="muted">游戏模拟，不是实时排行榜。行情已反映在报价中。</p>`),
    'good-info': () => { const g = GOODS.find(g => g.id === b.dataset.id); openModal(g.name, `<p>${g.desc}</p><p>当前买入 ${money(state.prices[g.id])} / ${g.unit}，回收 ${money(salePrice(state, g.id))}。平常约 ${money(referencePrice(state, g.id))}，今天算<b>${priceHeat(state, g.id).label}</b>。</p><p>持仓 ${state.inventory[g.id].qty}，成本 ${money(state.inventory[g.id].cost)}。买卖不消耗行动。</p>`); },
    gallery, models: modelSquare, 'meme-detail': () => memeDetail(b.dataset.id),
    support: () => openModal('打赏支持', '<p>游戏永久免费。觉得好玩，可以请作者喝杯咖啡。</p><img class="community-qr" src="/community/support.png" alt="作者打赏二维码">'),
    follow: () => openModal('关注向阳乔木', '<p>微信公众号：向阳乔木推荐看</p><img class="community-qr" src="/community/follow.jpg" alt="向阳乔木推荐看公众号二维码"><p class="community-links"><a href="https://github.com/joeseesun/ai-fushengji" target="_blank" rel="noopener">游戏源码</a><a href="https://x.com/vista8" target="_blank" rel="noopener">X / Twitter</a></p>'),
    'hire-model': () => { if (dispatch({ type: 'model', id: b.dataset.id })) closeModal(); },
    action: () => dispatch({ type: 'action', id: b.dataset.id }),
    expand: () => { openModal('扩仓 · 能囤更多货', `<p>仓库决定你最多能同时囤多少件货。现在 <b>${usedSpace(state)}/${state.capacity}</b> 件。</p><p>扩仓后上限 <b>${state.capacity} → ${state.capacity + 10}</b> 件，花 <b>${money(expandCost(state))}</b>，不占行动次数。最多扩到 58 件。</p><p class="muted">适合发现“跳水”货想多囤一些的时候。空着的仓库不会生钱。</p><div class="modal-actions"><button data-ui="close-modal">先不扩</button><button class="primary cta" id="confirm-expand" ${state.cash < expandCost(state) ? 'disabled' : ''}>花 ${money(expandCost(state))} 扩仓</button></div>`); document.querySelector('#confirm-expand').onclick = () => { if (dispatch({ type: 'expand' })) closeModal(); }; },
    map: () => openMap(),
    'map-pick': () => { nextStation = b.dataset.id; drawMapDetail(); },
    'map-go': () => { nextStation = b.dataset.id; closeModal(); render(); },
    achievements: () => openAchievements(),
    buy: () => trade(b.dataset.id, 'buy'), sell: () => trade(b.dataset.id, 'sell'), travel: () => travel(b.dataset.id),
    finish: () => { openModal('结算这 40 天', `<p>今天还剩 ${state.ap} 格行动。确认后按当前回收价清仓，扣除最后一天费用，再自动还债。</p><div class="modal-actions"><button data-ui="close-modal">再想想</button><button class="primary" id="confirm-finish">确认结算</button></div>`); document.querySelector('#confirm-finish').onclick = () => { closeModal(); dispatch({ type: 'finish' }); window.scrollTo(0, 0); }; },
    finance, help, journal, save: saveDialog, export: exportSave, boss,
    'close-modal': closeModal, 'result-image': resultImage,
    'copy-result': async () => { const text = shareText(state); try { await navigator.clipboard.writeText(text); notify('结局已复制。'); } catch { openModal('复制我的结局', `<label for="share-copy">浏览器未允许自动复制，请选中复制：</label><textarea id="share-copy" readonly>${esc(text)}</textarea>`); document.querySelector('#share-copy').select(); } },
    bill: () => openModal('今日账单 · 今晚才结算', `<dl class="bill-list"><div><dt>生活与工具费</dt><dd>−${money(dailyCost(state))}</dd></div><div><dt>小产品收入</dt><dd>+${money(productIncome(state))}</dd></div><div><dt>新增贷款利息</dt><dd>+${money(dailyInterest(state))} 欠款</dd></div></dl><p>利息计入债务；费用先用现金与产品收入支付，不足部分也转为欠款。仓库里的货不会自动帮你付日常账单。</p><p class="muted">每过一天至少消耗 1 健康，压力到 50 后多消耗 2，压力到 70 后多消耗 5。</p>`),
  };
  map[action]?.();
});
document.addEventListener('keydown', e => {
  if (e.key === 'F2') { e.preventDefault(); if (modal.open) closeModal(); else boss(); }
});
window.addEventListener('resize', () => { layoutPages(app); if (modal.open) layoutPages(modal); });
document.addEventListener('input', e => {
  if (e.target.id !== 'stance') return;
  const v = rheostat(Number(e.target.value));
  document.querySelector('#stance-name').textContent = v.name;
  document.querySelector('#stance-effect').textContent = effectText(v.effects);
  document.querySelector('[data-stance-effect]').textContent = effectText(v.effects);
});
render();
if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

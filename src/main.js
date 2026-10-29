import { projectOffers, projectChoice, projectBrief, projectExpiry } from './engine.js';
import { SLOTS_KEY, MAX_SLOTS, readSlots, writeSlots } from './saves.js';
import { createElement, Monitor, Terminal, PenTool, Coffee, Cpu, Presentation, BriefcaseBusiness, GraduationCap, GitFork, House, ScrollText, Workflow, Database, Box, Contact, BookOpen, PackagePlus, Wrench, Zap, HardDrive, ArrowRight, ArrowUpRight, ArrowDownRight, Wallet, Heart, Brain, ReceiptText, CircleHelp, RotateCcw, Download, Upload, X, ChevronRight, NotebookPen, Info, Copy, Check, ShieldCheck, ChartNoAxesCombined, Save, CircleDollarSign, Video, PenLine, Trophy, Building2, Sparkles, Volume2, VolumeX, Users, Map as MapIcon, Award, MapPin } from 'lucide';
import { GOODS, LOCATIONS, ROLES, EVENTS, MILESTONES, WRITE_OUTCOMES, PERKS, VIPS, ITEMS } from './content.js';
import { sfx, sfxEnabled, setSfx } from './sfx.js';
import { CAST, SOURCES, MEME_CATALOG, rheostat } from './memes.js';
import { MODELS, PROFILES, MODEL_DATE, getModel, featuredModel, modelTier, modelBlurb } from './models.js';
import { NEWS_SOURCES } from './news.js';
import { readerReactions } from './news-extra.js';
import { careerDemand, CAREERS, attributeGuide } from './careers.js';
import { ACHIEVEMENTS, checkAchievements, unlocked, runs, recordRun } from './achievements.js';
import { buyPrice, buyCost, sellIncome, depth, activeVips, upcomingVips, itemFor, rentDue, personaFor, newGame, transition, commandRisk, failureReason, parseSave, SAVE_KEY, nextStop, travelFare, gameResult, getEvent, getLocation, getNews, getRumor, getArrival, modelFee, combinedEffects, expandCost, sells, questProgress, priceHeat, referencePrice, usedSpace, salePrice, inventoryValue, netWorth, productIncome, dailyCost, dailyInterest, actionInfo, effectText, shareText } from './engine.js';
import { openLeaderboard, submitScore } from './leaderboard.js';
import { version as APP_VERSION } from '../package.json';
import './style.css';
import './memes.css';
import './screen.css';
import './v3.css';
import './survival.css';
import { layoutPages, pageFrame } from './pagination.js';

const icons = { Monitor, Terminal, PenTool, Coffee, Cpu, Presentation, BriefcaseBusiness, GraduationCap, GitFork, House, ScrollText, Workflow, Database, Box, Contact, BookOpen, PackagePlus, Wrench, Zap, HardDrive, ArrowRight, ArrowUpRight, ArrowDownRight, Wallet, Heart, Brain, ReceiptText, CircleHelp, RotateCcw, Download, Upload, X, ChevronRight, NotebookPen, Info, Copy, Check, ShieldCheck, ChartNoAxesCombined, Save, CircleDollarSign, Video, PenLine, Trophy, Building2, Sparkles, Volume2, VolumeX, Users, Map: MapIcon, Award, MapPin };
const icon = (name, cls = '') => createElement(icons[name] ?? Info, { width: 18, height: 18, 'stroke-width': 1.6, 'aria-hidden': 'true', class: `icon ${cls}` }).outerHTML;
const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compactEffects = effects => effectText(effects).replaceAll(' 元', '').replace('现金 ', '¥').split(' · ').map(t => `<span>${esc(t.replaceAll(' ', ''))}</span>`).join('');
const money = value => `¥${Math.round(value).toLocaleString('zh-CN')}`;
const app = document.querySelector('#app'), modal = document.querySelector('#modal');
let activePane = 'actions', nextStation = null, mapStation = 'jobs', pickedRole = 'coder';
let pendingAnim = null, lastRank = null;
let state = null, saved = null, toastTimer, restoreFocus = null, saveError = '', startupNotice = '', tradeContext = null;
let library = { version: 1, active: null, slots: [] }, libraryLocked = false;
try { library = readSlots(localStorage); saved = library.slots.find(s => s.id === library.active)?.state ?? null; if (saved && !saved.proof) startupNotice = '旧局可按新版规则继续，余额、行情与随机进度保留；旧局不能提交新版全服榜。'; }
catch (error) { libraryLocked = true; startupNotice = `${error.message} 可继续临时游玩，请导出备份。`; }


function notify(text, error = false) {
  const el = document.querySelector('#toast'); el.textContent = text; el.className = `show${error ? ' error' : ''}`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = '', error ? 6500 : 4500);
}
function storeLibrary(candidate) {
  try {
    if (libraryLocked) throw new Error('原存档未能读取');
    writeSlots(localStorage, candidate); library = candidate; saveError = ''; return true;
  } catch { saveError = '自动存档失败。请导出当前进度备份；保存成功后才能切换对局。'; return false; }
}
function persist() {
  if (!state) return true;
  const id = library.active ?? crypto.randomUUID();
  const slots = library.slots.some(s => s.id === id) ? library.slots.map(s => s.id === id ? { id, state } : s) : [...library.slots, { id, state }];
  const ok = storeLibrary({ version: 1, active: id, slots });
  if (ok) saved = state;
  return ok;
}
function addRun(run) {
  if (!persist()) { render(); notify(saveError, true); return; }
  if (library.slots.length >= MAX_SLOTS) { saveDialog(); notify('六个存档已满。请先导出并删除一局，再开新局。', true); return; }
  const id = crypto.randomUUID();
  if (!storeLibrary({ version: 1, active: id, slots: [...library.slots, { id, state: run }] })) {
    if (!library.slots.length) { state = run; closeModal(); render(); }
    else { render(); notify(saveError, true); }
    return;
  }
  state = run; saved = run; lastRank = null; activePane = 'actions'; nextStation = null; startupNotice = ''; closeModal(); render();
}

function dispatch(command, confirmed = false) {
  if (!state) return false;
  const risk = !confirmed && commandRisk(state, command);
  if (risk) {
    const snapshot = state;
    openModal(risk.probability === 100 ? '这一步会让你出局' : '这一步可能让你出局', pageFrame(`<h3>${esc(risk.title)}</h3><p class="risk-summary">出局概率 <b>${risk.probability}%</b>。确认后将按原规则结算。</p>${risk.reasons.map(r => `<p><b>当前${r.label} ${r.current.toLocaleString('zh-CN')}</b> · ${r.rule}</p><p>${r.advice}</p>`).join('')}`, '风险说明') + `<div class="modal-actions sticky-actions"><button class="primary" id="risk-cancel">换个安排</button><button id="risk-confirm">明白风险，继续</button></div>`);
    document.querySelector('#risk-cancel').onclick = () => { closeModal(); activePane = 'actions'; render(); };
    document.querySelector('#risk-confirm').onclick = () => { closeModal(); if (state === snapshot) dispatch(command, true); };
    return false;
  }
  const result = transition(state, command);
  if (result.error) { notify(result.error, true); return false; }
  const focusKey = document.activeElement?.dataset?.focus, prev = state;
  state = result.state;
  const fresh = checkAchievements(prev, state, command);
  if (state.status === 'ended' && prev.status === 'playing') lastRank = recordRun(state, ROLES.find(r => r.id === state.role).name);
  if (command.type === 'travel') { activePane = result.state.draft ? 'event' : 'actions'; nextStation = null; }
  if (['choose', 'ignore-event'].includes(command.type)) activePane = 'actions';
  persist(); render();
  if (state.status === 'ended') { if (modal.open) closeModal(); clearTimeout(toastTimer); document.querySelector('#toast').className = ''; sfx.thud(); return true; }
  if (command.type === 'travel') { clearTimeout(toastTimer); document.querySelector('#toast').className = ''; if (state.status === 'playing') { pendingAnim = prev; briefing(); sfx.morning(); } }
  else if (command.type === 'action') { pendingAnim = prev; actionResult(prev, command.id); }
  else {
    notify(result.message);
    if (modal.open) pendingAnim = prev; else animateStats(prev);
    if (command.type === 'sell') { const gain = state.tradeProfit - prev.tradeProfit; gain > 0 ? sfx.register() : sfx.thud(); }
    else if (command.type === 'buy') sfx.tick();
    else if (command.type === 'project' && state.cash > prev.cash) sfx.coins(state.cash - prev.cash);
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
  const text = o.id === 'normal' ? (info.flavors?.[last?.flavor ?? 0] || info.after) : o.text;
  const launched = id === 'build' && state.products > prev.products;
  const art = o.art || (id === 'write' ? null : `act-${id}`);
  const steps = [...(['work', 'rush'].includes(id) ? info.process : PROCESS[id] ?? ['处理中…'])].sort(() => Math.random() - .5).slice(0, 3);
  const good = GOOD_RANKS.has(o.rank) || launched, bad = o.rank && !good;
  openModal(info.name, pageFrame(`${art ? sceneArt(art, '', 'act-art') : roleArt(state.role, 'gacha-sprite')}<div class="act-stage"><div class="act-run"><div class="act-progress"><i></i></div><p class="act-step">${esc(steps[0])}</p></div><div class="act-result">${o.rank ? `<div class="gacha-rank ${good ? 'rank-good' : 'rank-bad'}">${esc(o.rank)}</div>` : ''}${launched ? `<div class="gacha-rank rank-good">新品上线</div>` : ''}<p class="gacha-text">${esc(text)}${launched ? ` 第 ${state.products} 个小产品上线，明天开始每天收钱。` : ''}</p><span class="effect-chips">${compactEffects(total)}</span>${info.assist ? `<small class="assist-note">${esc(info.assist)}，已计入结果</small>` : ''}</div></div>`, '结果') + `<div class="modal-actions sticky-actions"><button class="primary cta" id="act-continue">跳过 ${icon('ArrowRight')}</button></div>`);
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
function openModal(title, html, wide = false) {
  if (modal.open) modal.close();
  restoreFocus = document.activeElement;
  modal.className = wide ? 'wide' : '';
  modal.innerHTML = `<div class="window-title"><span id="modal-title">${esc(title)}</span><button class="window-close" data-ui="close-modal" aria-label="关闭对话框">${icon('X')}</button></div><div class="modal-content">${html.includes('class="page-frame') ? html : pageFrame(html, '内容')}</div>`;
  modal.showModal();
  layoutPages(modal);
  modal.querySelectorAll('img').forEach(img => img.addEventListener('load', () => layoutPages(modal), { once: true }));
}
modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
modal.addEventListener('click', e => { if (e.target === modal) { const r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });

const monitorArt = `<svg class="monitor-art" viewBox="0 0 260 200" role="img" aria-label="一台还在运转的旧电脑"><path fill="#123e3d" d="M30 177h196v8H30z"/><path fill="#9caa9e" stroke="#283c35" stroke-width="4" d="M31 21h190v127H31z"/><path fill="#e1e0ce" stroke="#35483d" stroke-width="3" d="M24 15h190v127H24z"/><path fill="#203a43" stroke="#7f8e7d" stroke-width="6" d="M39 30h158v92H39z"/><path fill="#f4da8b" d="M78 60h12v12H78zm64 0h12v12h-12zM91 86h51v6H91z"/><path fill="#b4bfaa" d="M105 143h32v19h-32z"/><path fill="#e1e0ce" stroke="#35483d" stroke-width="3" d="M84 160h73v10H84zM44 175h161l14 15H31z"/><path stroke="#9ca38e" stroke-width="3" d="M54 181h138M66 187h116"/><path fill="#244d40" d="M189 132h9v4h-9z"/><text x="116" y="49" text-anchor="middle" fill="#90b7a5" font-size="8" font-family="monospace">HUMAN.EXE</text></svg>`;

function chrome(body) {
  return `<div class="desktop ${state?.status === 'playing' ? 'is-playing' : 'is-intro'}"><aside class="desktop-icons" aria-label="桌面工具"><button data-ui="home-screen" aria-label="返回游戏">${icon('Monitor')}<span>我的人生</span></button><button data-ui="journal">${icon('NotebookPen')}<span>生存日记</span></button><button data-ui="help">${icon('CircleHelp')}<span>生存指南</span></button><div class="desktop-note">人类进程<br>尚未退出</div></aside><main class="game-window"><div class="window-title"><span>${icon('Monitor')} AI 浮生记.exe <span class="title-hint">— HUMAN IS STILL IN THE LOOP</span></span><button class="window-close" data-ui="help" aria-label="查看玩法">?</button></div><nav class="menu" aria-label="游戏菜单"><button data-ui="new">新开局<span>(N)</span></button><button data-ui="journal">账本<span>(B)</span></button><button data-ui="news" ${state ? '' : 'disabled'}>小报</button><button data-ui="save">存档<span>(S)</span></button><button data-ui="gallery">梗图<span>(M)</span></button><button data-ui="models">模型<span>(AI)</span></button><button data-ui="leaderboard">排行<span>(A)</span></button><button data-ui="help">玩法<span>(H)</span></button><button data-ui="sfx" class="sfx-toggle" aria-pressed="${sfxEnabled()}" aria-label="音效">${icon(sfxEnabled() ? 'Volume2' : 'VolumeX')}<span>${sfxEnabled() ? '音效开' : '静音'}</span></button><button class="boss-button" data-ui="boss">老板来了 <kbd>F2</kbd></button></nav>${saveError ? `<div class="save-warning" role="alert">${esc(saveError)} <button data-ui="export">导出存档</button></div>` : ''}${body}<footer class="window-status"><span>${icon('ShieldCheck')} ${state ? (saveError ? '请手动导出存档' : '进度自动保存在本机') : '无需登录 · 无需充值'}</span><span class="community-actions"><button data-ui="support" aria-label="打赏支持" title="打赏支持">${icon('Coffee')}</button><button data-ui="follow" aria-label="关注作者" title="关注作者">${icon('Contact')}</button><a href="https://tuijian.qiaomu.ai/" target="_blank" rel="noopener">乔木推荐</a><span>v${APP_VERSION}</span></span></footer></main></div><footer class="taskbar"><button data-ui="home-screen">${icon('Monitor')} <b>开始</b></button><span class="task-active">AI 浮生记</span><span class="taskbar-end">Powered by <a href="https://qiaomu.ai/" target="_blank" rel="noopener">向阳乔木</a><span class="task-clock">${state ? `DAY ${String(state.day).padStart(2, '0')}` : '40 DAYS'}</span></span></footer>`;
}

const roleArt = (id, cls = '') => `<img class="role-sprite ${cls}" src="/art/roles/${id}.webp" alt="" width="200" height="300" decoding="async">`;
function welcome() {
  const r = ROLES.find(r => r.id === pickedRole) ?? ROLES[0];
  const tabs = ROLES.map(x => `<button class="role-tab" role="radio" aria-checked="${x.id === r.id}" data-ui="pick-role" data-id="${x.id}">${roleArt(x.id)}<span>${x.name}</span></button>`).join('');
  const stat = (label, value, cls = '') => `<span class="${cls}"><small>${label}</small><b>${value}</b></span>`;
  return `<div class="welcome v3"><section class="welcome-hero" aria-label="AI 浮生记"><div class="hero-copy"><span class="hero-kicker">像素生存 · 40 天 · 嘴很毒</span><h1>AI 浮生记</h1><p>模型在进化。<br>你还好吗？</p><div class="opening-numbers"><span><b>40</b>天还清</span><span><b>¥8k+</b>培训贷</span><span><b>∞</b>个“最后的机会”</span></div></div></section><section class="role-panel"><div class="panel-heading"><h2>选一个你</h2><span>没有天选之人，只有天选之债</span></div>${startupNotice ? `<div class="notice">${esc(startupNotice)}</div>` : ''}${saved ? `<button class="resume cta" data-ui="resume">${icon('Save')}<span><b>继续上次的人生</b><small>第 ${saved.day} 天 · ${saved.status === 'ended' ? '查看结局' : getLocation(saved).name} · 现金 ${money(saved.cash)}</small></span>${icon('ArrowRight')}</button>` : ''}<div class="role-tabs" role="radiogroup" aria-label="选择身份">${tabs}</div><article class="role-card" aria-live="polite">${roleArt(r.id, 'big')}<div class="role-info"><span class="role-title">${esc(r.title)}</span><h3>${esc(r.name)}</h3><p class="role-quote">“${esc(r.quote)}”</p><ul class="role-skills">${r.skills.map(([n, d]) => `<li>${icon('Sparkles')}<b>${esc(n)}</b><span>${esc(d)}</span></li>`).join('')}</ul><p class="role-weak">弱点：${esc(r.weakness)}</p><div class="role-stats">${stat('现金', money(r.cash))}${stat('欠款', money(r.debt), 'negative')}${stat('技能', r.skill)}${stat('口碑', r.reputation)}${stat('压力', r.stress)}</div></div></article><button class="primary start-button ${saved ? '' : 'cta'}" data-ui="start">以「${esc(r.name)}」开局 ${icon('ArrowRight')}</button><button class="text-button start-hint" data-ui="goals">${icon('CircleHelp')} 怎样算赢？查看通关规则</button></section></div>`;
}
function stats() {
  return `<header class="dashboard-header"><div class="day-block"><strong>第 <b data-testid="day">${String(state.day).padStart(2, '0')}</b> 天 <small>/ 40</small></strong><span>${getLocation(state).name}</span></div><div class="stats"><div class="stat" data-stat="cash"><span>现金<strong data-testid="cash">${money(state.cash)}</strong></span></div><div class="stat debt" data-stat="debt"><span>欠款<strong data-testid="debt">${money(state.debt)}</strong></span><button class="stat-action" data-ui="finance" aria-label="还款与借款">还款</button></div><div class="stat ${state.health < 30 ? 'danger' : ''}" data-stat="health"><span>健康<strong>${state.health}<em>/100</em></strong><span class="meter"><i style="width:${state.health}%"></i></span></span></div><div class="stat ${state.stress >= 70 ? 'danger' : ''}" data-stat="stress"><span>压力<strong>${state.stress}<em>/100</em></strong><span class="meter stress"><i style="width:${state.stress}%"></i></span></span></div></div></header>`;
}

function marketPanel() {
  const locked = false;
  const rows = GOODS.filter(g => sells(state, g.id)).map(g => {
    const delta = state.previousPrices[g.id] ? Math.round((state.prices[g.id] / state.previousPrices[g.id] - 1) * 100) : 0;
    const item = state.inventory[g.id], canBuy = state.cash >= buyPrice(state, g.id) && usedSpace(state) < state.capacity;
    const d = depth(state, g.id), flowNote = d.sold ? `<small class="depth-note">今天已卖 ${d.sold} 件 · 卖价 −${d.bidCut}%</small>` : d.bought ? `<small class="depth-note">今天已买 ${d.bought} 件 · 买价 +${d.askLift}%</small>` : '';
    const heat = priceHeat(state, g.id), avg = item.qty ? Math.round(item.cost / item.qty) : 0, gain = salePrice(state, g.id) >= avg;
    return `<div class="quote-row heat-${heat.id}" role="row"><div role="cell"><button class="goods-info" data-ui="good-info" data-id="${g.id}"><img class="good-icon" src="/art/goods/${g.art ?? g.id}.webp" alt="" width="24" height="24">${g.name}</button><small><span class="heat-tag" title="平常约 ${money(referencePrice(state, g.id))}">${heat.label}</span> <span class="delta ${delta >= 0 ? 'positive' : 'negative'}">${state.day === 1 ? '首日' : `${delta >= 0 ? '+' : ''}${delta}%`}</span></small></div><div class="quote-prices" role="cell"><b>${money(buyPrice(state, g.id))}</b><small>${money(salePrice(state, g.id))}</small>${flowNote}${getNews(state).factors[g.id] ? `<small class="news-price ${getNews(state).factors[g.id] > 1 ? 'positive' : 'negative'}">新闻 ×${getNews(state).factors[g.id]}</small>` : ''}</div><div class="quote-holding" role="cell">${item.qty ? `<b>${item.qty}<small>均¥${avg}</small></b><small class="pl ${gain ? 'positive' : 'negative'}" title="现在全部卖出：到账 ${money(salePrice(state, g.id) * item.qty)}，成本 ${money(item.cost)}">卖出${gain ? '赚' : '亏'}${money(Math.abs(salePrice(state, g.id) * item.qty - item.cost))}</small>` : '<b>0</b><small>空仓</small>'}</div><div class="trade-buttons" role="cell"><button data-ui="buy" data-id="${g.id}" data-focus="buy-${g.id}" aria-label="买入${g.name}" ${locked || !canBuy ? 'disabled' : ''}>买</button><button data-ui="sell" data-id="${g.id}" data-focus="sell-${g.id}" aria-label="卖出${g.name}" ${locked || !item.qty ? 'disabled' : ''}>卖</button></div></div>`;
  }).join('');
  return `<section class="panel market-panel screen-pane" data-pane="market"><div class="panel-heading"><h2>${icon('ChartNoAxesCombined')} 交易所</h2><span class="market-capacity">仓位 ${usedSpace(state)}/${state.capacity}<button class="text-button expand-button" data-ui="expand" ${state.capacity >= 58 ? 'disabled' : ''}>${icon('HardDrive')} 扩仓</button></span></div><div class="quotes" role="table" aria-label="今日货品行情"><div class="quote-row quote-labels" role="row"><span role="columnheader">货品 / 涨跌</span><span role="columnheader">买价 / 卖价</span><span role="columnheader">持有 / 盈亏</span><span role="columnheader">买卖</span></div>${pageFrame(rows, '货品', 'market-pages')}</div><p class="panel-note">${(() => { const away = GOODS.filter(g => !sells(state, g.id) && state.inventory[g.id].qty); return away.length ? `仓里还有 ${away.map(g => `${g.short}×${state.inventory[g.id].qty}`).join('、')}：本站今天不收，换地方卖` : locked ? '交易不耗行动。' : `本站今天只收这 ${state.available.length} 样货 · 跳水时买，换站等暴涨再卖`; })()}</p></section>`;
}

function draftPanel() {
  const cards = state.draft.map(id => PERKS.find(p => p.id === id)).map(p => `<button class="perk-card" data-ui="perk" data-id="${p.id}"><img src="/art/perks/${p.id}.webp" alt="" width="56" height="56"><span><b>${esc(p.name)}</b><em>${esc(p.desc)}</em><small>${esc(p.quote)}</small></span></button>`).join('');
  return `<section class="panel event-panel screen-pane pending draft-panel" data-pane="event" aria-labelledby="event-heading"><div class="panel-heading"><h2>${icon('Sparkles')} 外挂三选一</h2><span>永久生效 · 收工前不选就作废</span></div>${pageFrame(`<div class="event-intro"><span class="event-tag">第 ${state.day} 天 · 季度复盘</span><h3 id="event-heading" tabindex="-1">挑一张外挂，决定你这局的流派</h3></div>${cards}`, '外挂', 'event-pages')}<div class="event-footer">已装 ${state.perks.length} 张${state.perks.length ? `：${state.perks.map(id => esc(PERKS.find(p => p.id === id).name)).join('、')}` : ''}</div></section>`;
}
const vipCard = (v, when) => {
  const item = ITEMS[v.item], here = v.station === state.location && when === 'today', place = LOCATIONS.find(l => l.id === v.station).name;
  return `<article class="vip-card ${when}">${portrait(v.id)}<div><span class="vip-when">${when === 'today' ? (v.until === v.from ? '仅限今天 · 收工离场' : `今天 · 到第 ${v.until} 天`) : '明天到场 · 预告'}</span><b>${esc(v.name)}「${esc(v.title)}」@ ${esc(place)}</b><em>${esc(v.hint)}</em><small>${esc(v.quote)}</small><span class="vip-item"><img src="/art/items/${v.item}.webp" alt="" width="20" height="20">${here ? (v.claimed ? `你在现场，已领到「${esc(item.name)}」` : `到场可领「${esc(item.name)}」`) : `去${esc(place)}可领「${esc(item.name)}」：${esc(item.desc)}`}</span></div></article>`;
};
function todayPanel() {
  const e = getEvent(state), now = activeVips(state), soon = upcomingVips(state), bag = Object.entries(state.items ?? {});
  const blocks = [
    ...now.map(v => vipCard(v, 'today')),
    !now.length && !soon.length ? '<p class="item-hint">今天没有大佬到访，也没有明日行程。看看行情，经营自己的生意。</p>' : '',
    ...soon.map(v => vipCard(v, 'soon')),
    bag.length ? `<div class="item-bag"><b>我的道具</b>${bag.map(([id, n]) => `<span title="${esc(ITEMS[id].desc)}"><img src="/art/items/${id}.webp" alt="" width="24" height="24">${esc(ITEMS[id].name)} ×${n}</span>`).join('')}<small>做对应的事时自动使用，按钮上会标出来。</small></div>` : '',
    // Split the day's meme into page-sized pieces so small screens page through it instead of clipping.
    ...(e ? [...(e.meme ? [memeArt(e)] : []), `<div class="today-meme"><span class="event-tag">今日梗 · ${esc(e.tag)}</span><h3>${esc(e.title)}</h3></div>`, ...(e.text.match(/[^。！？]+[。！？]?/g) ?? [e.text]).map(t => `<p class="event-story">${esc(t)}</p>`)] : []),
  ];
  return `<section class="panel event-panel screen-pane today-panel" data-pane="event" aria-labelledby="event-heading"><div class="panel-heading"><h2 id="event-heading" tabindex="-1">${icon('Sparkles')} 今日风向</h2><span>机会短暂，日子照常</span></div>${pageFrame(blocks.join(''), '风向', 'event-pages')}<div class="event-footer">人物情节为虚构恶搞${e?.meme ? `<button class="inline-link" data-ui="meme-detail" data-id="${e.id}">梗的出处 ↗</button>` : ''}</div></section>`;
}
function eventPanel() {
  if (state.draft) return draftPanel();
  return todayPanel();
  const e = getEvent(state), previous = MEME_CATALOG.find(m => m.id === state.lastEvent);
  const content = e ? `${e.meme ? memeArt(e) : sceneArt(`loc-${state.location}`, getLocation(state).full)}<div class="event-intro"><span class="event-tag">${esc(e.tag)}</span><h3 id="event-heading" tabindex="-1">${esc(e.title)}</h3></div>${e.text.match(/[^。！？]+[。！？]?/g)?.map(t => `<p class="event-story">${esc(t)}</p>`).join('') ?? ''}${e.shock ? `<div class="market-shock">行情已变：${Object.entries(e.shock).map(([id, v]) => `${GOODS.find(g => g.id === id).short} ×${v}`).join(' · ')}<small>已计入交易所当前报价。</small></div>` : ''}${e.interaction === 'rheostat' ? `<div class="rheostat"><label for="stance">今日称谓：<b id="stance-name">${rheostat(state.stance).name}</b></label><input id="stance" type="range" min="0" max="100" value="${state.stance}" aria-describedby="stance-effect"><div class="rheostat-labels"><span>梁子</span><span>梁老师</span><span>梁圣 / 义父</span></div><small id="stance-effect">${effectText(rheostat(state.stance).effects)}</small></div>` : ''}${e.options.map((o, i) => `<button class="event-choice ${e.options.length === 1 ? 'cta' : ''}" data-ui="choose" data-index="${i}" ${state.cash + (o.effects.cash ?? 0) < 0 ? 'disabled' : ''}><span>${esc(o.label)}${icon('ArrowUpRight')}</span><small ${o.stance ? 'data-stance-effect' : ''}>${effectText(o.stance ? rheostat(state.stance).effects : o.effects)}${state.cash + (o.effects.cash ?? 0) < 0 ? ' · 现金不足' : ''}</small>${o.outcomes ? `<small class="risk-outcomes">${o.outcomes.map(r => `${r.weight}%：${effectText(r.effects)}`).join('；')}</small>` : ''}${o.followUp ? '<small class="sequel-hint">以后还会有下文…</small>' : ''}</button>`).join('')}` : `<div class="event-intro">${previous ? memeArt(previous) : ''}<span class="event-tag">${icon('Check')} 今天由你安排</span><h3 id="event-heading" tabindex="-1">${state.ap ? '接下来，安排今天。' : '今天的行动完成了。'}</h3></div><p class="event-story">${esc(state.journal.find(j => ['event', 'skip'].includes(j.kind))?.text || '把时间花在值得的事情上。')}</p><div class="next-card"><b>${state.ap ? `还可以行动 ${state.ap} 次` : '可以结束今天了'}</b><p>${state.ap ? '接单拿钱；累了就休息。想发展长期收入，可以学习、研发。' : state.day === 40 ? '准备好了，点底部“结算输赢”。最后一次整理持仓和欠款。' : '买卖和还款不耗行动，想做就做。准备好了，点底部“收工”。'}</p><button data-ui="show-pane" data-pane="actions">${state.ap ? '去安排行动' : '查看今日行动'} ${icon('ArrowRight')}</button></div>`;
  return `<section class="panel event-panel screen-pane ${e ? 'pending' : ''}" data-pane="event" aria-labelledby="event-heading"><div class="panel-heading"><h2>${icon('NotebookPen')} ${e ? '今日遭遇 · 可选' : '今日遭遇'}</h2><span>${e ? '不耗行动' : '已结束'}</span></div>${pageFrame(content, '事件', 'event-pages')}<div class="event-footer">${e ? `<button class="inline-link" data-ui="ignore-event">今天不掺和</button>` : '虚构恶搞'}${e?.meme ? `<button class="inline-link" data-ui="meme-detail" data-id="${e.id}">梗的出处 ↗</button>` : ''}</div></section>`;
}

function sceneArt(name, caption = '', cls = '') {
  return `<figure class="scene-art ${cls}"><img src="/art/scenes/${name}.webp" alt="" width="800" height="450" decoding="async">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
}
function briefing() {
  const l = getLocation(state), news = getNews(state), rumor = getRumor(state), arrival = getArrival(state);
  const projectNotice = state.project ? `<div class="brief-arrival"><b>${state.project.change === 'pending' ? '客户追加需求' : '项目仍在进行'}</b><p>${esc(projectBrief(state)[0])} · 进度 ${state.project.progress}/${state.project.need} · 截止第 ${state.project.due} 天收工前。</p>${state.project.change === 'pending' ? `<p>${esc(projectBrief(state)[2])}</p>` : ''}<button data-ui="projects">去项目板处理</button></div>` : '';
  openModal(`第 ${state.day} 天 · AI 浮生早报`, pageFrame(`${projectNotice}${state.rent ? `${sceneArt('rent-boss', '', 'brief-hero')}<div class="brief-arrival boss"><b>BOSS 来袭 · 房东</b><p>今天收工前交房租 ${money(state.rent.due)}。</p><em>房东：“AI 时代，房租也要迭代。”不交的话，${money(Math.round(state.rent.due * 1.5))} 记进欠款。</em></div>` : sceneArt(`loc-${l.id}`, '', 'brief-hero')}${state.draft ? `<div class="brief-arrival"><b>季度复盘</b><p>今天可以挑一张外挂，三选一，永久生效。</p><em>在左边“外挂三选一”里选，收工前不选就作废。</em></div>` : ''}${activeVips(state).map(v => `<div class="brief-vip">${portrait(v.id)}<div><small>${v.station === state.location ? '大佬就在你这站！' : `今天在 ${esc(LOCATIONS.find(l => l.id === v.station).name)}`}</small><b>${esc(v.name)}「${esc(v.title)}」</b><span>${esc(v.hint)}${v.station === state.location ? ` · 你领到了「${esc(ITEMS[v.item].name)}」` : ''}</span></div></div>`).join('')}${upcomingVips(state).map(v => `<div class="brief-vip soon">${portrait(v.id)}<div><small>明日预告 · 打开地图看</small><b>${esc(v.name)} 明天到 ${esc(LOCATIONS.find(l => l.id === v.station).name)}</b><span>${esc(v.hint)}</span></div></div>`).join('')}<div class="brief-place"><small>你到了</small><b>${esc(l.full)}</b><span>${esc(l.line)}</span></div>${arrival ? `<div class="brief-arrival"><b>到站小事</b><p>${esc(arrival.text)}</p><em>${esc(arrival.note)}</em><span class="effect-chips">${compactEffects(arrival.effects)}</span></div>` : ''}${rumor ? `<div class="brief-news breaking">${sceneArt(rumor.art)}<div><small>本站突发 · 只在今天</small><b>${esc(rumor.title)}</b><span>${esc(GOODS.find(g => g.id === rumor.good).short)} 报价 ×${rumor.factor}</span></div></div>` : ''}<div class="brief-news">${sceneArt(news.art)}<div><small>今日头条</small><b>${esc(news.title)}</b><span>${esc(news.detail)}</span></div></div><p class="news-comment"><b>小报锐评</b> ${esc(news.comment ?? '账单负责让人清醒。')}</p>`, '早报') + `<div class="modal-actions sticky-actions"><button class="primary cta" data-ui="close-modal">开始今天 ${icon('ArrowRight')}</button></div>`, true);
  modal.classList.add('briefing', 'fit');
}
// Pin positions on the map art, in percent.
const MAP_PINS = { market: [20, 16], launch: [75, 17], jobs: [16, 40], course: [79, 40], opensource: [18, 62], stream: [46, 66], hackathon: [80, 63], home: [55, 87] };
function openNews() {
  const news = getNews(state), rumor = getRumor(state), source = NEWS_SOURCES[news.source], demand = careerDemand(state);
  const effects = Object.entries(news.factors).map(([id, factor]) => {
    const g = GOODS.find(g => g.id === id);
    return `<div class="news-market-line"><span><b>${esc(g.name)}</b><small>${sells(state, id) ? '本站有货' : '本站今日未上架'} · 持仓 ${state.inventory[id].qty}</small></span><strong class="${factor > 1 ? 'positive' : 'negative'}">${factor > 1 ? '利好' : '利空'} ×${factor}</strong></div>`;
  }).join('');
  openModal('AI 浮生小报 · 今日快讯', pageFrame(`${sceneArt(news.art)}<h3 class="news-headline">${esc(news.title)}</h3><p class="news-comment">${esc(news.comment)}</p><h3>谁涨谁跌</h3>${effects || '<p>今天没有新闻冲击，各站照常报价。</p>'}${news.product ? `<p>今天所有产品收入 ×${news.product}。</p>` : ''}<p class="muted">倍率已计入今天报价，是对平常价格的影响；实际价格还受地点、波动与突发事件影响，不代表比昨天涨这么多。买卖有 10% 差价。</p>${rumor ? `<div class="market-shock">本站突发：${esc(rumor.title)}<small>${esc(GOODS.find(g => g.id === rumor.good).short)}另乘 ×${rumor.factor}，只在今天。</small></div>` : ''}${demand ? `<div class="news-impact"><b>今天的赚钱机会 · ${esc(demand.label)}</b><p>${esc(demand.text)}，对应职业的普通单、急单基础报价 +30%。${demand.active ? '你正好能接，报价已经加上。' : '交易所的涨跌对所有职业都生效。'}</p></div>` : ''}<h3>街坊热评</h3>${readerReactions(state).map(([who, line]) => `<p class="reader-reaction"><b>${esc(who)}：</b>${esc(line)}</p>`).join('')}<p>ROUTER 小报：${esc(featuredModel(state).name)} · ${esc(news.traffic ?? '发布会永不打烊')}</p><p class="muted">原创游戏小报，人物桥段为虚构，不是现实新闻或实时排行榜。同一局不重复标题，刷新不会换新闻。</p>${source ? `<a class="source-link" href="${esc(source.url)}" target="_blank" rel="noopener">梗的传播样例：${esc(source.label)} ↗</a>` : ''}`, '小报') + `<div class="modal-actions sticky-actions"><button data-ui="news-market">去看行情 ${icon('ArrowRight')}</button><button data-ui="news-actions">去安排行动</button></div>`);
  modal.classList.add('news-modal'); layoutPages(modal);
}

function openMap() {
  if (!state) return;
  mapStation = nextStation ?? nextStop(state);
  openModal('北京地图 · 明天去哪', pageFrame(`<p class="map-intro">每天默认搭免费顺风车去下一站；留在原地也免费。跳站打车 ¥120，收工时扣费。<b>只选地点，不会立刻过夜。</b></p><div class="map-wrap"><img src="/art/scenes/map.webp" alt="北京地点示意图" width="1200" height="800">${LOCATIONS.map(l => `<button class="map-pin ${l.id === mapStation ? 'picked' : ''} ${l.id === state.location ? 'here' : ''}" style="left:${MAP_PINS[l.id][0]}%;top:${MAP_PINS[l.id][1]}%" data-ui="map-pick" data-id="${l.id}" aria-label="${esc(l.name)}">${icon(l.icon)}<span>${esc(l.name)}</span>${[...activeVips(state).filter(v => v.station === l.id).map(v => `<i class="pin-vip today" title="${esc(v.name)} 今天在这">${portrait(v.id, 'pin')}</i>`), ...upcomingVips(state).filter(v => v.station === l.id).map(v => `<i class="pin-vip soon" title="${esc(v.name)} 明天到">${portrait(v.id, 'pin')}<em>明</em></i>`)].join('')}</button>`).join('')}</div><h3 data-map-title></h3><p class="map-vip" data-map-vip></p><p data-map-line></p><p class="map-perk" data-map-perk></p><p data-map-trend></p><p class="map-intel" data-map-intel></p>`, '地图', 'map-pages') + `<div class="modal-actions sticky-actions"><button data-ui="close-modal">再想想</button><button class="primary cta" data-ui="map-go"></button></div>`, true);
  modal.classList.add('map-modal');
  drawMapDetail();
}
function drawMapDetail() {
  if (!modal.querySelector('.map-pages')) return;
  modal.querySelectorAll('.map-pin').forEach(p => p.classList.toggle('picked', p.dataset.id === mapStation));
  const l = LOCATIONS.find(l => l.id === mapStation), intel = state.intel?.[l.id];
  const names = ids => ids.map(id => GOODS.find(g => g.id === id).short).join('、') || '无';
  const tops = Object.entries(l.factors).sort((a, b) => a[1] - b[1]);
  const values = {
    title: `${l.full}${l.id === state.location ? ' · 你在这里' : ''}`,
    line: l.line, perk: l.specialty,
    vip: [...activeVips(state), ...upcomingVips(state)].filter(v => v.station === l.id).map(v => `${v.from > state.day ? '明天' : '今天'}：${v.name}「${v.title}」—${v.hint}，到场领「${ITEMS[v.item].name}」`).join('；') || '这里暂时没有大佬。',
    trend: `常年便宜：${names(tops.filter(t => t[1] < 1).slice(0, 3).map(t => t[0]))}；常年贵：${names(tops.filter(t => t[1] > 1).slice(-3).map(t => t[0]))}`,
    intel: intel ? `第 ${intel.day} 天来过：当时便宜 ${names(intel.cheap)}；贵 ${names(intel.dear)}` : '还没来过，行情未知。',
  };
  for (const [key, value] of Object.entries(values)) modal.querySelector(`[data-map-${key}]`).textContent = value;
  modal.querySelector('[data-ui="map-go"]').textContent = `去${l.name} · ${travelFare(state, l.id) ? '打车 ¥120' : '免费'}`;
  layoutPages(modal);
}
function openAchievements() {
  const have = unlocked(), list = runs();
  const cards = ACHIEVEMENTS.map(a => `<div class="ach ${have[a.id] ? 'got' : ''}">${icon('Award')}<span><b>${have[a.id] ? esc(a.title) : '？？？'}</b><small>${esc(a.desc)}</small></span></div>`);
  const rows = cards.filter((_, i) => i % 2 === 0).map((_, i) => `<div class="ach-row">${cards.slice(i * 2, i * 2 + 2).join('')}</div>`).join('');
  openModal(`成就与排行 · 已解锁 ${ACHIEVEMENTS.filter(a => have[a.id]).length}/${ACHIEVEMENTS.length}`, pageFrame(`<button data-ui="leaderboard">查看全服排行榜 →</button>${rows}<h3 class="rank-title">本机排行榜 · 最好的 10 局</h3>${list.length ? list.map((r, i) => `<p class="rank-entry">${i + 1}. <b>${money(r.worth)}</b> · ${esc(r.role)} · ${esc(r.ending)} · 第 ${r.day} 天<br><small>${esc(r.date)}</small></p>`).join('') : '<p class="muted">还没有结算过的一局。打完 40 天（或提前下线）就会上榜。</p>'}<p class="muted">成就和排行只存在这台设备的浏览器里，不上传。</p>`, '成就'), true);
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
  openModal('模型广场 · 你选模型，账单选你', `<p class="model-intro">${MODELS.length} 个模型条目 · 国内外 ${new Set(MODELS.map(m => m.family)).size} 个家族 · 名称核对 ${MODEL_DATE}。租约使用游戏币，最多 5 天；无需真实 API，不会自动续费。下面加成为游戏设定。</p><div class="model-filters"><input id="model-search" type="search" placeholder="搜索模型 / 家族，例如 Kimi、豆包" aria-label="搜索模型"><select id="model-region" aria-label="模型地区"><option value="全部">全部模型</option><option>国内</option><option>海外</option></select></div>${state && getModel(state) ? `<p class="model-status">当前搭子 ${esc(getModel(state).name)}，合约至第 ${state.modelUntil} 天。到期后可以换模型，不会自动续费。</p>` : !state || state.status !== 'playing' ? '<p class="model-status">开局后可用游戏币签约，当前仅供浏览。</p>' : ''}${pageFrame('', '模型', 'model-list-frame')}`, true);
  modal.classList.add('models');
  const draw = () => {
    const q = document.querySelector('#model-search').value.toLowerCase(), region = document.querySelector('#model-region').value;
    const found = MODELS.filter(m => `${m.name} ${m.family}`.toLowerCase().includes(q) && (region === '全部' || region === m.region));
    document.querySelector('.model-list-frame>.page-content').innerHTML = found.length ? found.map(m => {
      const fee = state ? modelFee(state, m) : m.fee, active = state && getModel(state), disabled = !state || state.status !== 'playing' || active || state.cash < fee;
      const value = Math.min(5, Math.max(1, Math.round(m.work / m.fee * 2.2)));
      return `<article class="model-card"><div class="model-card-top">${portrait(m.art, 'mini')}<span><small>${m.region} · ${m.family} · ${PROFILES[m.profile].label}</small><h3>${esc(m.name)}</h3></span><em class="tier tier-${modelTier(m)}">${modelTier(m)}</em></div><p>${m.joke}</p><div class="model-perks">${modelBlurb(m)}<span class="value">性价比 ${'★'.repeat(value)}${'☆'.repeat(5 - value)}</span></div><div class="model-card-bottom"><a href="${esc(m.source)}" target="_blank" rel="noopener">来源 ↗</a><button data-ui="hire-model" data-id="${esc(m.id)}" ${disabled ? 'disabled' : ''}>${active?.id === m.id ? '已签约' : `${money(fee)} / ${state ? Math.min(5, 41 - state.day) : 5} 天`}</button></div></article>`;
    }).join('') : '<p class="empty-models">没有找到这个名字。可以试试模型家族名。</p>';
    document.querySelector('.model-list-frame').dataset.page = 0;
    layoutPages(modal);
  };
  document.querySelector('#model-search').oninput = draw; document.querySelector('#model-region').onchange = draw; draw();
}

function projectEntry() {
  const p = state.project;
  const next = !p ? '挑一单跨两三天的活，交付后再收钱' : p.change === 'pending' ? '甲方加需求了 · 点开谈范围' : p.progress >= p.need ? (p.change === 'waiting' ? '进度做完，明天确认范围' : '进度做完了 · 可以验收收款') : `进度 ${p.progress}/${p.need} · 第 ${p.due} 天收工前交付`;
  return `<button class="project-entry ${p?.change === 'pending' ? 'needs-attention' : ''}" data-ui="projects">${icon('BriefcaseBusiness')}<span><b>${p ? esc(projectBrief(state)[0]) : '跨日项目 · 接一单认真做'}</b><small>${esc(next)}</small></span>${icon('ChevronRight')}</button>`;
}
function projectDialog() {
  if (!state || state.status !== 'playing') return;
  const p = state.project, blocks = [];
  const commandButton = (id, info) => `<button class="project-option" data-ui="project-command" data-id="${id}" ${info.reason ? 'disabled' : ''}><b>${esc(info.name)}</b><span>${esc(info.reason || info.desc)}</span>${!info.reason && Object.keys(info.effects ?? {}).length ? `<small>${esc(effectText(info.effects))}${info.ap ? ' · 消耗 1 次行动' : ''}</small>` : ''}</button>`;
  if (!p) {
    blocks.push('<p>签约不发钱、不耗行动；同时只接一单。投入行动与制作成本，第二天确认新增需求，做完后手动交付收款。</p>');
    const offers = projectOffers(state);
    offers.forEach((offer, i) => {
      const brief = projectBrief(state, offer), cost = projectChoice({ ...state, project: offer }, 'steady').effects;
      blocks.push(`<article class="project-offer"><h3>${esc(brief[0])}</h3><p>${esc(brief[1])}</p><p><b>项目款 ${money(offer.reward)}</b> · 初始 ${offer.need} 格进度<br>第 ${offer.due} 天收工前交付<br>每次认真制作：${esc(effectText(cost))}，1 次行动。<br>明天客户确认范围，可能多做 1 格；可缩范围减报酬，或凭条件议价/复用。逾期无报酬、口碑 −6、压力 +10。</p><button data-ui="project-command" data-id="take-${i}">接下这单 · 完工后收款</button></article>`);
    });
    if (!offers.length) blocks.push(`<p>${state.day > 38 ? '临近最终结算，不再接新项目。已有项目仍可在第 40 天交付。' : '今天已经接过项目，明天再看新单。'}需要应急现金，可去做零工。</p>`);
  } else {
    const brief = projectBrief(state);
    blocks.push(`<h3>${esc(brief[0])}</h3>`, `<p><b>进度 ${p.progress}/${p.need} · 项目款 ${money(p.reward)}</b><br>截止：第 ${p.due} 天收工前（${state.day === p.due ? '就是今天' : `还有 ${p.due - state.day} 次过夜`}）。交付前没有项目收入，逾期无报酬、口碑 −6、压力 +10。</p>`);
    if (p.change === 'waiting') blocks.push('<p>今天先制作，明天客户确认范围。报价包含一次范围协商；手上的其他安排仍可照做。</p>');
    if (p.change === 'pending') blocks.push(`<p class="project-request"><b>甲方：“就加亿点点。”</b><br>${esc(brief[2])}</p>`);
    const ids = p.change === 'pending' ? ['trim', 'negotiate', 'accept', 'reuse'] : ['steady', 'rush', 'deliver'];
    blocks.push(...ids.map(id => commandButton(id, projectChoice(state, id))));
    blocks.push(commandButton('cancel', projectChoice(state, 'cancel')));
  }
  const last = state.journal.find(j => j.kind === 'project');
  if (last) blocks.push(`<p class="project-receipt"><b>最近进展</b><br>${esc(last.text)}</p>`);
  openModal('项目板 · 先谈清楚，再把活做完', pageFrame(blocks.join(''), '项目'));
}

function actionPanel() {
  const tired = state.health < 45 || state.stress > 65, demand = careerDemand(state);
  const suggested = tired ? 'rest' : state.role === 'creator' ? 'write' : 'work';
  const actions = state.role === 'opc' ? ['work', 'build', 'rush', 'learn', 'rest', 'social', 'write', 'maintain'] : ['work', 'write', 'rush', 'learn', 'rest', 'social', 'build', 'maintain'];
  if (tired) { actions.splice(actions.indexOf('rest'), 1); actions.unshift('rest'); }
  const categories = { work: '应急零工', write: '发帖', rush: '急单', learn: '学习', rest: '休息', social: '社交', build: '研发', maintain: '维护' };
  const rows = [0, 2, 4, 6].map(start => `<div class="action-row">${actions.slice(start, start + 2).map(id => {
    const a = actionInfo(state, id); const held = itemFor(state, id);
    return `<button class="action-tile ${id === suggested && state.ap ? `suggested ${tired ? 'warn' : ''}` : ''}" data-ui="action" data-id="${id}" data-focus="action-${id}" ${a.reason ? 'disabled' : ''} title="${esc(a.desc)}"><span class="action-kind">${categories[id]}${id === 'work' && demand?.active ? ' · 热点加价 30%' : ''}</span>${held ? `<span class="item-chip"><img src="/art/items/${held}.webp" alt="" width="16" height="16">${esc(ITEMS[held].name)} ×${state.items[held]}</span>` : ''}<span class="action-name">${icon(a.icon)}<strong>${a.name}</strong></span><small class="action-effects">${a.reason || (id === 'write' ? `<span>抽卡¥0–${Math.max(...a.outcomes.map(o => o.effects.cash ?? 0))}</span><span>爆款${a.outcomes[0].weight}%</span><span>住院${a.outcomes.at(-1).weight}%</span>` : compactEffects(a.effects))}</small>${a.assist ? `<small class="assist-note">${esc(a.assist)}</small>` : ''}${a.outcomes && id !== 'write' ? `<small class="odds">${a.outcomes.slice(1).map(r => `${r.rank}${r.weight}%`).join(' · ')}</small>` : ''}</button>`;
  }).join('')}</div>`).join('');
  const current = getModel(state);
  return `<section class="panel actions-panel screen-pane" data-pane="actions"><div class="panel-heading"><h2>${icon('Coffee')} 安排今天</h2><span class="action-pips">剩余 ${state.ap} / 2 次</span></div>${pageFrame(`${projectEntry()}${rows}<button class="compact-model" data-ui="models">${icon('Cpu')}<span>${current ? `<b>${esc(current.name)} · 至第 ${state.modelUntil} 天</b><small>工作 +¥${current.work} / 学习 +${current.learn} / 研发债 ${current.build}</small>` : '找 AI 搭子 · 加成会写在行动里'}</span>${icon('ChevronRight')}</button><button class="compact-company" data-ui="company">属性与成长 · 技能 ${state.skill} · 口碑 ${state.reputation} · 压力 ${state.stress}</button>`, '行动', 'action-pages')}</section>`;
}

function companyPanel() {
  return `<section class="panel company-panel"><div class="panel-heading"><h2>${icon('Box')} 你的底气</h2><span>${ROLES.find(r => r.id === state.role).name}</span></div><div class="skill-row"><span>技能 <b>${state.skill}</b></span><span>口碑 <b>${state.reputation}</b></span><span>技术债 <b class="${state.techDebt >= 50 ? 'negative' : ''}">${state.techDebt}</b></span></div><div class="product-line"><span>${icon('PackagePlus')} 已上线 <b>${state.products}</b> 个小产品</span><b class="positive">+${money(productIncome(state))}<small> / 今天</small></b></div><div class="product-progress">${[0, 1, 2].map(n => `<span class="${n < state.progress ? 'done' : ''}"></span>`).join('')}<small>下个产品 ${state.progress}/3</small></div><p class="company-note">技术债会吃掉产品收益。每份收入背后，都得有个活人维护。</p><div class="company-bottom"><span>仓库存货估值 <b>${money(inventoryValue(state))}</b></span><button data-ui="expand" ${state.capacity >= 58 ? 'disabled' : ''}>${icon('HardDrive')} 扩仓</button></div></section>`;
}

function travelPanel() {
  const l = LOCATIONS.find(l => l.id === (nextStation ?? nextStop(state))), fare = state.day === 40 ? 0 : travelFare(state, l.id);
  return `<footer class="day-end"><div class="destination"><span class="destination-label">${state.day === 40 ? '最后一天' : fare ? '已选打车' : '免费路线'}</span>${state.day === 40 ? '<strong>清账后看输赢</strong>' : `<button class="map-button" data-ui="map" aria-label="选择目的地，当前${esc(l.name)}">${icon('Map')}<span><b>${esc(l.name)}</b><small>${fare ? '车费 ¥120 · 可改回免费' : '点地图可打车 / 原地'}</small></span></button>`}</div><div class="day-end-note"><b>${state.ap ? `还可行动 ${state.ap} 次` : '安排完成，可以收工'}</b><span>${state.project ? `项目 ${state.project.progress}/${state.project.need} · 第 ${state.project.due} 天截止` : state.event ? '未处理遭遇将在收工时略过' : state.day === 40 ? '扣费 → 清仓 → 自动还债' : esc(l.specialty)}</span></div><button class="primary end-day-button ${!state.ap ? 'cta' : ''}" data-ui="${state.day === 40 ? 'finish' : 'end-day'}">${state.day === 40 ? '结算输赢' : `收工 → ${esc(l.name)}`} ${icon('ArrowRight')}</button><div class="day-bill"><span>今晚：生活 −${money(dailyCost(state))} · 利息 +${money(dailyInterest(state))} 债务${fare ? ` · 车费 −${money(fare)}` : ''}${state.products ? ` · 产品 +${money(productIncome(state))}` : ''}</span><button class="inline-link" data-ui="bill">账单详情</button></div></footer>`;
}

function dangerHint() {
  if (state.stress >= 70) return `危险：压力 ${state.stress}/100，再涨 ${100 - state.stress} 就出局。${state.ap ? '先安排休息。' : '看看今日风向里有没有减压的大佬。'}`;
  if (state.health <= 25) return `危险：健康 ${state.health}/100，降到 0 就出局。${state.ap ? '先休息回血。' : '收工也会消耗健康。'}`;
  if (state.debt >= 40000) return '危险：欠款超过 ¥50,000 就出局，先卖货还债。';
  return '';
}
function game() {
  const step = state.ap ? 2 : 3, news = getNews(state), rumor = getRumor(state), q = questProgress(state);
  return `<div class="game-content" data-active-pane="${activePane}" data-step="${step}">${stats()}<div class="flow-guide"><div><div class="goal-row"><button class="goal-button" data-ui="goals">${state.debt ? `通关：还欠 ${money(state.debt)} · 剩 ${41 - state.day} 天` : '债已清！守住健康，撑到第 40 天'} ${icon('CircleHelp')}</button>${rentDue(state) ? `<button class="rent-chip cta" data-ui="rent">${icon('House')} 房租日：收工前交 ${money(rentDue(state))}</button>` : ''}${state.perks.length ? `<span class="perk-strip" aria-label="已装外挂">${state.perks.map(id => { const p = PERKS.find(p => p.id === id); return `<img src="/art/perks/${id}.webp" alt="${esc(p.name)}" title="${esc(`${p.name}：${p.desc}`)}" width="22" height="22">`; }).join('')}</span>` : ''}</div><span id="next-step" class="${dangerHint() ? 'survival-warning' : ''}" role="status">${dangerHint() || (state.project?.change === 'pending' ? '客户加需求了，去项目板谈范围；其他安排照常。' : state.project && state.project.progress >= state.project.need && state.project.change !== 'waiting' ? '项目做完了，去项目板验收收款。' : projectExpiry(state) ? '项目今天到期，记得在收工前交付。' : state.ap ? `今天还有 ${state.ap} 次行动：做项目、零工或给自己充电。` : '看看持仓和项目截止日，再决定明天去哪。')}</span>${q ? `<span class="quest-chip ${q.done ? 'done' : ''}" title="收工时检查，完成就发奖励">${q.done ? '✓' : '委托'} ${esc(q.title)} · ${q.track === 'calm' ? `当前 ${q.value}` : `${Math.max(0, q.value)}/${q.need}`} · 奖 ${esc(effectText(q.reward))}</span>` : ''}</div><ol class="day-steps" aria-label="每日流程"><li>看新闻</li><li ${step === 2 ? 'aria-current="step"' : ''}>选安排</li><li ${step === 3 ? 'aria-current="step"' : ''}>${state.day === 40 ? '结算' : '收工'}</li></ol></div><button class="news-ticker ${rumor ? 'breaking' : ''}" data-ui="news">${icon('ReceiptText')}<span><b>小报</b> ${esc(news.title)}</span>${icon('ChevronRight')}</button><nav class="pane-tabs" aria-label="游戏面板">${[['actions', `安排 ${state.ap}/2`], ['market', '交易所'], ['event', state.draft ? '外挂 · 三选一' : '今日风向']].map(([id, label]) => `<button data-ui="show-pane" data-pane="${id}" aria-pressed="${activePane === id}">${label}</button>`).join('')}</nav><div class="play-grid">${eventPanel()}${actionPanel()}${marketPanel()}</div>${travelPanel()}</div>`;
}

function goals() {
  openModal('通关规则 · 你要赢下什么', `<h3>40 天后，账清了，人还在，就赢。</h3><p>第 40 天点“结算输赢”，扣除当日费用、卖出全部库存并自动还债后，<b>欠款为 0、健康大于 0、压力低于 100，即通关成功。</b>提前还清债务后，继续生活到第 40 天。</p><h3>三条出局线</h3><p>健康降到 0；压力达到 100；或欠款超过 ¥50,000。踩到任何一条，立即结束。</p><h3>撑到最后但还有欠款？</h3><p>算“未通关”。有钱、做了多少产品等决定结局称号，不会代替还清欠款这个胜利条件。</p>${state ? `<p>现在第 ${state.day} 天 · 欠款 ${money(state.debt)} · 健康 ${state.health} · 压力 ${state.stress}。</p>` : ''}<h3>每天怎么选</h3><p>看新闻找涨跌 → 两次职业安排 → 交易和还款 → 收工。遭遇是可选支线，回应不耗行动，但会改变标明的数值，部分选择会有后续。不想参与就略过，不影响工作和交易。</p><p>每天默认免费去下一站；地图可选留在原地，或花 ¥120 打车跳站。热点价差、角色专长与 AI 搭子能提高收入，休息和提前还款能减少消耗。</p>`);
}

function ending() {
  const e = state.ending, reason = failureReason(state), failure = state.failure;
  const value = v => reason?.key === 'debt' ? money(v) : v;
  const summary = reason ? `<div class="failure-summary"><span class="ending-kicker">第 ${state.day} / 40 天 · 提前出局</span><h1>${reason.title}</h1><p class="failure-meter">${reason.label} <b>${failure?.key === reason.key ? `${value(failure.before)} → ` : ''}${value(state[reason.key])}</b></p><p>${reason.rule}</p></div><p class="failure-trigger">${failure ? `<b>最后一步：</b>${esc(failure.source)}` : '旧存档未记录最后一步的数值变化；本次出局原因可由最终状态确认。'}</p><p class="failure-advice"><b>下次怎么躲：</b>${reason.advice}</p><p class="ending-subtitle">结局称号：${esc(e.title)} · ${esc(e.subtitle)}</p>` : `<span class="ending-kicker">第 ${state.day} / 40 天</span><div class="victory-label">${gameResult(state)}</div><h1>${esc(e.title)}</h1><p class="ending-subtitle">${esc(e.subtitle)}</p>`;
  return `<div class="ending-screen"><div class="ending-receipt">${pageFrame(`${summary}<div class="receipt-total"><span>最终净资产</span><strong>${money(netWorth(state))}</strong></div>${lastRank ? `<div class="ending-rank">本机第 ${lastRank} 名 · 全服排名需提交成绩</div>` : ''}<div class="ending-role">${roleArt(state.role)}<span><b>${esc(ROLES.find(r => r.id === state.role).name)}</b></span></div>${failure?.detail ? `<p><b>这一步发生了什么：</b>${esc(failure.detail)}</p>` : ''}${(() => { const p = personaFor(state), st = state.stats, top = Object.entries(st?.visits ?? {}).sort((a, b) => b[1] - a[1])[0], g = id => GOODS.find(x => x.id === id)?.short ?? id; return `<section class="year-report"><small>浮生年度报告 · 你的 AI 浮生人格</small><h2>${esc(p.title)}</h2><p>${esc(p.text)}</p><ul>${st?.best ? `<li>最赚一笔：${esc(g(st.best.id))} <b class="positive">+${money(st.best.profit)}</b></li>` : '<li>最赚一笔：你没倒过货，清清白白。</li>'}${st?.worst && st.worst.profit < 0 ? `<li>最痛一刀：${esc(g(st.worst.id))} <b class="negative">−${money(-st.worst.profit)}</b></li>` : ''}<li>暴击 <b>${st?.crits ?? 0}</b> 次 · 翻车 <b>${st?.flops ?? 0}</b> 次${st?.hospital ? ` · 住院 <b>${st.hospital}</b> 次` : ''}${st?.viral ? ` · 十万加 <b>${st.viral}</b> 篇` : ''}</li>${top ? `<li>最常出没：${esc(LOCATIONS.find(l => l.id === top[0]).name)}（${top[1]} 天）</li>` : ''}<li>交付跨日项目 <b>${state.projectsDone}</b> 单</li><li>房租：按时 <b>${st?.rentPaid ?? 0}</b> 次 · 拖欠 <b>${st?.rentLate ?? 0}</b> 次 · 外挂 <b>${state.perks?.length ?? 0}</b> 张</li></ul></section>`; })()}<dl class="receipt-stats"><div><dt>手头现金</dt><dd>${money(state.cash)}</dd></div><div><dt>剩余债务</dt><dd>${money(state.debt)}</dd></div><div><dt>健康 / 压力</dt><dd>${state.health} / ${state.stress}</dd></div><div><dt>小产品 / 接单数</dt><dd>${state.products} / ${state.jobsDone}</dd></div><div><dt>累计利息</dt><dd>${money(state.totalInterest)}</dd></div><div><dt>认真休息过</dt><dd>${state.daysRested} 次</dd></div></dl><p class="ending-text">${esc(e.text)}</p><div class="receipt-bottom">AI 浮生记 · 模型还会升级。你先好好吃顿饭。</div>`, '结局')}</div><div class="ending-actions"><button class="primary" data-ui="submit-score">${icon('Trophy')} 提交全服排行</button><button data-ui="leaderboard">${icon('Users')} 看全服榜</button><button data-ui="new">${icon('RotateCcw')} 换种活法</button><button data-ui="copy-result">${icon('Copy')} 复制结局</button><button data-ui="result-image">${icon('Download')} 保存结局卡</button><button data-ui="journal">${icon('NotebookPen')} 回看账本</button></div></div>`;
}

function render() { app.innerHTML = chrome(!state ? welcome() : state.status === 'ended' ? ending() : game()); layoutPages(app); }

function startGame() { addRun(newGame(pickedRole)); }

function trade(id, type) {
  const g = GOODS.find(g => g.id === id); if (!g || !state) return;
  let affordable = 0; while (type === 'buy' && affordable < state.capacity - usedSpace(state) && buyCost(state, id, affordable + 1) <= state.cash) affordable++;
  const maximum = type === 'buy' ? affordable : state.inventory[id].qty;
  if (maximum < 1) return;
  tradeContext = { id, type, maximum };
  openModal(`${type === 'buy' ? '买入' : '卖出'} · ${g.name}`, `<p class="trade-description">${g.desc}</p><div class="quote"><span>每${g.unit}${type === 'buy' ? '买入' : '回收'}价</span><b>${money(type === 'buy' ? buyPrice(state, id) : salePrice(state, id))}</b></div><label class="input-label" for="quantity">交易数量（最多 ${maximum} ${g.unit}）</label><div class="quantity-row"><button data-qty="-1" aria-label="减少数量">−</button><input id="quantity" type="number" min="1" max="${maximum}" step="1" value="1" inputmode="numeric"><button data-qty="1" aria-label="增加数量">+</button><button id="quantity-max">全部</button></div><input class="quantity-range" aria-label="调整数量" type="range" min="1" max="${maximum}" value="1"><div id="trade-total" class="trade-total"></div><div class="modal-actions"><button data-ui="close-modal">取消</button><button class="primary" id="trade-submit">确认${type === 'buy' ? '买入' : '卖出'}</button></div><p class="muted">买卖不消耗行动。同日反复买卖会损失价差。</p>`);
  tradeContext = { id, type, maximum };
  const input = document.querySelector('#quantity'), range = document.querySelector('.quantity-range');
  const update = () => {
    const qty = Number(input.value), valid = Number.isInteger(qty) && qty >= 1 && qty <= maximum;
    if (valid) range.value = qty;
    document.querySelector('#trade-submit').disabled = !valid;
    const total = valid ? (type === 'buy' ? buyCost(state, id, qty) : sellIncome(state, id, qty)) : 0;
    document.querySelector('#trade-total').textContent = valid ? `${type === 'buy' ? '合计支出' : '合计到账'} ${money(total)}（均价 ${money(total / qty)}${qty > 1 ? `，${type === 'buy' ? '买' : '卖'}得越多${type === 'buy' ? '越贵' : '越便宜'}` : ''}）` : '请输入有效的整数数量';
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
  openModal('培训贷 · 把账还给过去', `<div class="finance-numbers"><span>欠款 <b>${money(state.debt)}</b></span><span>现金 <b>${money(state.cash)}</b></span></div><p>日息 1.8%，今天将新增 ${money(dailyInterest(state))} 欠款。还款不消耗行动，记得留生活费。</p><label class="input-label" for="repayment">还款金额</label><input id="repayment" type="number" min="1" max="${max}" step="1" value="${Math.min(1000, max)}" inputmode="numeric"><div class="modal-actions"><button id="repay-max" ${!max || state.status === 'ended' ? 'disabled' : ''}>尽可能还清</button><button class="primary" id="repay" ${!max || state.status === 'ended' ? 'disabled' : ''}>确认还款</button></div><hr><h3>应急周转</h3><p class="muted">借 ¥1,500，每 5 天限一次，全局最多 ¥6,000；也按日息 1.8% 计入债务。</p><button id="borrow" ${state.status === 'ended' || state.day - state.lastBorrowDay < 5 || state.borrowed >= 6000 || state.debt + 1500 > 20000 ? 'disabled' : ''}>查看借款确认</button>`);
  document.querySelector('#repay').onclick = () => { if (dispatch({ type: 'repay', amount: Number(document.querySelector('#repayment').value) })) closeModal(); };
  document.querySelector('#repay-max').onclick = () => { document.querySelector('#repayment').value = max; };
  document.querySelector('#borrow').onclick = () => { openModal('确认借入 ¥1,500', '<p>借款会增加债务。单这笔本金，每天新增约 ¥27 利息，之后利息也计息。</p><div class="modal-actions"><button data-ui="close-modal">先不借</button><button id="confirm-borrow">确认借款</button></div>'); document.querySelector('#confirm-borrow').onclick = () => { if (dispatch({ type: 'borrow' })) closeModal(); }; };
}

function travel(location) {
  if (!state) return;
  const target = LOCATIONS.find(l => l.id === location);
  if (!target) return;
  const fare = travelFare(state, location);
  const go = () => { closeModal(); dispatch({ type: 'travel', location }); };
  const owed = rentDue(state), projectDue = projectExpiry(state);
  if (state.ap > 0 || owed || state.draft || projectDue) {
    openModal(`去${target.name} · 过一天`, `${projectDue ? '<p class="rent-warning">项目今天到期，还没交付。现在收工将失去项目款，口碑 −6、压力 +10。</p>' : ''}${owed ? `<p class="rent-warning">房租 ${money(owed)} 还没交！收工后会记 ${money(Math.round(owed * 1.5))} 欠款，压力 +12，口碑 −3。</p>` : ''}${state.draft ? '<p class="rent-warning">外挂还没挑，收工后这三张卡作废。</p>' : ''}<p>${state.ap ? `今天还有 <b>${state.ap} 格行动</b>没用。现在出发，这些行动会作废。` : '今天的事做完了。'}${state.event ? '未处理遭遇会略过，不自动代选。' : ''}</p><p>${fare ? `打车 ${money(fare)}。` : '免费到站。'}日结：生活与工具 ${money(dailyCost(state))}，新增利息 ${money(dailyInterest(state))}，产品收入 ${money(productIncome(state))}。</p><div class="modal-actions"><button data-ui="close-modal">再做点事</button><button class="primary" id="confirm-travel">结束今天，出发</button></div>`);
    document.querySelector('#confirm-travel').onclick = go;
  } else go();
}

function journal() {
  const s = state ?? saved;
  if (!s) { notify('人生还没开局，账本暂时是空的。'); return; }
  openModal('生存日记 · 每一笔都算数', `<div class="ledger-summary"><span>净资产 <b>${money(netWorth(s))}</b></span><span>交易净盈亏 <b>${money(s.tradeProfit)}</b></span><span>已付/计提利息 <b>${money(s.totalInterest)}</b></span></div>${pageFrame(s.journal.map(j => `<div class="journal-row"><span>DAY ${String(j.day).padStart(2, '0')}</span><p>${esc(j.text)}</p></div>`).join(''), '账本')}`, true);
}

function help() {
  openModal('生存指南 · 边玩边学', pageFrame(`<div class="help-step"><b>先看顶部目标，再挑今天的安排。</b><p>重点操作会标出来：开局、建议的行动、收工、早报里的“开始今天”。不想照做也可以，别的按钮都能点。</p></div><div class="help-step"><b>40 天内还清欠款，活着收工。</b><p>健康归零、压力到 100，或债务超过 ¥50,000 会提前结束。所有行动都是游戏数值。</p></div><div class="help-step"><b>五种身份，五种活法</b><p>程序员接单多、熬夜少欠技术债；AI 自媒体写稿 +50%、爆款率高；一人公司产品赚得多、研发便宜，但欠得也多；打工人抗压；应届生学得快、签模型半价，但最穷。</p></div><div class="help-step"><b>遭遇是可选支线</b><p>可以先工作、交易，也可回应或略过；回应不花行动，但改变标明的数值。未处理遭遇收工时略过。长事件点“继续阅读”翻页，每个选项都写明代价；有概率的选项也标明结果。</p></div><div class="help-step"><b>跨日项目 · 今天的承诺影响明天</b><p>项目板每天两单，同时只接一单。签约不发钱，每次制作占一次行动并花成本，第二天客户加需求。缩范围少赚钱；口碑 40 可加价延期；技能 40 或已有产品可复用。做完后手动交付收款，逾期无报酬、口碑 −6、压力 +10。第 38 天后不接新项目。应急零工即时结账，按标准报价 70% 发放。</p></div><div class="help-step"><b>② 两次行动</b><p>接单赚现金，休息恢复健康、降低压力。写稿发帖是抽卡：可能 10 万+，也可能被限流、抽出六指图，甚至熬夜住院，概率都写在格子上。学习涨技能；研发 3 次上线 1 个产品，每天自动收收入，技术债会降低收益。</p></div><div class="help-step"><b>交易和还款都不耗行动</b><p>随时可低买高卖、还债、租模型，不必先处理遭遇。回收价低于买价 10%，同日倒手会亏钱。别把生活费全压进库存。</p></div><div class="help-step"><b>③ 结束今天</b><p>收工默认免费去下一站；地图可选留在原地，或花 ¥120 打车跳站。每站每天从 20 种货里轮换 8 种，至少两种受当天新闻影响（首日固定货架、平静新闻除外），价格也不同；去过的地方会在地图上记下当时哪些便宜、哪些贵。生活费约 ¥110–150，加产品维护；债务日息 1.8%。到站后有一份早报：可能领到发布会车马费、黑客松奖金，也可能被房东涨租；还有当天头条和“本站突发”暴涨暴跌。</p></div><div class="help-step"><b>今日风向 · 追着大佬跑</b><p>大佬每隔 5–7 天才到访一次，仅停留一天；提前一天在地图上预告（头像带“明”字）。普通日子没有大佬，收工后现场加成结束，已领道具保留。大佬会改变当地甚至全城的价格：黄仁勋到算力黑市，显卡便宜；梁文峰凌晨发模型，全城显卡涨价、接单多赚。你在大佬在场时到达那一站，就能领到道具，比如“白饭钢盆”让下 2 次接单各多赚 ¥300。</p></div><div class="help-step"><b>市场深度</b><p>同一天在同一站卖得越多，卖价越低（每件 −2.5%，最多 −40%）；买得越多，买价越高。囤了一仓货，最好分几站卖。第二天会恢复。</p></div><div class="help-step"><b>外挂三选一</b><p>第 5、12、19、26、33 天会给你三张外挂卡，挑一张，整局生效：青轴键盘让接单多赚，降噪耳机少涨压力，黄牛名片买得更便宜……五张凑一起，就是你这局的流派。收工前不选就作废。</p></div><div class="help-step"><b>房租日 · BOSS 战</b><p>第 10、20、30 天房东上门，分别收 ¥1,200 / ¥2,000 / ¥3,000。点顶部红色“房租日”按钮交租；收工前没交，1.5 倍记进欠款，压力和口碑也会掉。</p></div><div class="help-step"><b>每日委托、成就和排行</b><p>从第 2 天起，顶部会给一个当天小目标，比如“今天倒货赚 ¥500”，收工时达成就发奖励。成就和本机排行榜在菜单“成就”里，只存在这台设备上。仓库满了可以在交易所点“扩仓”，花钱不占行动。</p></div><div class="help-step"><b>第 40 天手动结算</b><p>最后一天仍可行动和交易。确认后按回收价清仓，扣当天费用，再自动还债。</p></div><div class="help-step"><b>看不下的内容，点按钮翻页。</b><p>小屏幕用“事件 / 交易所 / 行动”切换，当前目标和结束今天按钮始终可见；不用上下左右滑动。进度保存在本机，“存档”可切换最多六个独立对局，也能导出或导入。</p></div><div class="help-step"><b>关于本作</b><p>原创 ${EVENTS.length} 个日常事件、${Object.keys(MILESTONES).length} 个阶段剧情。人物情节为虚构恶搞，无需 API key，不调用付费模型。</p><p>灵感来自 <a href="https://github.com/chrisguo/beijing_fushengji" target="_blank" rel="noopener">郭祥昊《北京浮生记》</a>，未使用原版代码或素材。</p></div><div class="modal-actions"><button data-ui="support">打赏支持</button><button data-ui="follow">关注作者</button><button data-ui="news" ${!state ? 'disabled' : ''}>今日快讯</button></div>`, '玩法'), true);
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
  if (!persist()) { render(); notify(saveError, true); }
  const rows = library.slots.map(slot => {
    const run = slot.state, role = ROLES.find(r => r.id === run.role);
    return `<article class="save-slot"><b>${esc(role.name)} · 第 ${run.day} 天${slot.id === library.active ? ' · 当前' : ''}</b><small>${esc(getLocation(run).name)} · 现金 ${money(run.cash)} · ${gameResult(run)}</small><div class="modal-actions"><button data-slot-load="${esc(slot.id)}" ${slot.id === library.active && state ? 'disabled' : ''}>继续这局</button><button data-slot-delete="${esc(slot.id)}">删除这局</button></div></article>`;
  });
  openModal('存档 · 多种人生', pageFrame(`<p>最多保留 ${MAX_SLOTS} 个独立对局（${library.slots.length}/${MAX_SLOTS}）。新开局和导入另存一局；切换前自动保存。</p>${rows.join('')}<div class="modal-actions"><button data-ui="export">${icon('Download')} 导出当前局</button><label class="file-button">${icon('Upload')} 导入为新存档<input id="import-file" type="file" accept=".json,application/json"></label>${libraryLocked ? '<button id="export-raw">导出原始数据备份</button>' : ''}</div><p class="muted">只保存在当前浏览器，不会自动上传。</p>`, '存档'));
  if (libraryLocked) document.querySelector('#export-raw').onclick = () => {
    try { download(localStorage.getItem(SLOTS_KEY) || localStorage.getItem(SAVE_KEY) || '', 'AI浮生记-原始存档备份.json'); } catch { notify('浏览器不允许读取原始存档。', true); }
  };
  for (const button of modal.querySelectorAll('[data-slot-load]')) button.onclick = () => {
    if (!persist()) { render(); notify(saveError, true); return; }
    const slot = library.slots.find(s => s.id === button.dataset.slotLoad);
    if (!slot || !storeLibrary({ ...library, active: slot.id })) { notify(saveError, true); return; }
    state = slot.state; saved = state; activePane = 'actions'; nextStation = null; lastRank = null; closeModal(); render();
  };
  for (const button of modal.querySelectorAll('[data-slot-delete]')) button.onclick = () => {
    const id = button.dataset.slotDelete;
    openModal('删除这局？', '<p>这局的本机进度将被删除。需要保留时，请先切换到这局并导出。</p><div class="modal-actions"><button data-ui="close-modal">取消</button><button id="confirm-delete">确认删除</button></div>');
    document.querySelector('#confirm-delete').onclick = () => {
      const wasActive = library.active === id;
      const slots = library.slots.filter(s => s.id !== id), active = library.active === id ? slots[0]?.id ?? null : library.active;
      if (!storeLibrary({ version: 1, active, slots })) { notify(saveError, true); return; }
      saved = slots.find(s => s.id === active)?.state ?? null;
      if (wasActive) state = null;
      closeModal(); render(); saveDialog();
    };
  };
  document.querySelector('#import-file').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 250000) { notify('存档过大，请选择游戏导出的 JSON 文件。', true); return; }
    try {
      const imported = parseSave(await file.text());
      if (!imported) { notify('存档格式不正确或版本不兼容，当前进度未改变。', true); return; }
      addRun(imported);

    } catch { notify('文件读取失败，请重新选择存档。', true); }
  };
}

function resultImage() {
  if (!state || state.status !== 'ended') return;
  const c = document.createElement('canvas'); c.width = 1000; c.height = 1240;
  const x = c.getContext('2d'); x.fillStyle = '#176764'; x.fillRect(0, 0, 1000, 1240); x.fillStyle = '#fffced'; x.fillRect(65, 65, 870, 1110);
  x.fillStyle = '#25392f'; x.font = '28px sans-serif'; x.fillText('AI 浮生记 · 人生结算单', 120, 140); x.font = '22px monospace'; x.fillText(`DAY ${state.day} / 40 · ${gameResult(state)}`, 120, 200);
  x.font = 'bold 56px sans-serif'; x.fillText(state.ending.title, 120, 310, 760); x.font = '25px sans-serif'; x.fillText(failureReason(state)?.rule ?? state.ending.subtitle, 120, 370, 760); x.fillStyle = '#9a6a00'; x.font = 'bold 26px sans-serif'; x.fillText(`AI 浮生人格：${personaFor(state).title}`, 120, 405, 760); x.fillStyle = '#25392f';
  x.strokeStyle = '#9a9e8f'; x.setLineDash([8, 8]); x.beginPath(); x.moveTo(120, 430); x.lineTo(880, 430); x.stroke();
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
    projects: projectDialog,
    'project-command': () => {
      const id = b.dataset.id;
      const run = () => { if (dispatch({ type: 'project', id }) && state.status === 'playing') projectDialog(); };
      if (id === 'cancel') {
        openModal('退出这个项目？', '<p>收不到项目款，已投入的工时与制作成本不退。口碑 −3，压力 +4。</p><div class="modal-actions"><button data-ui="projects">继续做项目</button><button id="confirm-cancel-project">确认退出</button></div>');
        document.querySelector('#confirm-cancel-project').onclick = run;
      } else run();
    },
    start: startGame, resume: () => { state = saved; activePane = 'actions'; nextStation = null; render(); },
    new: () => { if (state?.status === 'playing') { openModal('暂时放下这一局', '<p>当前局会保留，新开局将另存一局。可在“存档”里随时切回来。</p><div class="modal-actions"><button data-ui="close-modal">继续这一局</button><button id="back-to-welcome">返回角色选择</button></div>'); document.querySelector('#back-to-welcome').onclick = () => { if (!persist()) { render(); notify(saveError, true); return; } closeModal(); state = null; render(); }; } else { state = null; render(); } },
    'home-screen': () => { if (modal.open) closeModal(); window.scrollTo({ top: 0, behavior: 'auto' }); },
    choose: () => dispatch({ type: 'choose', index: Number(b.dataset.index), stance: Number(document.querySelector('#stance')?.value ?? state.stance) }),
    'show-pane': () => { activePane = b.dataset.pane; document.querySelector('.game-content').dataset.activePane = activePane; document.querySelectorAll('.pane-tabs button').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.pane === activePane))); layoutPages(app); },
    'end-day': () => travel(nextStation ?? nextStop(state)),
    'ignore-event': () => dispatch({ type: 'ignore-event' }),
    goals: () => goals(),
    company: () => openModal('属性与成长', pageFrame(attributeGuide(state).map(a => `<article class="help-step"><b>${esc(a.label)}</b><p>${esc(a.text)}</p></article>`).join('') + companyPanel(), '档案')),
    sfx: () => { setSfx(!sfxEnabled()); b.setAttribute('aria-pressed', String(sfxEnabled())); b.innerHTML = `${icon(sfxEnabled() ? 'Volume2' : 'VolumeX')}<span>${sfxEnabled() ? '音效开' : '静音'}</span>`; if (sfxEnabled()) sfx.coins(300); },
    'pick-role': () => { pickedRole = b.dataset.id; sfx.pop(); render(); document.querySelector(`.role-tab[data-id="${pickedRole}"]`)?.focus({ preventScroll: true }); },
    news: () => openNews(),
    'news-market': () => { closeModal(); activePane = 'market'; render(); },
    'news-actions': () => { closeModal(); activePane = 'actions'; render(); },
    'good-info': () => { const g = GOODS.find(g => g.id === b.dataset.id); openModal(g.name, `<p>${g.desc}</p><p>当前买入 ${money(state.prices[g.id])} / ${g.unit}，回收 ${money(salePrice(state, g.id))}。平常约 ${money(referencePrice(state, g.id))}，今天算<b>${priceHeat(state, g.id).label}</b>。</p><p>持仓 ${state.inventory[g.id].qty}，成本 ${money(state.inventory[g.id].cost)}。买卖不消耗行动。</p>`); },
    gallery, models: modelSquare, 'meme-detail': () => memeDetail(b.dataset.id),
    support: () => openModal('打赏支持', '<p>游戏永久免费。觉得好玩，可以请作者喝杯咖啡。</p><img class="community-qr" src="/community/support.png" alt="作者打赏二维码">'),
    follow: () => openModal('关注向阳乔木', '<p>微信公众号：向阳乔木推荐看</p><img class="community-qr" src="/community/follow.jpg" alt="向阳乔木推荐看公众号二维码"><p class="community-links"><a href="https://github.com/joeseesun/ai-fushengji" target="_blank" rel="noopener">游戏源码</a><a href="https://x.com/vista8" target="_blank" rel="noopener">X / Twitter</a></p>'),
    'hire-model': () => { if (dispatch({ type: 'model', id: b.dataset.id })) closeModal(); },
    action: () => dispatch({ type: 'action', id: b.dataset.id }),
    expand: () => { openModal('扩仓 · 能囤更多货', `<p>仓库决定你最多能同时囤多少件货。现在 <b>${usedSpace(state)}/${state.capacity}</b> 件。</p><p>扩仓后上限 <b>${state.capacity} → ${state.capacity + 10}</b> 件，花 <b>${money(expandCost(state))}</b>，不占行动次数。最多扩到 58 件。</p><p class="muted">适合发现“跳水”货想多囤一些的时候。空着的仓库不会生钱。</p><div class="modal-actions"><button data-ui="close-modal">先不扩</button><button class="primary cta" id="confirm-expand" ${state.cash < expandCost(state) ? 'disabled' : ''}>花 ${money(expandCost(state))} 扩仓</button></div>`); document.querySelector('#confirm-expand').onclick = () => { if (dispatch({ type: 'expand' })) closeModal(); }; },
    map: () => openMap(),
    perk: () => { if (dispatch({ type: 'perk', id: b.dataset.id })) { sfx.jackpot(); activePane = 'actions'; render(); } },
    rent: () => dispatch({ type: 'rent' }),
    'map-pick': () => { mapStation = b.dataset.id; drawMapDetail(); },
    'map-go': () => { nextStation = mapStation; closeModal(); render(); },
    achievements: () => openAchievements(),
    leaderboard: () => openLeaderboard({ state: state ?? saved, openModal, esc, money }),
    'submit-score': () => submitScore({ state: state ?? saved, openModal, esc, money }),
    buy: () => trade(b.dataset.id, 'buy'), sell: () => trade(b.dataset.id, 'sell'), travel: () => travel(b.dataset.id),
    finish: () => { openModal('结算这 40 天', `<p>今天还剩 ${state.ap} 格行动。${state.project ? '项目尚未交付，结算将失去项目款，口碑 −6、压力 +10。' : ''}确认后扣最后一天费用，按当前回收价清仓，再自动还债；债务清零且人还在即通关。未处理遭遇会略过。</p><div class="modal-actions"><button data-ui="close-modal">再想想</button><button class="primary" id="confirm-finish">确认结算</button></div>`); document.querySelector('#confirm-finish').onclick = () => { closeModal(); dispatch({ type: 'finish' }); window.scrollTo(0, 0); }; },
    finance, help, journal, save: saveDialog, export: exportSave, boss,
    'close-modal': closeModal, 'result-image': resultImage,
    'copy-result': async () => { const text = shareText(state); try { await navigator.clipboard.writeText(text); notify('结局已复制。'); } catch { openModal('复制我的结局', `<label for="share-copy">浏览器未允许自动复制，请选中复制：</label><textarea id="share-copy" readonly>${esc(text)}</textarea>`); document.querySelector('#share-copy').select(); } },
    bill: () => openModal('今日账单 · 今晚才结算', `<dl class="bill-list">${state.day < 40 ? `<div><dt>去${esc(LOCATIONS.find(l => l.id === (nextStation ?? nextStop(state))).name)}的车费</dt><dd>−${money(travelFare(state, nextStation ?? nextStop(state)))}</dd></div>` : ''}<div><dt>生活与工具费</dt><dd>−${money(dailyCost(state))}</dd></div><div><dt>小产品收入</dt><dd>+${money(productIncome(state))}</dd></div><div><dt>新增贷款利息</dt><dd>+${money(dailyInterest(state))} 欠款</dd></div></dl><p>利息计入债务；费用先用现金与产品收入支付，不足部分也转为欠款。仓库里的货不会自动帮你付日常账单。</p><p class="muted">每过一天至少消耗 1 健康，压力到 50 后多消耗 2，压力到 70 后多消耗 5。</p>`),
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

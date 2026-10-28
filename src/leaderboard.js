import { pageFrame, layoutPages } from './pagination.js';
import { ROLES } from './content.js';
import { validProof } from './run-proof.js';

const api = async (path, options = {}) => {
  try {
    const response = await fetch(path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(12000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '榜单暂时不可用，请稍后再试。');
    return data;
  } catch (error) {
    if (error.name === 'TimeoutError' || error instanceof TypeError || error instanceof SyntaxError) throw new Error('暂时连不上全服榜。可以继续玩，成绩还在本机。');
    throw error;
  }
};
const key = s => `ai-fushengji-score-${s.seed}-${s.role}`;
const stored = k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch { /* Server receipt is still shown. */ } };

export async function openLeaderboard(ctx, offset = 0, submittedId = '') {
  const { openModal, esc, money, state } = ctx;
  const mineId = submittedId || (state ? stored(key(state)) : '');
  openModal('全服排行榜 · 人类还在场', `<div class="ranking-tabs"><b>全服排行</b><button data-ui="achievements">本机纪录与成就</button></div>${pageFrame('<p id="ranking-load" role="status">正在连接全服榜…</p>', '榜单', 'ranking-pages')}<div class="ranking-controls"><button id="rank-prev" disabled>上 10 名</button><span id="rank-range"></span><button id="rank-next" disabled>下 10 名</button></div><div class="modal-actions sticky-actions">${state?.status === 'ended' ? '<button class="primary" data-ui="submit-score">提交本局成绩</button>' : '<span class="muted">本局结束后可取昵称上榜。</span>'}<button id="rank-refresh">刷新榜单</button></div>`, true);
  const marker = document.querySelector('#ranking-load'), content = marker.parentElement;
  document.querySelector('#rank-refresh').onclick = () => openLeaderboard(ctx, offset, mineId);
  try {
    const data = await api(`/api/leaderboard?offset=${offset}${mineId ? `&runId=${encodeURIComponent(mineId)}` : ''}`);
    if (!marker.isConnected) return;
    const row = (r, mine = false) => `<article class="global-rank-row ${mine ? 'my-rank' : ''}"><strong>#${r.rank}</strong><div><b>${esc(r.nickname)}${mine ? ' · 本局' : ''}</b><small>${esc(ROLES.find(role => role.id === r.role)?.name ?? r.role)} · 第 ${r.day} 天 · ${r.won ? '通关' : '未通关'}</small><small>${esc(r.ending)}</small></div><b>${money(r.worth)}</b></article>`;
    content.innerHTML = `<p class="rank-rules">通关优先，再比净资产、存活天数。每局一次，共 ${data.total} 局；同分先提交的在前。</p>${data.mine && !data.entries.some(r => r.id === mineId) ? row(data.mine, true) : ''}${data.entries.length ? data.entries.map(r => row(r, r.id === mineId)).join('') : '<div class="ranking-empty"><h3>榜上还没人，江湖等你。</h3><p>完成一局，再用昵称提交。提前出局也能留个名，通关的排在前面。</p></div>'}<p class="muted">成绩由服务器重算。昵称与成绩公开；无需注册。休闲游戏排行，不设奖金。</p>`;
    document.querySelector('#rank-range').textContent = data.total ? `${data.offset + 1}–${Math.min(data.offset + 10, data.total)} / ${data.total}` : '等待第一位玩家';
    const prev = document.querySelector('#rank-prev'), next = document.querySelector('#rank-next');
    prev.disabled = data.offset === 0; next.disabled = data.offset + 10 >= data.total;
    prev.onclick = () => openLeaderboard(ctx, data.offset - 10, mineId);
    next.onclick = () => openLeaderboard(ctx, data.offset + 10, mineId);
    layoutPages(document.querySelector('#modal'));
  } catch (error) {
    if (marker.isConnected) { marker.textContent = error.message; layoutPages(document.querySelector('#modal')); }
  }
}

export function submitScore(ctx) {
  const { state, openModal, esc } = ctx;
  if (!state || state.status !== 'ended') return;
  if (!validProof(state.proof)) {
    openModal('这局先留在本机', '<p>这份存档没有完整的新版本操作记录，服务器无法核验。本机纪录仍保留。</p><p>更新后新开一局，完成结算就能参与全服排行；旧存档可继续游玩。</p><div class="modal-actions"><button data-ui="leaderboard">先看全服榜</button><button class="primary" data-ui="close-modal">知道了</button></div>'); return;
  }
  openModal('用什么名字闯进全服榜？', `${pageFrame(`<form id="rank-submit"><label class="input-label" for="rank-nickname">昵称（1–20 个字，不用真名）</label><input id="rank-nickname" name="nickname" maxlength="40" autocomplete="off" required value="${esc(stored('ai-fushengji-nickname'))}" placeholder="例如：Token 余额不足"></form><p>点击提交后，昵称、角色、结局和成绩会公开展示。本局操作记录会发送给服务器核算，核算后不保存。</p><p class="muted">每局只上榜一次，提交后不能改昵称。浏览器里的金额不会直接计入排名。</p>`, '上榜说明')}<p id="rank-error" role="status"></p><div class="modal-actions sticky-actions"><button data-ui="close-modal">先不上传</button><button class="primary" type="submit" form="rank-submit" id="rank-submit-button">提交成绩</button></div>`);
  const form = document.querySelector('#rank-submit'), button = document.querySelector('#rank-submit-button'), status = document.querySelector('#rank-error');
  form.onsubmit = async event => {
    event.preventDefault(); if (button.disabled) return;
    const nickname = new FormData(form).get('nickname').trim();
    if (!/^[\p{L}\p{N}\p{Extended_Pictographic}_ ·.-]{1,20}$/u.test(nickname.normalize('NFKC'))) { status.textContent = '昵称用 1–20 个字，可用中文、字母、数字或表情。'; return; }
    button.disabled = true; button.textContent = '正在核算…'; status.textContent = '';
    try {
      const data = await api('/api/leaderboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, run: { ...state.proof, seed: state.seed, role: state.role } }) });
      remember(key(state), data.entry.id); remember('ai-fushengji-nickname', data.entry.nickname);
      if (form.isConnected) openLeaderboard(ctx, 0, data.entry.id);
    } catch (error) {
      if (form.isConnected) { status.textContent = error.message; button.disabled = false; button.textContent = '重新提交'; }
    }
  };
  document.querySelector('#rank-nickname').focus({ preventScroll: true });
}

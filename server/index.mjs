import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { newGame, transition, netWorth, gameResult } from '../src/engine.js';
import { ROLES } from '../src/content.js';
import { RULESET, validProof, cleanCommand } from '../src/run-proof.js';

const file = process.env.LEADERBOARD_DB || './data/leaderboard.sqlite';
mkdirSync(dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY, nickname TEXT NOT NULL, role TEXT NOT NULL,
  worth INTEGER NOT NULL, day INTEGER NOT NULL, won INTEGER NOT NULL,
  ending TEXT NOT NULL, health INTEGER NOT NULL, stress INTEGER NOT NULL,
  ruleset TEXT NOT NULL, created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS scores_rank ON scores(won DESC, worth DESC, day DESC, created, id);`);
const order = 'won DESC, worth DESC, day DESC, created, id';
const list = db.prepare(`SELECT * FROM scores ORDER BY ${order} LIMIT 10 OFFSET ?`);
const count = db.prepare('SELECT COUNT(*) AS total FROM scores');
const get = db.prepare('SELECT * FROM scores WHERE id = ?');
const rank = db.prepare(`SELECT rank FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY ${order}) AS rank FROM scores) WHERE id = ?`);
const insert = db.prepare('INSERT INTO scores VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const limits = new Map();
const hash = value => createHash('sha256').update(value).digest('hex');
const origin = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:5173';
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const withRank = row => row && { ...row, rank: rank.get(row.id).rank };

function rateLimit(req) {
  const write = req.method === 'POST', now = Date.now(), window = write ? 600000 : 60000;
  // Nginx overwrites X-Real-IP; the container port is private. No IP is written to the DB/logs.
  const ip = process.env.TRUST_PROXY === '1' ? req.headers['x-real-ip'] || req.socket.remoteAddress : req.socket.remoteAddress;
  const key = hash(`${ip}:${write}`);
  for (const [id, entry] of limits) if (entry.until <= now) limits.delete(id);
  let bucket = limits.get(key);
  if (!bucket) {
    if (limits.size >= 10000) throw error('服务器有点忙，请稍后再来。', 429);
    bucket = { n: 0, until: now + window }; limits.set(key, bucket);
  }
  if (++bucket.n > (write ? 10 : 120)) throw error('操作太频繁，稍后再试。成绩仍保存在本机。', 429);
}

async function readBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw error('请使用游戏内的提交入口。', 415);
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 100000) throw error('本局记录过长，无法提交；本机记录不受影响。', 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw error('成绩格式不正确。'); }
}

function verify(body) {
  if (!body || typeof body.nickname !== 'string') throw error('先取个昵称再上榜。');
  const nickname = body.nickname.trim().normalize('NFKC');
  if (!/^[\p{L}\p{N}\p{Extended_Pictographic}_ ·.-]{1,20}$/u.test(nickname)) throw error('昵称用 1–20 个字，可用中文、字母、数字或表情。');
  const run = body.run;
  if (!validProof(run) || !run.commands.length || !Number.isSafeInteger(run.seed) || run.seed < 1 || run.seed > 0xffffffff || !ROLES.some(r => r.id === run.role))
    throw error('缺少完整的新版本对局记录。旧存档保留本机排行，新开一局即可参与全服榜。');
  let state = newGame(run.role, run.seed); state.proof = null;
  const start = performance.now();
  for (const raw of run.commands) {
    if (performance.now() - start > 1500) throw error('本局操作过多，暂时无法核验。', 422);
    const result = transition(state, cleanCommand(raw));
    if (result.error) throw error('本局记录无法通过核验，未写入榜单。', 422);
    state = result.state;
  }
  if (state.status !== 'ended') throw error('先完成本局结算，再提交成绩。', 422);
  const id = hash(`${RULESET}:${run.seed}:${run.role}`);
  return { id, nickname, state };
}

const server = createServer(async (req, res) => {
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(data));
  };
  try {
    rateLimit(req);
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/health') return send(200, { ok: true, ruleset: RULESET, total: count.get().total });
    if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
      const offset = Number(url.searchParams.get('offset') || 0), id = url.searchParams.get('runId');
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000 || (id && !/^[a-f0-9]{64}$/.test(id))) throw error('页码不正确。');
      const total = count.get().total, actual = Math.min(offset, Math.max(0, Math.floor((total - 1) / 10) * 10));
      return send(200, { ruleset: RULESET, total, offset: actual, entries: list.all(actual).map((row, i) => ({ ...row, rank: actual + i + 1 })), mine: id ? withRank(get.get(id)) ?? null : null });
    }
    if (req.method === 'POST' && url.pathname === '/api/leaderboard') {
      if (req.headers.origin && req.headers.origin !== origin) throw error('请从游戏页面提交成绩。', 403);
      const { id, nickname, state } = verify(await readBody(req));
      const existing = get.get(id);
      if (existing) return send(200, { entry: withRank(existing), duplicate: true });
      insert.run(id, nickname, state.role, netWorth(state), state.day, Number(gameResult(state) === '通关成功'), state.ending.title, state.health, state.stress, RULESET, new Date().toISOString());
      return send(201, { entry: withRank(get.get(id)), duplicate: false });
    }
    send(404, { error: '没有这个入口。' });
  } catch (err) {
    if (!err.status) console.error('Leaderboard request failed:', err.code || err.name);
    send(err.status || 500, { error: err.status ? err.message : '榜单暂时不可用，成绩仍在本机，请稍后再试。' });
  }
});
server.requestTimeout = 10000; server.headersTimeout = 10000;
server.maxRequestsPerSocket = 100;
server.listen(Number(process.env.PORT || 3491), process.env.HOST || '127.0.0.1', () => console.log(`Leaderboard ready (${RULESET})`));
const shutdown = () => server.close(() => { db.close(); process.exit(0); });
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);

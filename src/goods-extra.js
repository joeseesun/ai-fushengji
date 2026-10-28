// Fictional collectibles, traded with game currency only. Art reuses our own icons.
export const EXTRA_GOODS = [
  { id: 'b300', art: 'compute', name: 'B300 机柜排队票', short: 'B300 排队票', base: 2200, decay: .009, unit: '张', desc: '买不到机柜，先买排队资格。皮衣一挥，前面又多了两万人。只交易游戏里的纸票。' },
  { id: 'mini', art: 'rtx', name: 'Mac mini 养虾套装', short: '养虾套装', base: 1600, decay: .005, unit: '套', desc: '主机、网线、一只还没赚钱的 Claw。附赠“很快回本”贴纸；买卖此货不会自动开通分期。' },
  { id: 'tokens', art: 'claude', name: 'Token 急救包', short: 'Token 包', base: 180, decay: -.003, unit: '包', desc: '当龙虾开始给龙虾开会时使用。包装写着“够用很久”，小字：不含思考、不含重试、不含闲聊。' },
  { id: 'skillbook', art: 'prompt', name: '祖传 SKILL.md', short: '技能秘籍', base: 260, decay: .012, unit: '本', desc: '前三页教 AI 自动完成，最后一页写“以上都失败时，请人工处理”。支持祖传 Ctrl+C。' },
  { id: 'mcp', art: 'workflow', name: 'MCP 万能转接头', short: 'MCP 接头', base: 360, decay: .007, unit: '个', desc: '把旧脚本接到新宇宙。连接成功以后，还需要安装一个连接成功确认器。' },
  { id: 'benchmark', art: 'deck', name: '榜一截图典藏版', short: '榜一截图', base: 120, decay: .025, unit: '张', desc: '评测榜登顶的那一秒，已为你永久保存。横轴另售，有效期截止下一场发布会。' },
  { id: 'memory', art: 'workflow', name: 'Agent 外置记忆', short: '赛博记忆', base: 480, decay: .005, unit: '块', desc: '承诺记住你的一切。今天重新连接时，它问：“你好，请问有什么可以帮你？”' },
  { id: 'tungsten', art: 'minecard', name: 'AI 小卖部钨块', short: '钨块', base: 90, decay: 0, unit: '块', desc: '售货 Agent 的战略囤货。没有用户要买，但拿在手里很有商业模式的重量。' },
];

export const EXTRA_MARKET_FACTORS = {
  router: { tokens: 1.8, memory: 1.25 }, aa: { benchmark: 1.8 },
  b300: { b300: 1.9, minecard: .65 }, local: { mini: 1.7, memory: 1.3 },
  normal: {}, free: { skillbook: .5, benchmark: .7 }, tokens: { tokens: 1.9, mini: .75 },
  data: { memory: 1.7, skillbook: .8 }, video: { tokens: 1.5 },
  open: { mini: 1.4, skillbook: .6 }, privacy: { mini: 1.6, mcp: .55 },
  subsidy: { b300: .65, tokens: .6 }, agents: { mcp: 1.8, memory: 1.5 },
  slop: { benchmark: .5, skillbook: .65 }, enterprise: { skillbook: 1.6, mcp: 1.4, tungsten: 1.5 },
  human: { mcp: .75 }, ban: { tokens: 1.6, mini: 1.3 },
  'claude-new': { tokens: 1.7, benchmark: 1.4 }, 'invite-mania': { benchmark: 1.6 },
  'side-hustle': { mini: 1.6, skillbook: 1.7 },
};
export const EXTRA_STATION_FACTORS = {
  market: { b300: .7, mini: .8, tokens: .8 },
  launch: { b300: 1.35, benchmark: 1.7, tungsten: 1.3 },
  jobs: { tokens: 1.35, mcp: 1.4, memory: 1.2 },
  course: { skillbook: 1.7, benchmark: 1.4 },
  opensource: { skillbook: .6, mcp: .7, memory: .8 },
  stream: { benchmark: 1.5, tokens: 1.2 },
  hackathon: { mini: 1.3, mcp: 1.25, tokens: 1.3 },
  home: { mini: .8, tungsten: .65, memory: 1.2 },
};

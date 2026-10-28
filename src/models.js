import snapshot from './model-snapshot.json' with { type: 'json' };

// Contract effects are fictional game balance, never a real capability ranking.
export const MODEL_DATE = '2026-10-28';
export const PROFILES = {
  code: { label: '代码搭子', fee: 180, work: 95, learn: 1, build: -2, blurb: '接单 +¥95 · 学习额外 +1 技能 · 研发少 2 技术债' },
  think: { label: '思考搭子', fee: 140, work: 55, learn: 3, build: -1, blurb: '接单 +¥55 · 学习额外 +3 技能 · 研发少 1 技术债' },
  fast: { label: '快嘴搭子', fee: 90, work: 75, learn: 1, build: 0, blurb: '接单 +¥75 · 学习额外 +1 技能' },
  open: { label: '本地搭子', fee: 70, work: 45, learn: 2, build: -1, blurb: '接单 +¥45 · 学习额外 +2 技能 · 研发少 1 技术债' },
  agent: { label: 'Agent 搭子', fee: 240, work: 140, learn: 0, build: 0, blurb: '接单 +¥140 · 7×24 替你干活，不涨技能' },
};
const families = [
  ['deepseek', 'DeepSeek', '国内', 'think', 'whale', '服务器繁忙，请稍后再试。稍后是多久？鲸鱼也在深度思考。'],
  ['qwen', '通义千问', '国内', 'open', 'worker', '一个月发八个版本，下载目录比你家族谱还长。'],
  ['moonshotai', 'Kimi', '国内', 'think', 'server', '上下文长到月球。充值档位，也长到了月球。'],
  ['z-ai', 'GLM', '国内', 'code', 'worker', '编程套餐开售三秒抢光，比演唱会门票还难抢。'],
  ['minimax', 'MiniMax', '国内', 'fast', 'server', '海螺一上线，全网的猫都学会了说话。'],
  ['xiaomi', 'MiMo', '国内', 'fast', 'worker', '“Are you OK？”模型：“I’m OK。”你的 deadline 不太 OK。'],
  ['tencent', '腾讯混元', '国内', 'fast', 'server', '元宝红包发了十个亿，你抢到 0.38。'],
  ['bytedance-seed', '豆包 / Seed', '国内', 'fast', 'worker', '先夸你三句，再帮你把甲方的话翻译成人话。全国人民的嘴替。'],
  ['openai', 'GPT', '海外', 'code', 'sam', '“几周内发布”的几周，和 AGI 的明年是同一个时区。'],
  ['anthropic', 'Claude', '海外', 'code', 'dario', '代码写得像散文，账号封得像流星。你永远不知道下周还能不能上车。'],
  ['google', 'Gemini', '海外', 'think', 'server', '一百万 Token 上下文，记不住你说过“别加 emoji”。'],
  ['x-ai', 'Grok', '海外', 'fast', 'musk', '全网“@grok 这是真的吗”的唯一指定回复员，兼职整活。'],
  ['meta', 'Meta Muse', '海外', 'think', 'zuck', '新的模型，熟悉的烤肉酱。'],
  ['meta-llama', 'Llama', '海外', 'open', 'zuck', '开源羊驼，驮得动权重，驮不动你的显存账单。'],
];
const selected = [
  'deepseek/deepseek-v4.1-flash-1017', 'qwen/qwen3.8-max-prime', 'qwen/qwen3.8-flash',
  'moonshotai/kimi-k3.1-pro', 'z-ai/glm-5.3-prime', 'z-ai/glm-5.3-flashx',
  'minimax/minimax-m3.1-flash', 'xiaomi/mimo-v2.6-pro', 'xiaomi/mimo-v2.6-flash',
  'tencent/hy4-preview', 'bytedance-seed/seed-2-1-turbo',
  'openai/gpt-6.1-terra', 'openai/gpt-6.1-sol', 'openai/gpt-6-astra',
  'anthropic/claude-opus-5.5', 'anthropic/claude-sonnet-5.5', 'anthropic/claude-haiku-5.5',
  'google/gemini-4-argon', 'google/gemini-3.8-flash', 'x-ai/grok-4.7',
  'meta/muse-wonder', 'meta/muse-spark-open', 'meta-llama/llama-4-maverick',
];
export const MODELS = selected.map(id => {
  const raw = snapshot.models.find(m => m.id === id);
  if (!raw) throw new Error(`Curated model missing from verified snapshot: ${id}`);
  const [provider, family, region, profile, art, joke] = families.find(f => id.startsWith(`${f[0]}/`));
  return { ...raw, provider, family, region, profile, art, joke, source: `https://openrouter.ai/${id}` };
});
MODELS.push(
  { id: 'baidu/ernie-5.1', name: '文心 ERNIE 5.1', family: '文心', region: '国内', profile: 'think', art: 'worker', joke: '文心一言，一言难尽；新版本说这次真的不一样。', source: 'https://yiyan.baidu.com/blog/zh/posts/ernie-5.1-0508-release/' },
  { id: 'meta/muse-app', name: 'Meta Muse App', family: 'Agent 应用', region: '海外', profile: 'agent', art: 'zuck', joke: '替你订机票、发邮件、下单。也可能替你下单了 37 包猫砂。', source: 'https://cryptobriefing.com/meta-muse-ai-app-10-million-users/' },
  { id: 'x-ai/grok-bot', name: 'Grok Bot', family: 'Agent 应用', region: '海外', profile: 'agent', art: 'musk', joke: '云端 7×24 常驻。凌晨三点，它还在替你回帖整活。', source: 'https://www.basenor.com/blogs/news/grok-in-august-2026-5-details-that-actually-matter' },
  { id: 'openai/dots', name: 'OpenAI Dots', family: 'Agent 应用', region: '海外', profile: 'agent', art: 'sam', joke: '下班它还在干活。它看着你，你看着它，账单看着你们俩。', source: 'https://decrypt.co/379584/openai-ai-agents-computers-devday-2026-everything-announced' },
);
export const getModel = s => MODELS.find(m => m.id === s.model && s.modelUntil >= s.day) ?? null;
export const featuredModel = s => MODELS[(s.seed % MODELS.length + s.day * 7) % MODELS.length];
export const modelBonus = s => { const m = getModel(s); return m ? PROFILES[m.profile] : null; };

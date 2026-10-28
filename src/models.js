import snapshot from './model-snapshot.json' with { type: 'json' };

// Contract effects are fictional game balance, never a real capability ranking.
export const MODEL_DATE = '2026-10-28';
export const PROFILES = {
  code: { label: '代码搭子' }, think: { label: '思考搭子' }, fast: { label: '快嘴搭子' }, open: { label: '开源搭子' }, agent: { label: 'Agent 搭子' },
};
// Each company keeps at most two picks. Price and output follow word of mouth among Chinese users, as game balance, not a benchmark.
// [id, family, region, profile, art, fee (5 days), work bonus, learn bonus, build tech-debt change, joke]
const roster = [
  ['anthropic/claude-opus-5.5', 'Claude', '海外', 'code', 'dario', 560, 300, 3, -4, '代码天花板，价格也是。账号封得像流星，你永远不知道下周还能不能上车。'],
  ['anthropic/claude-sonnet-5.5', 'Claude', '海外', 'code', 'dario', 280, 190, 2, -3, '主力干活的那位。群友口头禅：“Sonnet 写的，我就看了一眼。”'],
  ['openai/gpt-6.1-sol', 'GPT', '海外', 'think', 'sam', 500, 260, 4, -3, '什么都会一点，每段都在“深入探讨”。“几周内发布”的几周，和 AGI 的明年是同一个时区。'],
  ['google/gemini-4-argon', 'Gemini', '海外', 'think', 'server', 420, 230, 4, -2, '一百万 Token 上下文，记不住你说过“别加 emoji”。'],
  ['google/gemini-3.8-flash', 'Gemini', '海外', 'fast', 'server', 110, 90, 2, -1, '快、便宜、偶尔一本正经地胡说八道。'],
  ['x-ai/grok-4.7', 'Grok', '海外', 'fast', 'musk', 240, 160, 2, -1, '全网“@grok 这是真的吗”的唯一指定回复员，兼职整活。'],
  ['meta/muse-wonder', 'Meta Muse', '海外', 'think', 'zuck', 200, 140, 3, -1, '新的模型，熟悉的烤肉酱。'],
  ['deepseek/deepseek-v4.1-flash-1017', 'DeepSeek', '国内', 'think', 'whale', 80, 130, 3, -1, '性价比之王。服务器繁忙，请稍后再试；稍后是多久？鲸鱼也在深度思考。'],
  ['qwen/qwen3.8-max-prime', '通义千问', '国内', 'open', 'worker', 180, 150, 3, -2, '一个月发八个版本，下载目录比你家族谱还长。'],
  ['qwen/qwen3.8-flash', '通义千问', '国内', 'open', 'worker', 50, 60, 1, 0, '白菜价小钢炮，跑在你那台旧电脑上也不嫌弃。'],
  ['moonshotai/kimi-k3.1-pro', 'Kimi', '国内', 'think', 'server', 200, 150, 4, -1, '上下文长到月球。充值档位，也长到了月球。'],
  ['z-ai/glm-5.3-prime', 'GLM', '国内', 'code', 'worker', 190, 160, 2, -2, '编程套餐开售三秒抢光，比演唱会门票还难抢。'],
  ['z-ai/glm-5.3-flashx', 'GLM', '国内', 'fast', 'worker', 50, 55, 1, 0, '能用，便宜，就是偶尔需要你再说一遍。'],
  ['minimax/minimax-m3.1-flash', 'MiniMax', '国内', 'fast', 'server', 90, 90, 1, 0, '海螺一上线，全网的猫都学会了说话。'],
  ['xiaomi/mimo-v2.6-pro', 'MiMo', '国内', 'fast', 'worker', 120, 110, 2, -1, '“Are you OK？”模型：“I’m OK。”你的 deadline 不太 OK。'],
  ['xiaomi/mimo-v2.6-flash', 'MiMo', '国内', 'fast', 'worker', 45, 50, 1, 0, '人车家全生态里最便宜的那一环。'],
  ['tencent/hy4-preview', '腾讯混元', '国内', 'fast', 'server', 100, 90, 2, 0, '元宝红包发了十个亿，你抢到 0.38。'],
  ['bytedance-seed/seed-2-1-turbo', '豆包 / Seed', '国内', 'fast', 'worker', 70, 95, 1, 0, '先夸你三句，再帮你把甲方的话翻译成人话。全国人民的嘴替。'],
];
const extras = [
  { id: 'baidu/ernie-5.1', name: '文心 ERNIE 5.1', family: '文心', region: '国内', profile: 'think', art: 'worker', fee: 90, work: 70, learn: 2, build: 0, joke: '文心一言，一言难尽；新版本说这次真的不一样。', source: 'https://yiyan.baidu.com/blog/zh/posts/ernie-5.1-0508-release/' },
  { id: 'openai/dots', name: 'OpenAI Dots', family: 'GPT', region: '海外', profile: 'agent', art: 'sam', fee: 600, work: 340, learn: 0, build: 0, joke: '下班它还在干活。它看着你，你看着它，账单看着你们俩。', source: 'https://decrypt.co/379584/openai-ai-agents-computers-devday-2026-everything-announced' },
  { id: 'x-ai/grok-bot', name: 'Grok Bot', family: 'Grok', region: '海外', profile: 'agent', art: 'musk', fee: 320, work: 220, learn: 0, build: 0, joke: '云端 7×24 常驻。凌晨三点，它还在替你回帖整活。', source: 'https://www.basenor.com/blogs/news/grok-in-august-2026-5-details-that-actually-matter' },
  { id: 'meta/muse-app', name: 'Meta Muse App', family: 'Meta Muse', region: '海外', profile: 'agent', art: 'zuck', fee: 260, work: 190, learn: 0, build: 0, joke: '替你订机票、发邮件、下单。也可能替你下单了 37 包猫砂。', source: 'https://cryptobriefing.com/meta-muse-ai-app-10-million-users/' },
];
export const MODELS = [...roster.map(([id, family, region, profile, art, fee, work, learn, build, joke]) => {
  const raw = snapshot.models.find(m => m.id === id);
  if (!raw) throw new Error(`Curated model missing from verified snapshot: ${id}`);
  return { ...raw, family, region, profile, art, fee, work, learn, build, joke, source: `https://openrouter.ai/${id}` };
}), ...extras].sort((a, b) => b.fee - a.fee);
export const modelTier = m => m.fee >= 400 ? '旗舰' : m.fee >= 150 ? '主力' : m.fee >= 80 ? '实惠' : '白菜价';
export const modelBlurb = m => [`接单 +¥${m.work}`, m.learn ? `学习 +${m.learn}` : '', m.build ? `研发技术债 ${m.build}` : ''].filter(Boolean).join(' · ');
export const getModel = s => MODELS.find(m => m.id === s.model && s.modelUntil >= s.day) ?? null;
export const featuredModel = s => MODELS[(s.seed % MODELS.length + s.day * 7) % MODELS.length];
export const modelBonus = s => getModel(s);

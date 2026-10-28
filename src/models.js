import snapshot from './model-snapshot.json' with { type: 'json' };

// Contract effects are fictional game balance, never a real capability ranking.
export const MODEL_DATE = '2026-10-28';
export const PROFILES = {
  code: { label: '代码搭子', fee: 180, work: 95, learn: 1, build: -2, blurb: '接单 +¥95 · 学习额外 +1 技能 · 研发少 2 技术债' },
  think: { label: '思考搭子', fee: 140, work: 55, learn: 3, build: -1, blurb: '接单 +¥55 · 学习额外 +3 技能 · 研发少 1 技术债' },
  fast: { label: '快嘴搭子', fee: 90, work: 75, learn: 1, build: 0, blurb: '接单 +¥75 · 学习额外 +1 技能' },
  open: { label: '本地搭子', fee: 70, work: 45, learn: 2, build: -1, blurb: '接单 +¥45 · 学习额外 +2 技能 · 研发少 1 技术债' },
};
const families = [
  ['deepseek', 'DeepSeek', '国内', 'think', 'whale', '钢盆、白饭、深度思考。你负责验收，本鲸负责思考用户为什么怒了。'],
  ['qwen', '通义千问', '国内', 'open', 'worker', '一家模型三代同堂，下载目录比你的族谱还长。'],
  ['moonshotai', 'Kimi', '国内', 'think', 'server', '上下文通向月球，最后一页还要你亲自看。'],
  ['z-ai', 'GLM', '国内', 'code', 'worker', '编程套餐买好了，先研究额度为什么刷新不了。'],
  ['minimax', 'MiniMax', '国内', 'fast', 'server', '小小名字，大大工作量。最大化的往往是你的待办。'],
  ['stepfun', '阶跃星辰', '国内', 'think', 'worker', '模型阶跃了，工资曲线还在原地。'],
  ['xiaomi', 'MiMo', '国内', 'fast', 'worker', '人车家全生态，这个 bug 怎么还得我回家修。'],
  ['tencent', '腾讯混元', '国内', 'fast', 'server', '元宝在群里，尾款在梦里。'],
  ['bytedance-seed', '豆包 / Seed', '国内', 'fast', 'worker', '豆包先给情绪价值，再帮你把甲方的话翻译成人话。'],
  ['meituan', 'LongCat', '国内', 'fast', 'worker', '长猫接单中，预计送达时间：再等一个 Token。'],
  ['inclusionai', '蚂蚁 Ling', '国内', 'open', 'worker', '灵机一动想创业，余额提醒先吃饭。'],
  ['openai', 'GPT', '海外', 'code', 'sam', '通用智能即将到来，草莓仍需人工复核。'],
  ['anthropic', 'Claude', '海外', 'code', 'dario', '代码写得像散文，卖钨块卖得像慈善。'],
  ['google', 'Gemini', '海外', 'think', 'server', '上下文很长，忘记刚才那句话也很快。'],
  ['x-ai', 'Grok', '海外', 'fast', 'musk', '一边上班一边整活，甲方不一定同意这门艺术。'],
  ['meta', 'Meta Muse', '海外', 'think', 'zuck', '新的模型，熟悉的烤肉酱。'],
  ['meta-llama', 'Llama', '海外', 'open', 'zuck', '羊驼驮得动权重，驮不动你的显存账单。'],
  ['mistralai', 'Mistral', '海外', 'open', 'worker', '欧洲来的风，能不能先把机箱吹凉一点。'],
  ['nvidia', 'Nemotron', '海外', 'open', 'jensen', '皮衣负责卖铲子，也负责给铲子配一张嘴。'],
  ['microsoft', 'Phi', '海外', 'open', 'worker', '小模型有大志向，旧电脑有大风扇。'],
  ['amazon', 'Nova', '海外', 'fast', 'server', '一站式云服务，一站式看不懂的账单。'],
  ['perplexity', 'Sonar', '海外', 'think', 'server', '它帮你搜索世界，你负责点开引用看看是不是真的。'],
];
const selected = [
  'deepseek/deepseek-v4.1-flash-1017', 'qwen/qwen3.8-max-prime', 'qwen/qwen3.8-flash',
  'moonshotai/kimi-k3.1-pro', 'z-ai/glm-5.3-prime', 'z-ai/glm-5.3-flashx',
  'minimax/minimax-m3.1-flash', 'stepfun/step-5-preview', 'xiaomi/mimo-v2.6-pro', 'xiaomi/mimo-v2.6-flash',
  'tencent/hy4-preview', 'bytedance-seed/seed-2-1-turbo', 'meituan/longcat-2.0', 'inclusionai/ling-3.1-flash',
  'openai/gpt-6.1-terra', 'openai/gpt-6.1-sol', 'openai/gpt-6-astra',
  'anthropic/claude-opus-5.5', 'anthropic/claude-sonnet-5.5', 'anthropic/claude-haiku-5.5',
  'google/gemini-4-argon', 'google/gemini-3.8-flash', 'x-ai/grok-4.7',
  'meta/muse-wonder', 'meta/muse-spark-open', 'meta-llama/llama-4-maverick', 'mistralai/mistral-large-4-0',
  'nvidia/nemotron-3.5-super-vl', 'microsoft/phi-4', 'amazon/nova-2-lite-v1', 'perplexity/sonar-pro-search',
];
export const MODELS = selected.map(id => {
  const raw = snapshot.models.find(m => m.id === id);
  if (!raw) throw new Error(`Curated model missing from verified snapshot: ${id}`);
  const [provider, family, region, profile, art, joke] = families.find(f => id.startsWith(`${f[0]}/`));
  return { ...raw, provider, family, region, profile, art, joke, source: `https://openrouter.ai/${id}` };
});
MODELS.push(
  { id: 'baidu/ernie-5.1', name: '文心 ERNIE 5.1', family: '文心', region: '国内', profile: 'think', art: 'worker', joke: '文心雕龙，甲方只想雕一个提交按钮。', source: 'https://yiyan.baidu.com/blog/zh/posts/ernie-5.1-0508-release/' },
  { id: 'iflytek/spark-x2.5', name: '讯飞星火 X2.5', family: '星火', region: '国内', profile: 'fast', art: 'worker', joke: '语音转文字很快，老板的语音条却越来越长。', source: 'https://www.xfyun.cn/doc/spark/Spark-X2.5模型介绍.html' },
  { id: 'sensetime/sensenova-6.8-flash-lite', name: '日日新 6.8 Flash Lite', family: '日日新', region: '国内', profile: 'fast', art: 'worker', joke: '日日新的是模型，日日旧的是你的需求文档。', source: 'https://www.sensetime.com/cn/news/sensenova-u1-5-lite-token-plan-20260911-1741' },
);
export const getModel = s => MODELS.find(m => m.id === s.model && s.modelUntil >= s.day) ?? null;
export const featuredModel = s => MODELS[(s.seed % MODELS.length + s.day * 7) % MODELS.length];
export const modelBonus = s => { const m = getModel(s); return m ? PROFILES[m.profile] : null; };

// Advice only: never changes a save or consumes randomness.
export function nextGuide(s) {
  const action = (title, body, label, id) => ({ title, body, label, ui: 'action', id });
  const end = { title: s.day === 40 ? '最后一天：准备结算' : '今天的两次安排做完了', body: s.day === 40 ? '先交付项目、整理持仓，再结算输赢。' : '结束今天会扣生活费、增加贷款利息，并进入明天。买卖和还款仍可继续。', label: s.day === 40 ? '结算这 40 天' : '结束今天，进入明天', ui: s.day === 40 ? 'finish' : 'end-day' };
  if (!s.ap) {
    if (s.project && s.project.progress >= s.project.need && !['waiting', 'pending'].includes(s.project.change)) return { title: '项目做完了，记得收钱', body: '制作完成不会自动发钱。现在验收交付，不消耗今天的次数。', label: '交付项目，领取报酬', ui: 'project-command', id: 'deliver' };
    if (s.project?.change === 'pending') return { title: '先谈清楚项目的新要求', body: '协商不耗行动。今天没次数了也能先确认范围，再决定是否收工。', label: '查看客户要求，选择怎么处理', ui: 'projects' };
    return end;
  }
  if (s.health <= 35 || s.stress >= 65) return action('先照顾自己', '健康归零或压力达到 100 会出局。休息恢复健康、降低压力，占用今天一次安排。', '休息一次，恢复状态', 'rest');
  if (s.project) {
    if (s.project.change === 'pending') return { title: '甲方加需求了，先谈范围', body: '可以少收钱少做事，也能凭口碑谈加价，或凭技能复用方案。其他玩法照常可用。', label: '查看客户要求，选择怎么处理', ui: 'projects' };
    if (s.project.progress >= s.project.need) {
      if (s.project.change !== 'waiting') return { title: '项目做完了，记得收钱', body: '现在验收交付，不消耗今天的次数。', label: '交付项目，领取报酬', ui: 'project-command', id: 'deliver' };
      return action('今天的制作已完成', '客户明天确认范围，今天还不能收款。可以用剩余一次安排休息，再结束今天。', '休息一次，等明天确认', 'rest');
    }
    return { title: `继续项目：${s.project.progress}/${s.project.need} 已完成`, body: '制作会花钱并消耗一次安排；做完后还要手动交付，才会收到项目款。', label: '去项目板，制作下一步', ui: 'projects' };
  }
  if (s.day === 1 && !s.jobsDone) return action('第一步：先赚一笔现金', '做零工会马上收到游戏币，用来还债和生活。每天只能安排两件事，这次会用掉一次。', '做一次零工，立即拿钱', 'work');
  if (s.day === 1) return action('第二步：试着休息一次', '赚钱会消耗健康、增加压力。休息不赚钱，但能恢复状态。这次之后，就可以结束今天。', '休息一次，恢复健康', 'rest');
  if (s.day === 40) return { ...end, body: '今天仍可赚钱、还款和交易。准备好后结算：清仓还债，欠款为 0 且人还活着就通关。' };
  return { title: '看看今天什么便宜', body: '低价买入，等之后涨价再卖。买卖不限次数，但要留生活费；明天也可能继续跌。不想倒货，就做零工赚钱。', label: '去看今天的行情', ui: 'show-pane', pane: 'market' };
}

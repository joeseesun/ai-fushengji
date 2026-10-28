// Shared, bounded command format. No client-reported balance is accepted by the server.
export const RULESET = '0.9.0';
export const MAX_COMMANDS = 1200;
const fields = {
  'ignore-event': [], model: ['id'], choose: ['index', 'stance'], buy: ['id', 'qty'],
  sell: ['id', 'qty'], action: ['id'], expand: [], repay: ['amount'], borrow: [],
  travel: ['location'], finish: [], perk: ['id'], rent: [],
};
export function cleanCommand(command) {
  if (!command || typeof command !== 'object' || typeof command.type !== 'string' || !Object.hasOwn(fields, command.type)) return null;
  const result = { type: command.type };
  for (const key of fields[command.type]) {
    const value = command[key];
    if (key === 'stance' && value === undefined) continue;
    if (['id', 'location'].includes(key) ? typeof value !== 'string' || value.length > 80 : !Number.isSafeInteger(value)) return null;
    result[key] = value;
  }
  return result;
}
export function validProof(proof) {
  return !!proof && proof.ruleset === RULESET && Array.isArray(proof.commands) && proof.commands.length <= MAX_COMMANDS && proof.commands.every(cleanCommand);
}

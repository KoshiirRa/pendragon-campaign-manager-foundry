export const LOG_PREFIX = "Pendragon Campaign Manager |";

export function logInfo(message, data = undefined) {
  if (data === undefined) console.info(LOG_PREFIX, message);
  else console.info(LOG_PREFIX, message, data);
}

export function logWarn(message, data = undefined) {
  if (data === undefined) console.warn(LOG_PREFIX, message);
  else console.warn(LOG_PREFIX, message, data);
}

export function logError(message, error) {
  console.error(LOG_PREFIX, message, error);
}

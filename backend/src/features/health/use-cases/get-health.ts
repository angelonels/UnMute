export const HEALTH_SERVICE = 'unmute-api' as const;

export function getHealth() {
  return {
    status: 'ok',
    service: HEALTH_SERVICE,
  } as const;
}

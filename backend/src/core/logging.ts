type LogFields = {
  event: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  code?: string;
};

export function log(fields: LogFields): void {
  console.log(JSON.stringify(fields));
}

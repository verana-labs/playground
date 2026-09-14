export type HttpInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  redirect?: RequestRedirect;
  timeoutMs?: number;
};

export function fetchWithTimeout(url: string, init: HttpInit = {}): Promise<Response> {
  const { timeoutMs = 20_000, ...rest } = init;
  return fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
}

export async function fetchJson(url: string, init: HttpInit = {}): Promise<unknown> {
  const res = await fetchWithTimeout(url, { ...init, headers: { accept: "application/json", ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${url} -> HTTP ${res.status}`);
  return res.json();
}

export async function fetchText(url: string, init: HttpInit = {}): Promise<string> {
  const res = await fetchWithTimeout(url, init);
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${url} -> HTTP ${res.status}`);
  return res.text();
}

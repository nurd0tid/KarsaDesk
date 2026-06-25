export type RuntimeConfig = { orchestratorUrl: string; token: string };

export class ApiClient {
  constructor(public readonly runtime: RuntimeConfig) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const hasBody = init.body !== undefined && init.body !== null;
    const headers = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      "x-vk-local-secret": this.runtime.token,
      ...(init.headers || {}),
    };
    const response = await fetch(`${this.runtime.orchestratorUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(body.error || `Request failed (${response.status})`);
    return body as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
  websocket(path: string) {
    const url = new URL(
      path,
      this.runtime.orchestratorUrl.replace(/^http/, "ws"),
    );
    url.searchParams.set("token", this.runtime.token);
    return new WebSocket(url);
  }
}

export async function createApiClient() {
  const runtime = (await fetch("/api/runtime", { cache: "no-store" }).then(
    (response) => response.json(),
  )) as RuntimeConfig;
  return new ApiClient(runtime);
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ForwardJsonOptions = {
  baseUrl: string;
  path: string;
  method: HttpMethod;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ForwardJsonResult<TBody = unknown> = {
  status: number;
  headers: Headers;
  body: TBody | null;
};

export async function forwardJson<TBody = unknown>(
  options: ForwardJsonOptions
): Promise<ForwardJsonResult<TBody>> {
  const url = `${options.baseUrl.replace(/\/$/, "")}/${options.path.replace(/^\//, "")}`;

  const headers = new Headers();

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === "undefined") {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          headers.append(key, entry);
        });
      } else {
        headers.set(key, value);
      }
    });
  }

  const hasJsonBody = typeof options.body !== "undefined" && options.method !== "GET";

  if (hasJsonBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const parsedBody = text === "" ? null : (JSON.parse(text) as TBody);

  return {
    status: response.status,
    headers: response.headers,
    body: parsedBody,
  };
}


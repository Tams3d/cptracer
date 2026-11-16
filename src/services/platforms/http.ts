const API_TIMEOUT_MS = 15_000;

export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, signal, ...rest } = options;
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      ...rest,
      headers: { Accept: "application/json", ...headers },
      signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("The public API timed out. Try refreshing again.", {
        cause: error,
      });
    }

    throw new Error(
      "The public API could not be reached. Try refreshing again.",
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchOptionalJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    return await fetchJson<T>(url, options);
  } catch {
    return null;
  }
}

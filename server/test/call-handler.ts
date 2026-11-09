import { createEvent, type EventHandler } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

type CallInput = {
  method: string;
  url: string;
  headers?: Record<string, string | undefined>;
  body?: unknown;
};

export async function callHandler<T>(
  handler: EventHandler,
  input: CallInput,
): Promise<{ status: number; body: T }> {
  const req = new IncomingMessage(new Socket());
  const res = new ServerResponse(req);
  req.method = input.method.toUpperCase();
  req.url = input.url;

  const headers: Record<string, string> = { host: "localhost" };
  for (const [key, value] of Object.entries(input.headers ?? {})) {
    if (value !== undefined) {
      headers[key.toLowerCase()] = value;
    }
  }
  req.headers = headers;

  if (input.body !== undefined) {
    headers["content-type"] ??= "application/json";
    (req as IncomingMessage & { body?: unknown }).body = input.body;
  }

  const event = createEvent(req, res);
  const body = (await handler(event)) as T;
  return { status: res.statusCode, body };
}

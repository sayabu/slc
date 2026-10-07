import { ZodError } from "zod";

export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Send a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("A request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 100000) {
      await reader.cancel();
      throw new Error("Request is too large.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      {
        error: error.issues
          .map(
            (issue) => `${issue.path.join(" → ") || "Input"}: ${issue.message}`,
          )
          .join("; "),
      },
      { status: 422 },
    );
  if (error instanceof SyntaxError)
    return Response.json(
      { error: "Request must contain valid JSON." },
      { status: 400 },
    );
  return Response.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete the calculation.",
    },
    { status: 422 },
  );
}

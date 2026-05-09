export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return json({ ok: false, error: "Missing REVALIDATE_SECRET" }, 500);

  const incoming = req.headers.get("x-revalidate-secret");
  if (incoming !== secret) return json({ ok: false, error: "Unauthorized" }, 401);

  try {
    const body: unknown = await req.json().catch(() => ({}));
    const bodyPaths =
      typeof body === "object" && body !== null && "paths" in body
        ? (body as { paths?: unknown }).paths
        : undefined;
    const paths =
      Array.isArray(bodyPaths) && bodyPaths.every((path) => typeof path === "string")
        ? bodyPaths
        : ["/"];

    const { revalidatePath } = await import("next/cache");
    for (const p of paths) revalidatePath(p);

    return json({ ok: true, revalidated: paths });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ ok: false, error: message }, 500);
  }
}

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
    const body = await req.json().catch(() => ({}));
    const paths: string[] = Array.isArray(body?.paths) ? body.paths : ["/"];

    // Next 15+
    const { revalidatePath } = await import("next/cache");
    for (const p of paths) revalidatePath(p);

    return json({ ok: true, revalidated: paths });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "Unknown error" }, 500);
  }
}

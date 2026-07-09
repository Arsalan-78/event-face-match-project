const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8000";

export async function POST(request, { params }) {
  const organizerApiKey = process.env.ORGANIZER_API_KEY;

  if (!organizerApiKey) {
    return Response.json(
      { detail: "Frontend upload proxy is missing ORGANIZER_API_KEY." },
      { status: 500 }
    );
  }

  const formData = await request.formData();

  const upstream = await fetch(
    `${BACKEND_API_BASE_URL}/events/${encodeURIComponent(params.eventId)}/photos`,
    {
      method: "POST",
      headers: {
        "X-API-Key": organizerApiKey,
      },
      body: formData,
      cache: "no-store",
    }
  );

  const contentType = upstream.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await upstream.json();
    return Response.json(payload, { status: upstream.status });
  }

  const payload = await upstream.text();
  return new Response(payload, {
    status: upstream.status,
    headers: { "content-type": contentType || "text/plain; charset=utf-8" },
  });
}

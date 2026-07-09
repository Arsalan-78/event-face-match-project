const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8000";

export async function POST(request, { params }) {
  const formData = await request.formData();
  const eventId = params.eventId;
  const backendUrl = `${BACKEND_API_BASE_URL}/events/${encodeURIComponent(eventId)}/match`;
  
  console.log("Match proxy: Requesting backend URL:", backendUrl);

  const upstream = await fetch(
    backendUrl,
    {
      method: "POST",
      body: formData,
      cache: "no-store",
    }
  );

  console.log("Match proxy: Backend response status:", upstream.status);
  const contentType = upstream.headers.get("content-type") || "";
  console.log("Match proxy: Backend response Content-Type:", contentType);

  if (contentType.includes("application/json")) {
    const payload = await upstream.json();
    return Response.json(payload, { status: upstream.status });
  }

  const payload = await upstream.text();
  console.log("Match proxy: Non-JSON response body (first 200 chars):", payload.substring(0, 200));
  return new Response(payload, {
    status: upstream.status,
    headers: { "content-type": contentType || "text/plain; charset=utf-8" },
  });
}

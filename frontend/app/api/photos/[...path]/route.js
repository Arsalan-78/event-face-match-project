
const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(request, { params }) {
  const path = params.path.join("/");
  const upstreamUrl = `${BACKEND_API_BASE_URL}/${path}`;
  
  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    cache: "no-store",
  });

  const headers = new Headers(upstream.headers);
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

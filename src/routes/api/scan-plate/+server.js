export async function ({ request }) {
  const formData = await request.formData();
  const aplrUrl = process.env.APLR_SERVICE_URL || "http://localhost:8001";

  const res = await fetch(`${aplrUrl}/scan-plate`, {
    method: "POST",
    body: formData
  })'

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const alprUrl = process.env.ALPR_SERVICE_URL || 'http://localhost:8001';

  const res = await fetch(`${alprUrl}/scan-plate`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export default async function handler(req: any, res: any) {
  const targetUrl = req.query?.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'FraudGuard-AI/2.5',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Remote server returned ${response.status} ${response.statusText}`,
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(text);
  } catch (err: any) {
    return res.status(502).json({
      error: `Failed to fetch dataset from URL: ${err.message}`,
    });
  }
}

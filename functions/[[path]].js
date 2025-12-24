export async function onRequest(context) {
  const { request, env } = context;
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const url = new URL(request.url);

  if (url.pathname.includes('/image/') || url.pathname.match(/\.(webp|png|jpg|jpeg|gif|ico|svg)$/i)) {
    return env.ASSETS.fetch(request);
  }

  const botKeywords = [
    'googlebot', 'adsbot', 'mediapartners-google', 'google-inspectiontool',
    'facebookexternalhit', 'facebookplatform', 'bingbot', 'adidxbot',
    'tiktokbot', 'bytedance', 'bytespider', 'snapchat', 'twitterbot', 'ia_archiver'
  ];
  
  const isBotUA = botKeywords.some(bot => userAgent.includes(bot));
  const isVerifiedBot = request.cf && request.cf.verifiedBot;
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent) && !isBotUA;

  let targetFile = 'desktop.html';
  if (isBotUA || isVerifiedBot) {
    targetFile = 'desktop.html';
  } else if (isMobile) {
    targetFile = 'mobile.html';
  }

  if (url.pathname === 'desktop.html' || url.pathname === 'mobile.html') {
    return new Response(null, { status: 404 });
  }

  const assetUrl = new URL(url);
  assetUrl.pathname = targetFile;
  const response = await env.ASSETS.fetch(assetUrl);
  
  const cleanHeaders = new Headers(response.headers);
  cleanHeaders.delete("Vary");
  cleanHeaders.delete("X-Powered-By"); 
  cleanHeaders.set("Content-Type", "text/html; charset=utf-8");
  cleanHeaders.set("Cache-Control", "public, s-maxage=3600, must-revalidate");

  return new Response(response.body, { status: 200, headers: cleanHeaders });
}
function prepare(req,res,method) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Vary','Origin');
  const origin=req.headers.origin;
  const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
  if(origin && !allowed.includes(origin)){res.status(403).json({error:'Origin not allowed'});return false;}
  if(origin) res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Methods',method+', OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
  if(req.method==='OPTIONS'){res.status(204).end();return false;}
  if(req.method!==method){res.setHeader('Allow',method+', OPTIONS');res.status(405).json({error:'Method not allowed'});return false;}
  return true;
}
function fail(res,e){const status=e.status||500;if(status===500) console.error('Backend error:',e.code||e.name);res.status(status).json({error:status===500?'Server configuration or database error. Check Vercel logs.':e.message});}
module.exports={prepare,fail};

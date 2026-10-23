import {JOURNEY as original} from '../../lib/html-pages.generated';
// Preserve the journey application and API; only its public URL metadata changes.
const html=original.replace('rel="canonical" href="https://islandcompany.space/"','rel="canonical" href="https://islandcompany.space/jornada"').replace('property="og:url" content="https://islandcompany.space/"','property="og:url" content="https://islandcompany.space/jornada"');
export async function GET(){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}})}

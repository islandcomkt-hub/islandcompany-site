import {leadReference} from '../../../lib/lead-reference';
import {leadDb} from '../../../db/leads';
import {normalizeSubmission,classify} from '../../../lib/submission';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Origem não autorizada'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Formato inválido'},415);
 if(Number(request.headers.get('content-length'))>24000)return json({error:'Dados muito extensos'},413);
 let value;try{const reader=request.body?.getReader();if(!reader)throw Error();let bytes=0;const chunks:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>24000){await reader.cancel();return json({error:'Dados muito extensos'},413)}chunks.push(part.value)}const merged=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length}value=normalizeSubmission(JSON.parse(new TextDecoder().decode(merged)))}catch(e){return json({error:e instanceof Error&&e.message?e.message:'Confira seus dados'},400)}
 try{const db=leadDb(),payload=JSON.stringify(value),submissionId=await hash(payload),existing=await db.prepare('SELECT received_at FROM leads WHERE submission_id = ?').bind(submissionId).first<{received_at:string}>();if(existing)return json({journey_id:value.journey_id,reference:leadReference(value.contact.name,value.contact.company,value.journey_id),received_at:existing.received_at});
 const receivedAt=new Date().toISOString(),rateKey=await hash(receivedAt.slice(0,10)+'|'+((request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'').split(',')[0].trim()||'local'));
 const count=await db.prepare('SELECT COUNT(*) AS count FROM leads WHERE rate_key = ? AND received_at > ?').bind(rateKey,new Date(Date.now()-3600000).toISOString()).first<{count:number}>();if((count?.count||0)>=20)return json({error:'Muitas tentativas. Aguarde um pouco para enviar novamente'},429);
 await db.prepare('INSERT INTO leads (submission_id,journey_id,received_at,name,company,email,whatsapp,payload,classification,rate_key) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(submission_id) DO NOTHING').bind(submissionId,value.journey_id,receivedAt,value.contact.name,value.contact.company,value.contact.email,value.contact.whatsapp,payload,JSON.stringify(classify(value.answers)),rateKey).run();
 return json({journey_id:value.journey_id,reference:leadReference(value.contact.name,value.contact.company,value.journey_id),received_at:receivedAt},201);
 }catch{console.error('Lead storage failed');return json({error:'Não conseguimos receber sua rota agora'},503)}
}

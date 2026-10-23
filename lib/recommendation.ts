export const ISLANDS=['Performance','Branding','Conteúdo','Tech','Estratégia'];
const weights:Record<string,number[]>={
 'Atrair mais clientes':[5,0,2,0,1], 'Vender mais':[5,0,1,0,2],
 'Fortalecer minha marca':[0,5,3,0,1], 'Melhorar minha presença digital':[1,2,5,0,1],
 'Organizar meu marketing':[1,0,2,0,5], 'Criar ou melhorar meu site / sistema':[0,0,0,5,2],
 'Ainda não sei — preciso de direção':[0,0,0,0,5]
};
const aliases:Record<string,string>={'Aumentar vendas':'Vender mais','Organizar meu crescimento':'Organizar meu marketing','Melhorar meu posicionamento':'Fortalecer minha marca','Estruturar aquisição de clientes':'Atrair mais clientes'};
export function recommend(answers:Record<string,any>={}){
 const scores=ISLANDS.map(island=>({island,points:0,reasons:[] as string[]}));
 const objectives=Array.isArray(answers.objectives)?[...new Set<string>(answers.objectives)]:[];
 for(const objective of objectives){const w=weights[aliases[objective]||objective];if(w)scores.forEach((s,i)=>{s.points+=w[i];if(w[i])s.reasons.push(`${objective} (+${w[i]})`)})}
 if(String(answers.stage||'').startsWith('Estou começando')){scores[4].points++;scores[4].reasons.push('Negócio começando (+1)')}
 scores.sort((a,b)=>b.points-a.points);const top=scores[0].points;
 const primary=scores.filter(s=>s.points>=4&&s.points>=top*.6).map(s=>s.island);
 const complementary=scores.filter(s=>s.points>=3&&!primary.includes(s.island)).map(s=>s.island);
 return {version:1,primary,complementary,scores,status:primary.length?'Sugestão para avaliação':'Precisa de avaliação',basis:objectives};
}
export function originSummary(acquisition:any={}){
 const describe=(touch:any,referrer:string)=>{const t=touch||{},source=String(t.utm_source||'').toLowerCase(),medium=String(t.utm_medium||'').toLowerCase();let host='';try{host=new URL(referrer||'').hostname.toLowerCase()}catch{}
 let label='Direto ou origem não identificada',evidence='Sem parâmetros ou referência suficiente';
 const platform=source.includes('instagram')?'Instagram':source.includes('facebook')?'Facebook':source==='meta'?'Meta':source.includes('google')?'Google':source.includes('whatsapp')?'WhatsApp':source;
 if(source){const paid=['paid_social','cpc','ppc','paid_search','paid','display'].includes(medium);const organic=['organic','organic_social','social'].includes(medium);label=platform+(paid?' · Anúncio':t.utm_content==='bio'?' · Bio do perfil':organic?' · Orgânico':medium?' · '+medium:' · Canal não informado');evidence='Parâmetros do link (não verificados pela plataforma)'}
 else if(t.gclid){label='Google · Sinal de anúncio';evidence='Identificador de clique Google recebido'}
 else if(t.fbclid){label='Meta · Pago ou orgânico não confirmado';evidence='Identificador de clique Meta recebido'}
 else if(host){if(/(^|\.)google\.[a-z.]+$/.test(host)){label='Google · Provável busca orgânica'}else if(/(^|\.)instagram\.com$/.test(host)){label='Instagram · Pago ou orgânico não confirmado'}else if(/(^|\.)facebook\.com$/.test(host)){label='Facebook · Pago ou orgânico não confirmado'}else if(!['islandcompany.space','island-company.islandco-mkt.chatgpt.site'].includes(host))label=host+' · Referência';evidence=label.startsWith('Direto')?'Referência interna, sem origem externa':'Site de referência informado pelo navegador'}
 if(t.default_source==='instagram_bio_assumed'&&!source&&!t.gclid&&!t.fbclid&&(label.startsWith('Direto')||/(^|\.)instagram\.com$/.test(host))){label='Bio do Instagram · Link padrão (presumido)';evidence='Origem presumida pela configuração do link padrão; pode incluir acesso direto ou compartilhamento sem identificação'}
 return {label,evidence,campaign:t.utm_campaign||'',content:t.utm_content||''};};
 return {first:describe(acquisition.first_touch,acquisition.first_referrer_origin||acquisition.referrer_origin),last:describe(acquisition.last_touch,acquisition.last_referrer_origin??acquisition.referrer_origin)};
}

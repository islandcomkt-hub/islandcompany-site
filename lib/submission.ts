import content from './content.json';
import legacy from './content-legacy.json';
import {recommend} from './recommendation';
export function normalizeSubmission(value:any){
 if(!value||typeof value!=='object'||value.website||value.consent!==true||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.journey_id||''))throw Error('Confira sua confirmação e os dados da jornada');
 const modern=value.schema_version===2,contact:Record<string,string>={};
 for(const key of ['name','company','role','whatsapp','email','city_state']){const v=value.contact?.[key]??'';if(typeof v!=='string'||v.length>200||((!modern||['name','whatsapp'].includes(key))&&!v.trim()))throw Error('Confira seus dados de contato');contact[key]=v.trim()}
 if((contact.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))||!/^(?:55)?\d{10,11}$/.test(contact.whatsapp.replace(/\D/g,'')))throw Error('Confira seu WhatsApp com DDD');
 const answers:Record<string,string|string[]>={};const steps=modern?content.steps.slice(1,-1):legacy.steps.slice(1,-1);
 for(const step of steps){const options=step.options!,v=value.answers?.[step.key];if(step.type==='multi'){if(!Array.isArray(v)||!v.length||v.length>((step as any).max||options.length)||new Set(v).size!==v.length||v.some(x=>!options.includes(x))||(step.key==='areas'&&v.includes('Arquipélago Completo')&&v.length>1)||(modern&&v.includes('Ainda não sei — preciso de direção')&&v.length>1))throw Error('Revise suas opções');answers[step.key]=options.filter(x=>v.includes(x))}else{if(!options.includes(v))throw Error('Revise suas opções');answers[step.key]=v}}
 if(typeof value.notes!=='string'||value.notes.length>2000)throw Error('Limite o comentário a 2.000 caracteres');
 const acquisition:Record<string,unknown>={};
 for(const touch of ['first_touch','last_touch']){const data:Record<string,string>={};for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','default_source']){const v=value.acquisition?.[touch]?.[key];if(typeof v==='string')data[key]=v.slice(0,500)}acquisition[touch]=data}
 for(const key of ['landing_path','referrer_origin','first_referrer_origin','last_referrer_origin','first_touch_at','last_touch_at']){const v=value.acquisition?.[key];if(typeof v==='string')acquisition[key]=v.slice(0,500)}
 return {schema_version:modern?2:1,journey_id:value.journey_id,contact,answers,notes:value.notes.trim(),consent:true,notice_version:modern?'2026-10-05':'2026-10-03',acquisition};
}
export function classify(answers:Record<string,any>={}){
 const investment=legacy.steps[5].options!.indexOf(answers.investment),urgent=['Agora','Imediato / essa semana','Próximas 2 semanas'].includes(answers.start),recommendation=recommend(answers);
 return {rule_version:2,review_required:true,priority:investment>=2&&urgent?'Prioritário':'Qualificar',investment:answers.investment,urgency:urgent?'Curto prazo':'Planejamento',maturity:answers.history||'Não coletado',entry_area:recommendation.primary.join(' + ')||'A avaliar',recommendation};
}

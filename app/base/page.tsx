import {requireChatGPTUser} from '../chatgpt-auth';
import {baseUser,listBase} from '../../lib/base';
import BaseClient from './BaseClient';
export const dynamic='force-dynamic';
export const metadata={title:'Island Base · Área interna',robots:{index:false,follow:false}};
export default async function Base(){
 await requireChatGPTUser('/base');
 if(!await baseUser())return <main className="access-state"><h1>Acesso restrito</h1><p>Use as credenciais autorizadas da Island para consultar os atendimentos</p><a href="/">Voltar ao site</a></main>;
 try{return <BaseClient initial={await listBase(new URLSearchParams())}/>}
 catch{return <main className="access-state"><h1>Island Base</h1><p>Não foi possível carregar os atendimentos agora</p><a href="/base">Tentar novamente</a></main>}
}

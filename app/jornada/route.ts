// Mantém o comportamento do site em produção: /jornada redireciona para o onboarding.
export async function GET(request:Request){
 const destination=new URL('https://onboarding.islandcompany.space/');
 destination.search=new URL(request.url).search;
 return Response.redirect(destination.toString(),307);
}

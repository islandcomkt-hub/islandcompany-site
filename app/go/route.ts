export async function GET(request:Request){
 const destination=new URL('https://landingpage.islandcompany.space/');
 destination.search=new URL(request.url).search;
 return Response.redirect(destination.toString(),307);
}

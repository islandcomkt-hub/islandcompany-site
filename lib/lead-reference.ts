/** Human-readable reference only; the UUID remains the database identity. */
export function leadReference(name:string,company:string,journeyId:string){
 const word=(value:string)=>value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/\s+/)[0].replace(/[^a-z0-9]/gi,'').slice(0,10).toUpperCase();
 return `${word(name)||'CLIENTE'}-${word(company)||'EMPRESA'}-${journeyId.replace(/-/g,'').slice(-6).toUpperCase()}`;
}

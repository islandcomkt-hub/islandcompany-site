import geomagnetism from '@cristianob/geomagnetism';
// Automatic enhancement only. Never request permissions or retain coordinates.
const compass=document.querySelector('#compass-control'),needle=document.querySelector('#compass-needle');
let enabled=false,declination=null,lastReading=0,heading=null,rotation=null,watchId=null,timer=null,permission=null,generation=0;
const validModel=()=>new Date().getUTCFullYear()>=2025&&new Date().getUTCFullYear()<2030;
function inactive(){compass.dataset.active='false';compass.setAttribute('aria-label','Bússola inativa');needle.style.transform='';rotation=null;heading=null}
function stop(){enabled=false;declination=null;lastReading=0;if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null}clearInterval(timer);timer=null;window.removeEventListener('deviceorientationabsolute',reading);window.removeEventListener('deviceorientation',reading);inactive()}
function paint(){
 if(!enabled||heading===null||declination===null||document.hidden)return;
 const screenAngle=Number(screen.orientation?.angle??window.orientation??0),target=-(heading+declination+screenAngle),previous=rotation??target;
 rotation=previous+(((target-previous+540)%360+360)%360-180);needle.style.transform=`rotate(${rotation}deg)`;
 compass.dataset.active='true';compass.setAttribute('aria-label','Bússola automática apontando para o norte geográfico');
}
function reading(event){
 if(!enabled||document.hidden)return;let magnetic;
 if(Number.isFinite(event.webkitCompassHeading)){
  if(Number.isFinite(event.webkitCompassAccuracy)&&(event.webkitCompassAccuracy<0||event.webkitCompassAccuracy>35)){inactive();return}
  magnetic=event.webkitCompassHeading;
 }else if(event.absolute===true&&Number.isFinite(event.alpha)){
  const a=event.alpha*Math.PI/180,b=(event.beta||0)*Math.PI/180,g=(event.gamma||0)*Math.PI/180;
  const x=-Math.cos(a)*Math.sin(g)-Math.sin(a)*Math.sin(b)*Math.cos(g),y=-Math.sin(a)*Math.sin(g)+Math.cos(a)*Math.sin(b)*Math.cos(g);
  magnetic=Math.hypot(x,y)>.1?(Math.atan2(x,y)*180/Math.PI+360)%360:(360-event.alpha)%360;
 }else return;
 lastReading=Date.now();heading=magnetic;paint();
}
async function reconcile(){
 const token=++generation;stop();
 if(document.hidden||!isSecureContext||!window.DeviceOrientationEvent||!navigator.geolocation||!navigator.permissions?.query||!validModel())return;
 try{
  const result=await navigator.permissions.query({name:'geolocation'});
  if(token!==generation)return;
  if(permission)permission.onchange=null;permission=result;permission.onchange=reconcile;
  // 'prompt', 'denied', or unsupported querying all fail closed, without UI.
  if(permission.state!=='granted'||document.hidden)return;
  enabled=true;
  window.addEventListener('deviceorientationabsolute',reading);window.addEventListener('deviceorientation',reading);
  // Merely listening does not prompt. Safari requiring an activation remains
  // inactive unless its sensor permission has already been granted.
  watchId=navigator.geolocation.watchPosition(position=>{
   if(!enabled||token!==generation||permission.state!=='granted')return;
   try{const info=geomagnetism.model(new Date()).point([position.coords.latitude,position.coords.longitude,0]);if(!validModel()||!Number.isFinite(info.decl)||info.h<2000||position.coords.accuracy>50000)throw Error();declination=info.decl;paint()}catch{stop()}
  },()=>stop(),{enableHighAccuracy:false,maximumAge:600000,timeout:12000});
  timer=setInterval(()=>{if(Date.now()-lastReading>5000)inactive()},2000);
 }catch{if(token===generation)stop()}
}
window.addEventListener('orientationchange',paint);screen.orientation?.addEventListener('change',paint);
document.addEventListener('visibilitychange',reconcile);
window.addEventListener('pageshow',reconcile);
window.addEventListener('pagehide',()=>{generation++;stop()});
reconcile();

// ======= Config Supabase =======
const SUPABASE_URL = "https://diubizleswmcepymbcnn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdWJpemxlc3dtY2VweW1iY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjgxOTMsImV4cCI6MjA3MjE0NDE5M30.itQ7bN17domEIb0QgM0x9QRHVE8rF-Xi-HGgJUTiRdE";

const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======= Utilidades UI =======
const $ = (id) => document.getElementById(id);
const UI = {
  eventId: $('eventId'),
  group: $('group'),
  connectBtn: $('connectBtn'),
  disconnectBtn: $('disconnectBtn'),
  fsBtn: $('fsBtn'),
  wakelockBtn: $('wakelockBtn'),
  screen: $('screen'),
};

// Persistencia básica
(function load() {
  UI.eventId.value = localStorage.getItem('olas:c:eventId') || '';
  UI.group.value   = localStorage.getItem('olas:c:group') || '';
})();
function save() {
  localStorage.setItem('olas:c:eventId', UI.eventId.value.trim());
  localStorage.setItem('olas:c:group', UI.group.value.trim());
}

// ======= Estado =======
let channel = null;
let wakeLock = null;
let anim = { running: false, type: 'off', config: null };
const myKey = 'u-' + Math.random().toString(36).slice(2);

// Helpers de pantalla
const clamp01 = (v)=> Math.max(0, Math.min(1, v));
const setBg = (c)=> { UI.screen.style.background = c; };
const setIntensity = (a)=> { UI.screen.style.filter = `brightness(${clamp01(a)})`; };
const showScreen = (v)=> { UI.screen.style.display = v ? 'grid' : 'none'; };

// ======= Funciones =======
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator){
      wakeLock = await navigator.wakeLock.request('screen');
      UI.wakelockBtn.textContent = 'WakeLock activo';
      wakeLock.addEventListener('release', ()=> UI.wakelockBtn.textContent='Mantener encendida');
    } else { alert('Wake Lock no soportado en este navegador'); }
  }catch(e){ console.warn(e); }
}
async function goFullscreen(){
  try{ await document.documentElement.requestFullscreen(); }catch(e){ console.warn(e); }
  showScreen(true);
}

function trackPresence(){
  if(!channel) return;
  channel.track({ role:'user', group:(UI.group.value||'')||null, t:Date.now() });
  save();
}

async function connect(){
  const id = (UI.eventId.value||'').trim();
  if(!id) return alert('Ingresa Event ID');
  const group = (UI.group.value||'').trim() || null;

  channel = sb.channel(`event:${id}`, {
    config:{ broadcast:{ack:false}, presence:{ key: myKey } }
  });

  channel.on('broadcast', { event:'cmd' }, ({ payload })=>{
    const { type, targetGroup, startAt, payload: data } = payload || {};
    if (targetGroup && targetGroup !== group) return;
    if (type === 'stop') return stopEffect();
    if (type === 'effect') return startEffect(data, startAt);
    if (type === 'mosaic') return showMosaic(data, startAt); // píxel central
  });

  channel.subscribe((status)=>{
    if(status==='SUBSCRIBED'){
      trackPresence();
      UI.connectBtn.disabled = true;
      UI.disconnectBtn.disabled = false;
    }
  });
}

async function disconnect(){
  if(channel){ await channel.unsubscribe(); channel=null; }
  UI.connectBtn.disabled=false; UI.disconnectBtn.disabled=true;
  stopEffect(); showScreen(false);
}

// ======= Efectos =======
function stopEffect(){ anim.running=false; anim.type='off'; setBg('#000'); setIntensity(1); }
function startEffect(cfg, startAt){
  const now = Date.now(); const delay = startAt ? Math.max(0, startAt-now) : 0;
  setTimeout(()=>{
    anim.config = cfg || {}; anim.type = cfg?.effect || 'solid'; anim.running=true;
    showScreen(true); requestAnimationFrame(loop);
  }, delay);
}
function loop(ts){
  if(!anim.running) return;
  const cfg = anim.config || {};
  setIntensity(clamp01(Number(cfg.intensity)||1));
  const [A,B] = cfg.colors || ['#ffffff','#000000'];
  const speed = Math.max(50, Number(cfg.speedMs)||500);
  const t = ts / speed;

  switch(anim.type){
    case 'solid': setBg(A); break;
    case 'blink': setBg(((t|0)%2)===0 ? A : B); break;
    case 'wave':  setBg(Math.sin(t) > 0 ? A : B); break; // sin x/y
    case 'gradient': {
      const p=(Math.sin(t*0.5)+1)/2, pct=Math.round(p*100);
      setBg(`linear-gradient(135deg, ${A} 0%, ${A} ${pct}%, ${B} ${pct}%, ${B} 100%)`);
      break;
    }
    default: setBg('#000');
  }
  requestAnimationFrame(loop);
}

// ======= Mosaico: usa el píxel CENTRAL =======
async function showMosaic(data, startAt){
  const { width, height, imageDataUrl, intensity } = data || {};
  const now = Date.now(); const delay = startAt ? Math.max(0, startAt-now) : 0;

  const img = new Image(); img.src = imageDataUrl; await img.decode();

  setTimeout(()=>{
    const cnv = document.createElement('canvas'); cnv.width=width; cnv.height=height;
    const ctx = cnv.getContext('2d', { willReadFrequently:true });
    ctx.drawImage(img,0,0,width,height);
    const cx = Math.max(0, Math.min(width-1, Math.floor(width/2)));
    const cy = Math.max(0, Math.min(height-1, Math.floor(height/2)));
    const px = ctx.getImageData(cx, cy, 1, 1).data;
    setBg(`rgb(${px[0]}, ${px[1]}, ${px[2]})`);
    setIntensity(clamp01(Number(intensity)||1));
    showScreen(true); anim.running=false;
  }, delay);
}

// ======= Eventos UI =======
UI.connectBtn.addEventListener('click', connect);
UI.disconnectBtn.addEventListener('click', disconnect);
UI.fsBtn.addEventListener('click', goFullscreen);
UI.wakelockBtn.addEventListener('click', requestWakeLock);
UI.eventId.addEventListener('change', trackPresence);
UI.group.addEventListener('change', trackPresence);
UI.eventId.addEventListener('input', save);
UI.group.addEventListener('input', save);

const KEY='moon-sound-enabled';
let context,lastScratch=0,lastSelect=0;
const effectGain=2;

export const soundEnabled=()=>{try{return localStorage.getItem(KEY)!=='false';}catch{return true;}};
export function setSoundEnabled(enabled){try{localStorage.setItem(KEY,String(enabled));}catch{}return enabled;}

function tone(ctx,start,frequency,duration,gain,shape='sine',endFrequency=frequency){
 const oscillator=ctx.createOscillator(),volume=ctx.createGain();
 oscillator.type=shape;oscillator.frequency.setValueAtTime(frequency,start);
 oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,endFrequency),start+duration);
 volume.gain.setValueAtTime(.0001,start);
 volume.gain.exponentialRampToValueAtTime(Math.max(.0002,Math.min(1,gain*effectGain)),start+.008);
 volume.gain.exponentialRampToValueAtTime(.0001,start+duration);
 oscillator.connect(volume).connect(ctx.destination);
 oscillator.start(start);oscillator.stop(start+duration+.01);
}

export function playSound(kind='click'){
 if(!soundEnabled())return;
 if(kind==='scratch'){
  const now=performance.now();if(now-lastScratch<90)return;lastScratch=now;
 }
 if(kind==='select'){
  const now=performance.now();if(now-lastSelect<65)return;lastSelect=now;
 }
 try{
  context??=new (window.AudioContext||window.webkitAudioContext)();
  if(context.state==='suspended')context.resume().catch(()=>{});
  const t=context.currentTime+.005;
  if(kind==='scratch'){
   tone(context,t,480+Math.random()*90,.07,.026,'triangle',180);
  }else if(kind==='box'){
   tone(context,t,310,.13,.065,'triangle',190);
   tone(context,t+.1,660,.27,.048,'sine',990);
  }else if(kind==='reveal'){
   [523,659,784].forEach((f,i)=>tone(context,t+i*.09,f,.31,.042,'sine'));
  }else if(kind==='select'){
   tone(context,t,620,.12,.04,'sine',810);
  }else{
   tone(context,t,420,.075,.044,'triangle',285);
  }
 }catch{}
}

export function installButtonSounds(scope=document){
 const click=e=>{
  const target=e.target.closest('button,a[href]');
  if(!target||!scope.contains(target)||target.disabled||target.closest('.hx-layout-controls,.search-layout-controls'))return;
  playSound(target.matches('.box-pick,#open-box')?'box':target.matches('.result,.hx-card')?'select':'click');
 };
 scope.addEventListener('click',click);
 return ()=>scope.removeEventListener('click',click);
}

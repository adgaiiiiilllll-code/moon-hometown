// Independent images move rigidly. Refraction is confined to small, verified water patches.
export const MOTION={
 guangdong:{ready:true,water:[[.02,.59,.32,.024]],tea:[[.494,.731]],steam:[[.568,.642],[.613,.584]],origin:'31% 26%'},
 beijing:{ready:true,water:[],tea:[[.349,.798]],steam:[],origin:'46% 30%', placement:[7.8,.5,81]},
 shanghai:{ready:true,water:[[.24,.742,.075,.026]],tea:[[.787,.805]],steam:[[.685,.739],[.79,.684]],origin:'41% 29%'},
 jiangsu:{ready:true,water:[[.28,.812,.095,.035]],tea:[[.844,.807]],steam:[],origin:'38% 31%', placement:[8.9,.4,78.5]},
 zhejiang:{ready:true,water:[[.55,.76,.22,.085]],tea:[[.204,.697],[.363,.735]],steam:[],origin:'65% 32%', placement:[11.5,-.4,83]}
};
const url=(id,type)=>new URL(`assets/layers/${id}-${type}.webp`,import.meta.url).href;
export function startRegionMotion(stage,art,id){
 const config=MOTION[id];if(!config)return ()=>{};
 const preference=matchMedia('(prefers-reduced-motion: reduce)');let disposed=false,raf=0,last=0,root,waters=[];
 function stop(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',visibility);root?.remove();}
 function visibility(){cancelAnimationFrame(raf);if(!disposed&&!document.hidden&&!preference.matches)raf=requestAnimationFrame(draw);}
 function draw(t){if(disposed||document.hidden||preference.matches)return;raf=requestAnimationFrame(draw);if(t-last<40)return;last=t;
  for(const {canvas,ctx,source,x,y,w,h} of waters){ctx.clearRect(0,0,w,h);ctx.drawImage(source,x,y,w,h,0,0,w,h);for(let row=2;row<h-2;row+=2){const fade=Math.sin(row/h*Math.PI)**2,dx=(Math.sin(row*.23+t*.0019)*3.6+Math.sin(row*.09-t*.0013)*1.2)*fade;ctx.drawImage(source,x+8+dx,y+row,w-16,2,8,row,w-16,2);}for(let n=0;n<12;n++){ctx.globalAlpha=(.23+.2*Math.sin(t*.0018+n))*Math.sin((n+1)/13*Math.PI);ctx.fillStyle='#fff0b0';ctx.fillRect(8+(n*47)%(w-18),3+(n*7)%(h-5),6+n%7,1.5);}ctx.globalAlpha=1;}
 }
 async function init(){
  root=document.createElement('div');root.className='region-layers';root.setAttribute('aria-hidden','true');let source=art;
  if(config.ready){const clean=new Image(),moon=new Image();clean.src=url(id,'clean');moon.src=url(id,'moon');clean.className='region-clean';moon.className='region-moon';moon.style.transformOrigin=config.origin;if(config.placement){const [x,y,size]=config.placement;Object.assign(moon.style,{left:x+'%',top:y+'%',width:size+'%',height:size+'%'});}
   try{await Promise.all([clean.decode(),moon.decode()]);}catch{console.warn('Layer assets unavailable; showing original scene.');return;}
   if(disposed)return;root.append(clean,moon);source=clean;
   [...config.steam.map(p=>[...p,false]),...(config.tea??[]).map(p=>[...p,true])].forEach(([x,y,tea],j)=>{const steam=document.createElement('div');steam.className='region-steam'+(tea?' tea-steam':'');steam.style.left=x*100+'%';steam.style.top=y*100+'%';steam.innerHTML=[0,1,2].map(n=>`<i style="--delay:${-n*1.2-j*.5}s;--drift:${n%2?9:-7}px"></i>`).join('');root.append(steam);});
  }
  for(const [rx,ry,rw,rh] of config.water){const canvas=document.createElement('canvas');canvas.className='water-patch';const x=Math.round(rx*source.naturalWidth),y=Math.round(ry*source.naturalHeight),w=Math.round(rw*source.naturalWidth),h=Math.round(rh*source.naturalHeight);canvas.width=w;canvas.height=h;Object.assign(canvas.style,{left:rx*100+'%',top:ry*100+'%',width:rw*100+'%',height:rh*100+'%'});root.append(canvas);waters.push({canvas,ctx:canvas.getContext('2d'),source,x,y,w,h});}
  if(disposed)return;stage.insertBefore(root,stage.querySelector('.ambient'));document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',visibility);visibility();
 }
 stop.ready=init();return stop;
}

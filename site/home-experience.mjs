const media=name=>new URL(`assets/home-experience/${name}`,import.meta.url).href;
const image=id=>new URL(`assets/${id}.webp`,import.meta.url).href;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const layoutKey='moon-home-sign-layout-v1';
const signDefaults={"search":{"x":19.84,"y":62.25,"w":7.28,"r":-2.13},"explore":{"x":82.38,"y":69.36,"w":8.09,"r":1.21}};

function mountSignLayout(root){
 const shell=root.closest('.hx-shell'),toggle=shell.querySelector('.hx-layout-toggle'),panel=shell.querySelector('.hx-layout-panel');
 const values=shell.querySelector('.hx-layout-values'),copy=shell.querySelector('.hx-layout-copy');
 const signs={search:root.querySelector('.hx-sign-left'),explore:root.querySelector('.hx-sign-right')};
 let saved={};try{saved=JSON.parse(localStorage.getItem(layoutKey)||'{}')||{};}catch{}
 const state=Object.fromEntries(Object.entries(signDefaults).map(([key,base])=>[key,{...base,...saved[key]}]));
 let editing=false,gesture=null;
 const data=()=>JSON.stringify(state);
 function paint(){
  for(const [key,sign] of Object.entries(signs)){
   const {x,y,w,r}=state[key];sign.style.setProperty('--label-x',`${x}%`);sign.style.setProperty('--label-y',`${y}%`);sign.style.setProperty('--label-w',`${w}%`);sign.style.setProperty('--label-rotation',`${r}deg`);
  }
  values.textContent=`搜索模式: x ${state.search.x.toFixed(2)}% · y ${state.search.y.toFixed(2)}% · 宽 ${state.search.w.toFixed(2)}% · 角度 ${state.search.r.toFixed(1)}°\n探索模式: x ${state.explore.x.toFixed(2)}% · y ${state.explore.y.toFixed(2)}% · 宽 ${state.explore.w.toFixed(2)}% · 角度 ${state.explore.r.toFixed(1)}°`;
  try{localStorage.setItem(layoutKey,data());}catch{}
 }
 function setEditing(on){editing=on;root.classList.toggle('hx-layout-editing',on);panel.hidden=!on;toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'收起调整工具':'调整文字位置';}
 const clickToggle=()=>setEditing(!editing);
 const clickDone=()=>setEditing(false);
 const clickReset=()=>{for(const key of Object.keys(state))Object.assign(state[key],signDefaults[key]);paint();};
 const clickCopy=async()=>{try{await navigator.clipboard.writeText(data());copy.textContent='已复制位置数据';}catch{values.focus();copy.textContent='请截屏发送数值';}setTimeout(()=>copy.textContent='复制位置数据',2000);};
 toggle.addEventListener('click',clickToggle);shell.querySelector('.hx-layout-done').addEventListener('click',clickDone);
 shell.querySelector('.hx-layout-reset').addEventListener('click',clickReset);copy.addEventListener('click',clickCopy);
 const disposers=[];
 for(const [key,sign] of Object.entries(signs)){
  const label=sign.querySelector('img');
  const handle=document.createElement('span');handle.className='hx-label-handle';handle.setAttribute('aria-hidden','true');sign.append(handle);
  const rotation=document.createElement('span');rotation.className='hx-label-rotation';rotation.setAttribute('aria-hidden','true');sign.append(rotation);
  const down=e=>{
   if(!editing)return;
   e.preventDefault();e.stopPropagation();
   const bounds=root.getBoundingClientRect();gesture={key,mode:e.target===handle?'resize':e.target===rotation?'rotate':'move',id:e.pointerId,startX:e.clientX,startY:e.clientY,initial:{...state[key]},width:bounds.width,height:bounds.height,centerX:bounds.left+bounds.width*state[key].x/100,centerY:bounds.top+bounds.height*state[key].y/100};
   if(gesture.mode==='rotate')gesture.startAngle=Math.atan2(e.clientY-gesture.centerY,e.clientX-gesture.centerX)*180/Math.PI;
   root.classList.add('hx-layout-dragging');
   sign.setPointerCapture(e.pointerId);
  };
  const move=e=>{
   if(!gesture||gesture.id!==e.pointerId||gesture.key!==key)return;
   const dx=(e.clientX-gesture.startX)/gesture.width*100,dy=(e.clientY-gesture.startY)/gesture.height*100;
   if(gesture.mode==='resize')state[key].w=Math.min(40,Math.max(3,gesture.initial.w+dx));
   else if(gesture.mode==='rotate'){const angle=Math.atan2(e.clientY-gesture.centerY,e.clientX-gesture.centerX)*180/Math.PI;state[key].r=Math.max(-180,Math.min(180,gesture.initial.r+angle-gesture.startAngle));}
   else{state[key].x=Math.min(97,Math.max(0,gesture.initial.x+dx));state[key].y=Math.min(97,Math.max(0,gesture.initial.y+dy));}
   paint();
  };
  const up=e=>{if(gesture?.id===e.pointerId&&gesture.key===key){gesture=null;root.classList.remove('hx-layout-dragging');}};
  const prevent=e=>{if(editing){e.preventDefault();e.stopPropagation();}};
  const childClick=e=>{if(editing){e.preventDefault();e.stopPropagation();}};
  label.draggable=false;sign.addEventListener('pointerdown',down);sign.addEventListener('pointermove',move);
  sign.addEventListener('pointerup',up);sign.addEventListener('pointercancel',up);sign.addEventListener('click',prevent,true);label.addEventListener('click',childClick);
  disposers.push(()=>{sign.removeEventListener('pointerdown',down);sign.removeEventListener('pointermove',move);sign.removeEventListener('pointerup',up);sign.removeEventListener('pointercancel',up);sign.removeEventListener('click',prevent,true);label.removeEventListener('click',childClick);});
 }
 paint();
 return ()=>{disposers.forEach(dispose=>dispose());toggle.removeEventListener('click',clickToggle);shell.querySelector('.hx-layout-done').removeEventListener('click',clickDone);shell.querySelector('.hx-layout-reset').removeEventListener('click',clickReset);copy.removeEventListener('click',clickCopy);};
}

export function mountHome(root,{navigate}){
 const loop=root.querySelector('.hx-home-video'),video=root.querySelector('.hx-transition video'),layer=root.querySelector('.hx-transition');
 const cleanupLayout=mountSignLayout(root);
 let busy=false,closed=false,timer=0;
 const resume=()=>{if(!busy&&!document.hidden&&!reduced.matches)loop.play().catch(()=>{});};
 const visibility=()=>document.hidden?loop.pause():resume();
 const preference=()=>reduced.matches?loop.pause():resume();
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);resume();
 function enter(target){if(busy||closed)return;busy=true;loop.pause();
  if(reduced.matches){navigate(target);return;}
  layer.hidden=false;video.muted=true;video.playbackRate=1;
  let finished=false;const done=()=>{if(finished||closed)return;finished=true;clearTimeout(timer);video.pause();video.onended=null;video.onerror=null;navigate(target);};
  const play=name=>{video.src=media(name);video.load();video.play().catch(done);};
  video.onended=done;
  timer=setTimeout(done,1900);
  play(target==='gallery'?'gallery-fast.mp4':'entrance-fast.mp4');
  video.onerror=done;
 }
 root.querySelectorAll('[data-hx-target]').forEach(node=>node.onclick=e=>{e.preventDefault();enter(node.dataset.hxTarget);});
 return ()=>{closed=true;cleanupLayout();clearTimeout(timer);loop.pause();video.pause();video.removeAttribute('src');video.load();video.onended=null;video.onerror=null;document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);};
}

export function mountSearchLayout(root){
 const shell=root.closest('.shell'),plaque=root.querySelector('.search-plaque-piece'),content=root.querySelector('.search-panel');
 const toggle=shell.querySelector('.search-layout-toggle'),panel=shell.querySelector('.search-layout-panel');
 const values=shell.querySelector('.search-layout-values'),copy=shell.querySelector('.search-layout-copy');
 const key='moon-search-layout-v1',defaults={"plaque":{"x":51.18,"y":10.24,"w":15.2},"content":{"x":41.5,"y":11.98,"w":32.8}};
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
 const state=Object.fromEntries(Object.entries(defaults).map(([name,base])=>[name,{...base,...saved[name]}]));
 let editing=false,gesture=null;
 const data=()=>JSON.stringify(state);
 function paint(){
  for(const [name,node] of [['plaque',plaque],['content',content]]){
   const {x,y,w}=state[name];node.style.left=x+'%';node.style.top=y+'%';node.style.width=w+'%';
  }
  values.textContent=`顶部牌匾: x ${state.plaque.x.toFixed(2)}% · y ${state.plaque.y.toFixed(2)}% · 宽 ${state.plaque.w.toFixed(2)}%\n搜索内容: x ${state.content.x.toFixed(2)}% · y ${state.content.y.toFixed(2)}% · 宽 ${state.content.w.toFixed(2)}%`;
  try{localStorage.setItem(key,data());}catch{}
 }
 function setEditing(on){editing=on;root.classList.toggle('search-layout-editing',on);panel.hidden=!on;toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'收起调整工具':'调整搜索排版';}
 const done=()=>setEditing(false),reset=()=>{for(const name of Object.keys(defaults))Object.assign(state[name],defaults[name]);paint();};
 const copyData=async()=>{try{await navigator.clipboard.writeText(data());copy.textContent='已复制位置数据';}catch{copy.textContent='请截屏发送数值';}setTimeout(()=>copy.textContent='复制位置数据',2000);};
 toggle.addEventListener('click',()=>setEditing(!editing));shell.querySelector('.search-layout-done').onclick=done;
 shell.querySelector('.search-layout-reset').onclick=reset;copy.onclick=copyData;
 const disposers=[];
 for(const [name,node] of [['plaque',plaque],['content',content]]){
  const grip=document.createElement('span');grip.className='search-layout-grip';grip.textContent=name==='plaque'?'拖动牌匾':'拖动搜索组';node.append(grip);
  const size=document.createElement('span');size.className='search-layout-size';size.setAttribute('aria-label','缩放');node.append(size);
  const down=e=>{
   if(!editing||!(e.target===grip||e.target===size||e.target===plaque))return;
   e.preventDefault();e.stopPropagation();const bounds=root.getBoundingClientRect();
   gesture={name,id:e.pointerId,mode:e.target===size?'resize':'move',x:e.clientX,y:e.clientY,start:{...state[name]},width:bounds.width,height:bounds.height};
   node.setPointerCapture(e.pointerId);
  };
  const move=e=>{
   if(gesture?.name!==name||gesture.id!==e.pointerId)return;
   const dx=(e.clientX-gesture.x)/gesture.width*100,dy=(e.clientY-gesture.y)/gesture.height*100;
   if(gesture.mode==='resize')state[name].w=Math.max(8,Math.min(70,gesture.start.w+dx));
   else{state[name].x=Math.max(0,Math.min(95,gesture.start.x+dx));state[name].y=Math.max(0,Math.min(95,gesture.start.y+dy));}
   paint();
  };
  const up=e=>{if(gesture?.name===name&&gesture.id===e.pointerId)gesture=null;};
  node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up);
  disposers.push(()=>{node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);});
 }
 paint();return ()=>{disposers.forEach(fn=>fn());toggle.onclick=null;};
}

export function mountExploreLayout(root){
 const shell=root.closest('.shell'),toggle=shell.querySelector('.explore-layout-toggle'),panel=shell.querySelector('.explore-layout-panel');
 const values=shell.querySelector('.explore-layout-values'),copy=shell.querySelector('.explore-layout-copy');
 const defaults={"mode":{"x":48.6,"y":6.66,"w":8,"s":1},"title":{"x":35,"y":33.5,"w":37,"s":1},"subtitle":{"x":33.56,"y":40.53,"w":37,"s":1},"boxes":{"x":31.6,"y":52.95,"w":40,"s":1},"action":{"x":41.72,"y":82,"w":20,"s":1},"box1":{"x":0,"y":0,"w":1,"s":1},"box2":{"x":0,"y":0,"w":1,"s":1},"box3":{"x":0,"y":0,"w":1,"s":1}};
 const nodes={mode:root.querySelector('.explore-mode-title'),title:root.querySelector('.explore-title'),subtitle:root.querySelector('.explore-subtitle'),boxes:root.querySelector('.box-picks'),action:root.querySelector('.explore-action')};
 root.querySelectorAll('.box-pick').forEach((node,i)=>nodes['box'+(i+1)]=node);
 let saved={};try{saved=JSON.parse(localStorage.getItem('moon-explore-layout-v1')||'{}')||{};}catch{}
 const state=Object.fromEntries(Object.entries(defaults).map(([name,base])=>[name,{...base,...saved[name]}]));
 let editing=false,gesture=null;
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 function paint(){
  for(const [name,node] of Object.entries(nodes)){
   const {x,y,w,s}=state[name];
   if(name.startsWith('box')&&name!=='boxes'){
    node.style.setProperty('--edit-x',x+'%');node.style.setProperty('--edit-y',y+'%');node.style.setProperty('--edit-scale',s);
   }else{
    node.style.left=x+'%';node.style.top=y+'%';node.style.width=w+'%';node.style.setProperty('--edit-scale',s);
   }
  }
  values.textContent=Object.entries(state).map(([name,p])=>`${({mode:'牌匾',title:'标题',subtitle:'副标题',boxes:'盒子组',action:'拆盒按钮',box1:'左盒',box2:'中盒',box3:'右盒'})[name]}: x ${p.x.toFixed(2)} · y ${p.y.toFixed(2)} · ${name.startsWith('box')&&name!=='boxes'?'缩放 '+p.s.toFixed(2):'宽 '+p.w.toFixed(2)}`).join('\n');
  try{localStorage.setItem('moon-explore-layout-v1',JSON.stringify(state));}catch{}
 }
 function setEditing(on){editing=on;root.classList.toggle('explore-layout-editing',on);panel.hidden=!on;toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'收起调整工具':'调整盲盒排版';}
 const toggleEdit=()=>setEditing(!editing),done=()=>setEditing(false),reset=()=>{for(const name of Object.keys(defaults))Object.assign(state[name],defaults[name]);paint();};
 const copyData=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(state));copy.textContent='已复制位置数据';}catch{copy.textContent='请截屏发送数值';}setTimeout(()=>copy.textContent='复制位置数据',2000);};
 toggle.addEventListener('click',toggleEdit);shell.querySelector('.explore-layout-done').addEventListener('click',done);
 shell.querySelector('.explore-layout-reset').addEventListener('click',reset);copy.addEventListener('click',copyData);
 const disposers=[];
 for(const [name,node] of Object.entries(nodes)){
  const grip=document.createElement('span');grip.className='explore-layout-grip';grip.textContent=({mode:'牌匾',title:'标题',subtitle:'副标题',boxes:'盒子组',action:'拆盒按钮',box1:'左盒',box2:'中盒',box3:'右盒'})[name];node.append(grip);
  const size=document.createElement('span');size.className='explore-layout-size';size.setAttribute('aria-label','缩放');node.append(size);
  const down=e=>{
   if(!editing||!matchMedia('(min-width:701px)').matches||!(e.target===grip||e.target===size))return;
   e.preventDefault();e.stopPropagation();const bounds=root.getBoundingClientRect(),box=node.getBoundingClientRect();
   gesture={name,id:e.pointerId,mode:e.target===size?'resize':'move',x:e.clientX,y:e.clientY,start:{...state[name]},width:bounds.width,height:bounds.height,boxWidth:box.width};
   node.setPointerCapture(e.pointerId);
  };
  const move=e=>{
   if(gesture?.name!==name||gesture.id!==e.pointerId)return;
   const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,individual=name.startsWith('box')&&name!=='boxes';
   if(gesture.mode==='resize'){
    if(individual)state[name].s=clamp(gesture.start.s+dx/gesture.boxWidth,.45,2);
    else if(name==='boxes')state[name].w=clamp(gesture.start.w+dx/gesture.width*100,15,75);
    else{state[name].w=clamp(gesture.start.w+dx/gesture.width*100,4,75);state[name].s=clamp(gesture.start.s+dx/gesture.boxWidth,.5,2.2);}
   }else if(individual){state[name].x=clamp(gesture.start.x+dx/gesture.boxWidth*100,-250,250);state[name].y=clamp(gesture.start.y+dy/gesture.boxWidth*100,-250,250);}
   else{state[name].x=clamp(gesture.start.x+dx/gesture.width*100,0,95);state[name].y=clamp(gesture.start.y+dy/gesture.height*100,0,95);}
   paint();
  };
  const up=e=>{if(gesture?.name===name&&gesture.id===e.pointerId)gesture=null;};
  const blockClick=e=>{if(editing){e.preventDefault();e.stopPropagation();}};
  node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up);
  if(node.matches('button'))node.addEventListener('click',blockClick,true);
  disposers.push(()=>{node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);if(node.matches('button'))node.removeEventListener('click',blockClick,true);});
 }
 paint();return ()=>{disposers.forEach(fn=>fn());toggle.removeEventListener('click',toggleEdit);shell.querySelector('.explore-layout-done').removeEventListener('click',done);shell.querySelector('.explore-layout-reset').removeEventListener('click',reset);copy.removeEventListener('click',copyData);};
}

export function mountGallery(root,regions){
 const scroller=root.querySelector('.hx-scroller'),grid=root.querySelector('.hx-grid'),range=root.querySelector('.hx-range'),dialog=root.querySelector('.hx-lightbox');
 const large=root.querySelector('.hx-large'),caption=root.querySelector('.hx-caption'),download=root.querySelector('.hx-download'),error=root.querySelector('.hx-image-error');
 const prev=root.querySelector('.hx-prev'),next=root.querySelector('.hx-next');let selected=0,opener=null,swipe=null;
 const items=regions.map(r=>({...r,src:image(r.id)}));
 function visibleRange(){const rect=scroller.getBoundingClientRect(),visible=[...grid.children].filter(c=>{const r=c.getBoundingClientRect();return r.top<rect.bottom-4&&r.bottom>rect.top+4;});range.textContent=visible.length?`${Number(visible[0].dataset.index)+1}–${Number(visible.at(-1).dataset.index)+1} / ${items.length} 个地区`:`${items.length} 个地区`;}
 function render(){const r=items[selected];error.hidden=true;large.src=r.src;large.alt=r.name+'月色';caption.textContent=`${r.name} · ${selected+1} / ${items.length}`;download.href=r.src;download.download=r.name+'-月色.webp';prev.disabled=selected===0;next.disabled=selected===items.length-1;}
 function step(d){selected=Math.max(0,Math.min(items.length-1,selected+d));render();}
 for(const [i,r] of items.entries()){
  const button=document.createElement('button');button.className='hx-card';button.dataset.index=i;button.setAttribute('aria-label','查看'+r.name+'月色');
  const img=new Image();img.src=r.src;img.alt=r.name+'的月亮与小黑';img.loading=i<6?'eager':'lazy';img.decoding='async';
  img.onerror=()=>button.classList.add('failed');const name=document.createElement('span');name.className='hx-name';
  const label=document.createElement('span');label.textContent=r.name;const number=document.createElement('small');number.textContent=String(i+1).padStart(2,'0');name.append(label,number);
  button.append(img,name);button.onclick=()=>{selected=i;opener=button;render();dialog.showModal();};grid.append(button);
 }
 const keydown=e=>{if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}};
 const close=()=>opener?.focus({preventScroll:true});
 const outside=e=>{if(e.target===dialog)dialog.close();};
 const touchstart=e=>{swipe=e.touches[0].clientX;};
 const touchend=e=>{if(swipe===null)return;const dx=e.changedTouches[0].clientX-swipe;if(Math.abs(dx)>55)step(dx<0?1:-1);swipe=null;};
 const resize=()=>visibleRange();
 scroller.addEventListener('scroll',visibleRange,{passive:true});window.addEventListener('resize',resize);
 dialog.addEventListener('keydown',keydown);dialog.addEventListener('close',close);dialog.addEventListener('click',outside);
 large.addEventListener('touchstart',touchstart,{passive:true});large.addEventListener('touchend',touchend,{passive:true});large.onerror=()=>error.hidden=false;
 prev.onclick=()=>step(-1);next.onclick=()=>step(1);root.querySelector('.hx-close').onclick=()=>dialog.close();
 requestAnimationFrame(visibleRange);
 return ()=>{if(dialog.open)dialog.close();scroller.removeEventListener('scroll',visibleRange);window.removeEventListener('resize',resize);dialog.removeEventListener('keydown',keydown);dialog.removeEventListener('close',close);dialog.removeEventListener('click',outside);large.removeEventListener('touchstart',touchstart);large.removeEventListener('touchend',touchend);};
}

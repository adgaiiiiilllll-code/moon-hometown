// Positions and extents follow the illustrated light sources (percent of the scene).
const LIGHTS={
 sichuan:[
  [11.5,33,5,11,'sway'],[41.9,79.3,4.8,3.8,'fire']
 ],
 beijing:[[8.8,52,5.5,9],[80.3,84,2.8,5.5]],
 guangdong:[[86.4,13,7,10],[61.6,34.8,3.2,5.5]],
 shanghai:[[75,26,2.8,7],[65.7,45,1.6,3.5]],
 jiangsu:[[93,29,3.2,10],[73.2,71.5,1.2,2.8]],
 zhejiang:[
  [16.8,32.8,4.8,9],
  [60,69,2.1,3]
 ]
};
export function addSceneLights(stage,id){
 const points=LIGHTS[id];if(!points)return ()=>{};
 const root=document.createElement('div');root.className='scene-lights';root.setAttribute('aria-hidden','true');
 root.dataset.region=id;
 for(const [i,[x,y,w,h,kind='warm']] of points.entries()){
  const light=document.createElement('i');light.className=`scene-light ${kind}`;
  light.style.cssText=`left:${x-w/2}%;top:${y-h/2}%;width:${w}%;height:${h}%;--light-period:${kind==='fire'?2.2:3.6+i%4*.65}s;--light-delay:${-i*.73}s`;
  const core=document.createElement('b');light.append(core);root.append(light);
 }
 stage.insertBefore(root,stage.querySelector('.ambient'));return ()=>root.remove();
}

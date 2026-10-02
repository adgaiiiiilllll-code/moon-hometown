import {REGIONS} from '../site/data.mjs';
export const CHARACTERS=Object.fromEntries(REGIONS.map(r=>[r.id,`${r.name} · 月亮`]));
export const HAS_REGION_FRAMES=new Set(['sichuan','beijing','guangdong','shanghai','jiangsu','zhejiang','tianjin','hebei','shanxi','neimenggu','liaoning','jilin','heilongjiang','anhui','jiangxi','shandong','henan','hubei','guangxi','hainan','chongqing','shaanxi','yunnan','fujian','hunan','gansu','guizhou','xizang']);
// Only edge-connected white is background: dark ears and enclosed eye whites stay intact.
export function clearWhiteBackdrop(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=n=>{if(n<0||n>=w*h||seen[n])return;seen[n]=1;const i=n*4;if(data[i]>242&&data[i+1]>242&&data[i+2]>242){queue[tail++]=n;data[i+3]=0;}};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const n=queue[head++],x=n%w;if(x)visit(n-1);if(x<w-1)visit(n+1);visit(n-w);visit(n+w);}
 return data;
}
export function prepareCharacter(image){
 const w=Math.floor(image.width/2),h=image.height,frames=[];
 let x0=w,y0=h,x1=0,y1=0;
 for(let frame=0;frame<2;frame++){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});
  g.drawImage(image,frame*w,0,w,h,0,0,w,h);const pixels=g.getImageData(0,0,w,h);clearWhiteBackdrop(pixels.data,w,h);g.putImageData(pixels,0,0);
  for(let i=0;i<w*h;i++)if(pixels.data[i*4+3]){const x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  frames.push(c);
 }
 // Use the SAME crop for both cells so accessories don't jump with each bite.
 return frames.map(c=>{const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(c,x0,y0,out.width,out.height,0,0,out.width,out.height);return out;});
}

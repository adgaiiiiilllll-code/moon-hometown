export const DIRS={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]};
export const MAP=['###################','#........#........#','#.##.###.#.###.##.#','#.................#','#.##.#.#####.#.##.#','#....#...#...#....#','###.####.#.####.###','#.................#','###.#.#######.#.###','#...#....#....#...#','#.#####.#.#.#####.#','#.................#','#.##.###.#.###.##.#','#........#........#','###################'];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Base{constructor(rng=Math.random){this.rng=rng;this.events=[];}emit(type,x,y,text){this.events.push({type,x,y,text});}start(){this.reset();this.state='running';}pause(){if(this.state==='running')this.state='paused';else if(this.state==='paused')this.state='running';}drain(){return this.events.splice(0);}end(win){this.state=win?'won':'lost';this.emit(win?'win':'lose',640,350);}}
export class Maze extends Base{
 constructor(rng){super(rng);this.reset();}
 reset(){this.events=[];this.state='ready';this.score=0;this.lives=3;this.power=0;this.tick=0;this.acc=0;this.food=new Map();MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='.')this.food.set(`${x},${y}`,{x,y,big:(x===1||x===17)&&(y===3||y===11)});}));this.food.delete('1,1');this.respawn();}
 free(x,y){return MAP[y]?.[x]==='.';}
 respawn(){this.player={x:1,y:1,dir:'right',next:'right'};this.ghosts=[{x:17,y:13},{x:17,y:1}];this.invincible=12;this.acc=0;this.interval=.16;this.moving=false;this.hitPause=0;}
 direction(dir){if(!DIRS[dir])return;const p=this.player,d=DIRS[p.dir],n=DIRS[dir];
 // Reverse along the same corridor immediately, without snapping to a tile.
 if(this.moving&&this.acc>0&&d[0]===-n[0]&&d[1]===-n[1]){p.x+=d[0];p.y+=d[1];p.dir=dir;this.acc=this.interval-this.acc;}
 p.next=dir;if(!this.moving)this.acc=0;}
 position(){const p=this.player,d=DIRS[p.dir],t=this.moving?this.acc/this.interval:0;return {x:p.x+d[0]*t,y:p.y+d[1]*t,dir:p.dir};}
 ghostPosition(g){const t=clamp((this.tick-(g.movedAt??-3)+this.acc/this.interval)/3,0,1);return {x:(g.fromX??g.x)+(g.x-(g.fromX??g.x))*t,y:(g.fromY??g.y)+(g.y-(g.fromY??g.y))*t};}
 collision(){const p=this.position();for(const g of this.ghosts){if(g.recoverUntil>this.tick)continue;const v=this.ghostPosition(g);if(Math.hypot(v.x-p.x,v.y-p.y)<.62){if(this.power>0){this.score+=50;this.emit('eat',g.x,g.y,'+50');g.x=17;g.y=13;g.fromX=17;g.fromY=13;g.recoverUntil=this.tick+12;}else if(this.invincible===0){this.lives--;this.emit('hurt',this.player.x,this.player.y,'−1');if(this.lives<=0)this.end(false);else{this.respawn();this.hitPause=.45;}return true;}}}return false;}
 step(){this.tick++;this.power=Math.max(0,this.power-1);this.invincible=Math.max(0,this.invincible-1);const p=this.player;let d=DIRS[p.dir];if(this.free(p.x+d[0],p.y+d[1])){p.x+=d[0];p.y+=d[1];}const k=`${p.x},${p.y}`,f=this.food.get(k);if(f){this.food.delete(k);this.score+=f.big?30:10;if(f.big)this.power=45;this.emit('eat',p.x,p.y,f.big?'+30':'+10');}const hit=this.collision();if(this.state!=='running')return;if(!hit&&this.tick%3===0){this.ghosts.forEach(g=>{if(g.recoverUntil>this.tick)return;let options=Object.values(DIRS).map(([dx,dy])=>({x:g.x+dx,y:g.y+dy})).filter(n=>this.free(n.x,n.y));options.sort((a,b)=>{const da=Math.abs(a.x-p.x)+Math.abs(a.y-p.y),db=Math.abs(b.x-p.x)+Math.abs(b.y-p.y);return this.power?db-da:da-db;});g.fromX=g.x;g.fromY=g.y;g.movedAt=this.tick;Object.assign(g,this.rng()<.2?options[Math.floor(this.rng()*options.length)]:options[0]);});this.collision();}if(!this.food.size&&this.state==='running')this.end(true);}
 update(dt){if(this.state!=='running')return;if(this.hitPause>0){this.hitPause=Math.max(0,this.hitPause-dt);return;}let left=dt;
 while(left>1e-9&&this.state==='running'){
  if(this.acc<1e-9){const p=this.player,n=DIRS[p.next];if(this.free(p.x+n[0],p.y+n[1]))p.dir=p.next;const d=DIRS[p.dir];this.moving=this.free(p.x+d[0],p.y+d[1]);}
  const advance=Math.min(left,this.interval-this.acc);this.acc+=advance;left-=advance;
  if(this.acc>=this.interval-1e-9){this.acc=0;this.step();}
 }
 if(this.state==='running')this.collision();
}
}
export const BASKET={rimY:550,halfWidth:53,minX:80,maxX:1080};
export class Catch extends Base{
 constructor(rng){super(rng);this.reset();}
 reset(){this.events=[];this.state='ready';this.score=0;this.lives=3;this.remaining=45;this.x=640;this.target=640;this.items=[];this.spawn=.65;this.invincible=0;this.caught=0;this.combo=0;this.maxCombo=0;this.catchPulse=0;}
 aim(x){this.target=clamp(x,BASKET.minX,BASKET.maxX);}
 update(dt,axis=0){if(this.state!=='running')return;this.remaining=Math.max(0,this.remaining-dt);this.invincible=Math.max(0,this.invincible-dt);this.catchPulse=Math.max(0,this.catchPulse-dt);const previousX=this.x;if(axis){this.x=clamp(this.x+axis*850*dt,BASKET.minX,BASKET.maxX);this.target=this.x;}else this.x+=(this.target-this.x)*(1-Math.exp(-dt*55));if(Math.abs(this.target-this.x)<.01)this.x=this.target;this.spawn-=dt;
  if(this.spawn<=0){const elapsed=45-this.remaining;this.spawn=Math.max(.32,.65-elapsed*.007);const bomb=this.rng()<.24;this.items.push({x:100+this.rng()*960,y:105,r:bomb?23:25,speed:165+elapsed*3+this.rng()*65,bomb,spin:this.rng()*6});}
  this.items=this.items.filter(item=>{const previous=item.y;item.y+=item.speed*dt;item.spin+=dt*.5;const crossing=(BASKET.rimY-item.r-previous)/(item.y-previous);const basketX=previousX+(this.x-previousX)*clamp(crossing,0,1);if(previous+item.r<BASKET.rimY&&item.y+item.r>=BASKET.rimY&&Math.abs(item.x-basketX)<BASKET.halfWidth+item.r*.4){if(item.bomb){if(!this.invincible){this.lives--;this.combo=0;this.invincible=1.1;this.emit('hurt',this.x,BASKET.rimY-20,'−1');if(this.lives<=0)this.end(false);}}else{this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);const points=10*Math.min(3,1+Math.floor(this.combo/5));this.score+=points;this.caught++;this.catchPulse=.22;this.emit('catch',this.x,BASKET.rimY-20,'+'+points);if(this.combo%5===0)this.emit('combo',this.x,530,this.combo+' 连击！');}return false;}if(item.y>=755&&!item.bomb){this.combo=0;this.emit('drop',item.x,675,'漏接');}return item.y<755;});if(this.remaining<=0&&this.state==='running')this.end(true);
 }
}
export const SLING={x:220,y:484,g:680,scale:7.5,maxPull:118};
export function velocity(pull){let dx=SLING.x-pull.x,dy=SLING.y-pull.y;const distance=Math.hypot(dx,dy);if(distance>SLING.maxPull){dx*=SLING.maxPull/distance;dy*=SLING.maxPull/distance;}return {vx:dx*SLING.scale,vy:dy*SLING.scale};}
export function pathPoint(v,t){return {x:SLING.x+v.vx*t,y:SLING.y+v.vy*t+.5*SLING.g*t*t};}
export function circleBox(x,y,r,b){const cx=clamp(x,b.x,b.x+b.w),cy=clamp(y,b.y,b.y+b.h);return (x-cx)**2+(y-cy)**2<=r*r;}
export class Sling extends Base{
 constructor(rng){super(rng);this.reset();}
 reset(level=1){this.events=[];this.state='ready';this.level=level;this.score=0;this.shots=level+4;this.ball=null;this.rearm=0;this.impact=null;this.trail=[];this.pull={x:128,y:541};this.target={x:1100,y:474,r:34};this.blocks=[];for(let col=0;col<level;col++)for(let row=0;row<3;row++)this.blocks.push({x:820+col*64,y:454-row*60,w:58,h:58});}
 start(){this.reset(this.level||1);this.state='running';}
 nextLevel(){if(this.state==='won'&&this.level<3){const n=this.level+1;this.reset(n);this.state='running';}}
 aim(x,y){if(this.state!=='running'||this.ball||this.rearm>0)return;let dx=clamp(x-SLING.x,-118,-5),dy=clamp(y-SLING.y,-35,118);const length=Math.hypot(dx,dy);if(length>118){dx*=118/length;dy*=118/length;}this.pull={x:SLING.x+dx,y:SLING.y+dy};}
 fire(){if(this.state!=='running'||this.ball||this.rearm>0||this.shots<=0)return false;const v=velocity(this.pull);if(Math.hypot(v.vx,v.vy)<80)return false;this.shots--;this.trail=[];this.impact=null;this.ball={x:SLING.x,y:SLING.y,...v,r:23,t:0};this.emit('launch',SLING.x,SLING.y);return true;}
 update(dt){if(this.state!=='running')return;if(this.impact){this.impact.life-=dt;if(this.impact.life<=0)this.impact=null;}if(this.rearm>0){this.rearm-=dt;if(this.rearm<=0&&this.shots===0)this.end(false);}if(!this.ball)return;const steps=Math.ceil(dt/(1/180)),h=dt/steps;for(let i=0;i<steps&&this.ball;i++){const b=this.ball;b.t+=h;b.x+=b.vx*h;b.y+=b.vy*h+.5*SLING.g*h*h;b.vy+=SLING.g*h;
  const hit=this.blocks.findIndex(w=>circleBox(b.x,b.y,b.r,w));
  if(hit!==-1){const w=this.blocks.splice(hit,1)[0];this.score+=20;this.emit('break',w.x+29,w.y+29,'撞碎 +20');this.impact={x:b.x,y:b.y,life:.4};this.ball=null;this.rearm=.65;break;}
  if(i===0){this.trail.push({x:b.x,y:b.y});if(this.trail.length>22)this.trail.shift();}
  if(Math.hypot(b.x-this.target.x,b.y-this.target.y)<b.r+this.target.r){this.score+=100;this.ball=null;this.end(true);break;}
  if(b.x>1320||b.x< -60||b.y>760||b.t>5||(((b.x<430&&b.y+b.r>=592)||(b.x>795&&b.y+b.r>=520))&&b.vy>0)){this.emit('miss',b.x,Math.min(b.y,610));this.ball=null;this.rearm=.65;}
 }}
}

const SKILL_INTERVAL=5,SPEED=170,W=600,R=30,CURRY_DMG=15,CURRY_DASH=30,POOP_DMG=50,PUNCH_DMG=50,PUNCH_RANGE=90,COMBO_CHANCE=0.4;
const cv=document.getElementById('c'),g=cv.getContext('2d');
const imgs={};['ai_base','ai_evo','bonjun'].forEach(n=>{const i=new Image();i.src=n+'.jpg';imgs[n]=i});
let P,shots,fists,texts,over,keys={},last=performance.now();
const rnd=(a,b)=>a+Math.random()*(b-a);

function init(){
  let a,b;
  do{a={x:rnd(R,W-R),y:rnd(R,W-R)};b={x:rnd(R,W-R),y:rnd(R,W-R)}}while(Math.hypot(a.x-b.x,a.y-b.y)<200);
  P=[{name:'안이령',img:'ai_base',evo:false,color:'#e0a030',cd:SKILL_INTERVAL,...a},
     {name:'구본준',img:'bonjun',evo:false,color:'#5fb4e8',cd:SKILL_INTERVAL,...b}];
  P.forEach(p=>{p.hp=300;p.max=300;p.dash=0;p.da=0;const d=rnd(.3,1.2)+Math.floor(Math.random()*4)*Math.PI/2;p.vx=Math.cos(d)*SPEED;p.vy=Math.sin(d)*SPEED});
  shots=[];fists=[];texts=[];over=false;
  document.getElementById('over').hidden=true;
  P.forEach((_,i)=>hud(i));
}
function hud(i){
  const p=P[i],c=document.getElementById('p'+i);
  c.querySelector('.av').src=p.img+'.jpg';
  c.querySelector('.nm').textContent=p.name;
  c.querySelector('.bar i').style.width=(p.hp/p.max*100)+'%';
  c.querySelector('.hp').textContent=p.hp+' / '+p.max;
}
function say(s,x,y,col='#fff'){texts.push({s,x,y,t:1,col})}

function damage(i,d){
  const p=P[i];p.hp=Math.max(0,p.hp-d);p.flash=.15;say('-'+d,p.x,p.y-R-18,'#ff6b6b');
  if(i===0&&!p.evo&&p.hp>0&&p.hp<=100){p.evo=true;p.img='ai_evo';say('진화!',p.x,p.y-R-40,'#ffd54a')}
  hud(i);
  if(p.hp<=0){over=true;document.getElementById('msg').textContent=P[1-i].name+' 승리!';document.getElementById('over').hidden=false}
}

let ac;
function thud(){
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();
  const t=ac.currentTime,o=ac.createOscillator(),gn=ac.createGain();
  o.type='square';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);
  gn.gain.setValueAtTime(.35,t);gn.gain.exponentialRampToValueAtTime(.001,t+.14);
  o.connect(gn).connect(ac.destination);o.start(t);o.stop(t+.15);
  const n=ac.createBufferSource(),buf=ac.createBuffer(1,2205,44100),d=buf.getChannelData(0);
  for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*(1-k/d.length);
  n.buffer=buf;const g2=ac.createGain();g2.gain.value=.3;n.connect(g2).connect(ac.destination);n.start(t);}catch(e){}
}

function punch(i){
  const p=P[i],o=P[1-i],a=Math.atan2(o.y-p.y,o.x-p.x);
  fists.push({i,a,t:.18});thud();
  if(Math.hypot(o.x-p.x,o.y-p.y)<=PUNCH_RANGE){damage(1-i,PUNCH_DMG);return true}
  return false;
}
function skill(i){
  if(over)return;const p=P[i],o=P[1-i];
  const a=Math.atan2(o.y-p.y,o.x-p.x);
  if(i===0&&!p.evo){
    shots.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,dmg:CURRY_DMG,t:'curry',o:0,r:0});
    p.dash=CURRY_DASH;p.da=a;
  }else if(i===0){
    for(let k=0;k<8;k++){const b=k*Math.PI/4;
      shots.push({x:p.x,y:p.y,vx:Math.cos(b)*380,vy:Math.sin(b)*380,dmg:POOP_DMG,t:'poop',o:0,r:0})}
    
  }else{
    
    if(punch(1)&&Math.random()<COMBO_CHANCE){
      say('우다다!',p.x,p.y-R-40,'#ffd54a');
      const n=3+Math.floor(Math.random()*3);
      for(let k=1;k<=n;k++)setTimeout(()=>{if(!over)punch(1)},k*130);
    }
  }
}

function update(dt){
  P.forEach((p,i)=>{
    p.cd-=dt;p.flash=(p.flash||0)-dt;
    if(p.cd<=0){p.cd+=SKILL_INTERVAL;skill(i)}
    document.querySelectorAll('.sk')[i].textContent='스킬 '+Math.max(0,p.cd).toFixed(1)+'초';
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.dash>0){const s=Math.min(p.dash,500*dt);p.x+=Math.cos(p.da)*s;p.y+=Math.sin(p.da)*s;p.dash-=s}
    if(p.x<R){p.x=R;p.vx=Math.abs(p.vx)}else if(p.x>W-R){p.x=W-R;p.vx=-Math.abs(p.vx)}
    if(p.y<R){p.y=R;p.vy=Math.abs(p.vy)}else if(p.y>W-R){p.y=W-R;p.vy=-Math.abs(p.vy)}
  });
  shots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=dt*10;
    if(!s.dead&&Math.hypot(P[1].x-s.x,P[1].y-s.y)<R+12){s.dead=true;damage(1,s.dmg)}});
  shots=shots.filter(s=>!s.dead&&s.x>-30&&s.x<W+30&&s.y>-30&&s.y<W+30);
  fists.forEach(f=>f.t-=dt);fists=fists.filter(f=>f.t>0);
  texts.forEach(t=>{t.t-=dt;t.y-=25*dt});texts=texts.filter(t=>t.t>0);
}

function drawCurry(s){
  g.save();g.translate(s.x,s.y);g.rotate(s.r);
  g.fillStyle='#8a5a12';g.beginPath();g.arc(0,0,12,0,7);g.fill();
  g.fillStyle='#c98a1c';[[-4,-4,5],[5,2,4],[-3,6,3]].forEach(([a,b,r])=>{g.beginPath();g.arc(a,b,r,0,7);g.fill()});
  g.fillStyle='#e8d28a';g.fillRect(-2,-9,4,4);g.restore();
}
function drawPoop(s){
  g.save();g.translate(s.x,s.y);g.rotate(s.r);g.fillStyle='#6b3f1d';
  [[0,8,13,7],[0,0,10,6],[0,-7,6,5]].forEach(([a,b,rx,ry])=>{g.beginPath();g.ellipse(a,b,rx,ry,0,0,7);g.fill()});
  g.beginPath();g.moveTo(-3,-11);g.lineTo(3,-16);g.lineTo(4,-9);g.fill();
  g.fillStyle='#fff';g.beginPath();g.arc(-4,0,2.5,0,7);g.arc(4,0,2.5,0,7);g.fill();
  g.fillStyle='#000';g.beginPath();g.arc(-4,0,1.2,0,7);g.arc(4,0,1.2,0,7);g.fill();g.restore();
}
function drawFist(f){
  const p=P[f.i];g.save();g.translate(p.x+Math.cos(f.a)*(R+22),p.y+Math.sin(f.a)*(R+22));g.rotate(f.a);
  g.fillStyle='#f2c29b';g.strokeStyle='#8a5a3a';g.lineWidth=2;
  g.beginPath();g.roundRect(-14,-14,28,28,8);g.fill();g.stroke();
  g.beginPath();[-5,1,7].forEach(y=>{g.moveTo(2,y);g.lineTo(13,y)});g.stroke();g.restore();
}
function draw(){
  g.clearRect(0,0,W,W);
  g.strokeStyle='#ffffff14';g.lineWidth=1;
  for(let k=50;k<W;k+=50){g.beginPath();g.moveTo(k,0);g.lineTo(k,W);g.moveTo(0,k);g.lineTo(W,k);g.stroke()}
  P.forEach(p=>{
    g.save();g.beginPath();g.arc(p.x,p.y,R,0,7);g.clip();
    if(imgs[p.img].complete)g.drawImage(imgs[p.img],p.x-R,p.y-R,R*2,R*2);else{g.fillStyle=p.color;g.fill()}
    if(p.flash>0){g.fillStyle='#ff000066';g.fillRect(p.x-R,p.y-R,R*2,R*2)}
    g.restore();
    g.strokeStyle=p.color;g.lineWidth=4;g.beginPath();g.arc(p.x,p.y,R,0,7);g.stroke();
    g.fillStyle='#111';g.fillRect(p.x-30,p.y-R-14,60,7);
    g.fillStyle=p.color;g.fillRect(p.x-30,p.y-R-14,60*p.hp/p.max,7);
    g.fillStyle='#fff';g.font='13px Jua, sans-serif';g.textAlign='center';g.fillText(p.hp,p.x,p.y+R+16);
  });
  shots.forEach(s=>s.t==='curry'?drawCurry(s):drawPoop(s));
  fists.forEach(drawFist);
  texts.forEach(t=>{g.globalAlpha=Math.max(0,t.t);g.fillStyle=t.col;g.font='bold 18px Jua, sans-serif';g.textAlign='center';g.fillText(t.s,t.x,t.y)});
  g.globalAlpha=1;
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!over)update(dt);draw();requestAnimationFrame(loop)}

document.querySelectorAll('.sk').forEach(b=>b.disabled=true);
document.getElementById('again').onclick=init;
init();requestAnimationFrame(loop);

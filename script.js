const W=600,R=30,BASE=170,SPEEDS=[BASE*1.3,BASE*.7],INTERVALS=[3,4];
const CURRY_DMG=15,CURRY_DASH=30,POOP_DMG=50,PUNCH_DMG=50,PUNCH_RANGE=180,GIANT_CHANCE=.15,GIANT_DMG=100,GIANT_RANGE=420,GIANT_TRAVEL=520,POOP_TIME=6,COMBO_CHANCE=.4,PENCIL_DMG=50,PENCIL_CHANCE=.2,BEAM_W=40,HOMING_CHANCE=.2,HOMING_COUNT=10,HOMING_HIT=.7,HOMING_DMG=15,HOMING_BONUS=30;
const cv=document.getElementById('c'),g=cv.getContext('2d');
const imgs={};['ai_base.jpg','ai_evo.jpg','bonjun.jpg','fist.png','curry.png','pencil.png'].forEach(n=>{const i=new Image();i.src=n;imgs[n.split('.')[0]]=i});
let P,shots,fists,beams,pens,texts,over,started=false,last=performance.now();
const rnd=(a,b)=>a+Math.random()*(b-a);

function hpColor(hp,max){const r=hp/max;return r>.75?'#2db34a':r>.5?'#f08a00':r>.25?'#f2d600':'#e02020'}
function init(){
  let a,b;
  do{a={x:rnd(R,W-R),y:rnd(R,W-R)};b={x:rnd(R,W-R),y:rnd(R,W-R)}}while(Math.hypot(a.x-b.x,a.y-b.y)<200);
  P=[{name:'안이령',img:'ai_base',evo:false,...a},{name:'구본준',img:'bonjun',evo:false,...b}];
  P.forEach((p,i)=>{p.hp=300;p.max=300;p.dash=0;p.da=0;p.cd=INTERVALS[i];
    const d=rnd(.3,1.2)+Math.floor(Math.random()*4)*Math.PI/2;p.vx=Math.cos(d)*SPEEDS[i];p.vy=Math.sin(d)*SPEEDS[i]});
  shots=[];fists=[];beams=[];pens=[];texts=[];over=false;document.getElementById('giant').hidden=true;
  document.getElementById('over').hidden=true;
  P.forEach((_,i)=>hud(i));
}
function hud(i){
  const p=P[i],c=document.getElementById('p'+i),bar=c.querySelector('.bar i');
  c.querySelector('.av').src=p.img+'.jpg';
  c.querySelector('.nm').textContent=p.name;
  bar.style.width=(p.hp/p.max*100)+'%';bar.style.background=hpColor(p.hp,p.max);
  c.querySelector('.hp').textContent=p.hp+' / '+p.max;
}
function say(s,x,y,col){texts.push({s,x,y,t:1,col})}

function damage(i,d){
  const p=P[i];p.hp=Math.max(0,p.hp-d);p.flash=.15;say('-'+d,p.x,p.y-R-18,'#d00000');
  if(i===0&&!p.evo&&p.hp>0&&p.hp<=100){p.evo=true;p.img='ai_evo';say('진화!',p.x,p.y-R-40,'#b8860b')}
  hud(i);
  if(p.hp<=0){over=true;document.getElementById('msg').textContent=P[1-i].name+' 승리!';document.getElementById('over').hidden=false}
}

let ac;
function impact(){
  try{if(!ac)return;const t=ac.currentTime,m=ac.createGain();m.gain.value=.9;m.connect(ac.destination);
  const o=ac.createOscillator(),og=ac.createGain();o.type='sine';
  o.frequency.setValueAtTime(170,t);o.frequency.exponentialRampToValueAtTime(38,t+.2);
  og.gain.setValueAtTime(1,t);og.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(og).connect(m);o.start(t);o.stop(t+.25);
  const len=ac.sampleRate*.12,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
  for(let k=0;k<len;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/len,3);
  const n=ac.createBufferSource(),hf=ac.createBiquadFilter(),ng=ac.createGain();
  n.buffer=buf;hf.type='highpass';hf.frequency.value=900;ng.gain.value=.8;n.connect(hf).connect(ng).connect(m);n.start(t);
  const q=ac.createOscillator(),qg=ac.createGain();q.type='square';
  q.frequency.setValueAtTime(95,t);q.frequency.exponentialRampToValueAtTime(45,t+.1);
  qg.gain.setValueAtTime(.35,t);qg.gain.exponentialRampToValueAtTime(.001,t+.12);q.connect(qg).connect(m);q.start(t);q.stop(t+.14);}catch(e){}
}

function giantPunch(){
  const p=P[1],o=P[0],a=Math.atan2(o.y-p.y,o.x-p.x),k=document.getElementById('arena').clientWidth/W,el=document.getElementById('giant');
  el.hidden=false;el.style.width=el.style.height=(100*k)+'px';el.style.left=(p.x*k)+'px';el.style.top=(p.y*k)+'px';
  const end=`translate(calc(-50% + ${Math.cos(a)*GIANT_TRAVEL*k}px),calc(-50% + ${Math.sin(a)*GIANT_TRAVEL*k}px)) scale(3.8)`;
  const an=el.animate([{transform:'translate(-50%,-50%) scale(.45)',opacity:1},{transform:end,opacity:1,offset:.75},{transform:end,opacity:0}],{duration:900,easing:'ease-out'});
  an.onfinish=()=>{el.hidden=true};
  say('거대 주먹!',p.x,p.y-R-30,'#b8860b');impact();
  setTimeout(()=>{if(over)return;impact();if(Math.hypot(o.x-p.x,o.y-p.y)<=GIANT_RANGE)damage(0,GIANT_DMG)},250);
}
function punch(){
  const p=P[1],o=P[0],a=Math.atan2(o.y-p.y,o.x-p.x);
  fists.push({a,t:.2});impact();
  if(Math.hypot(o.x-p.x,o.y-p.y)<=PUNCH_RANGE){damage(0,PUNCH_DMG);return true}
  return false;
}
function pencil(){
  const p=P[1],o=P[0];beams.push({x:p.x,y:p.y,t:.6});impact();
  if(Math.abs(o.x-p.x)<=BEAM_W/2+R||Math.abs(o.y-p.y)<=BEAM_W/2+R)damage(0,PENCIL_DMG);
}
function homing(){
  const p=P[1],batch={total:HOMING_COUNT,done:0,hits:0};impact();
  for(let k=0;k<HOMING_COUNT;k++)pens.push({x:p.x,y:p.y,a:rnd(0,Math.PI*2),delay:k*.08,t:0,hit:Math.random()<HOMING_HIT,batch});
}
function resolve(s,hit){
  if(s.done||over)return;s.done=true;const b=s.batch;b.done++;
  if(hit){b.hits++;damage(0,HOMING_DMG)}
  if(b.done===b.total&&b.hits===b.total&&!over){say('전부 명중!',P[0].x,P[0].y-R-40,'#b8860b');damage(0,HOMING_BONUS)}
}
function skill(i){
  if(over)return;const p=P[i],o=P[1-i];
  const a=Math.atan2(o.y-p.y,o.x-p.x);
  if(i===0&&!p.evo){
    shots.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,dmg:CURRY_DMG,t:'curry',r:0});
    p.dash=CURRY_DASH;p.da=a;
  }else if(i===0){
    for(let k=0;k<8;k++){const b=k*Math.PI/4;
      shots.push({x:p.x,y:p.y,vx:Math.cos(b)*380,vy:Math.sin(b)*380,dmg:POOP_DMG,t:'poop',r:0,life:POOP_TIME})}
  }else if((rr=>rr<PENCIL_CHANCE?(pencil(),0):rr<PENCIL_CHANCE+HOMING_CHANCE?(homing(),0):1)(Math.random())&&(Math.random()<GIANT_CHANCE?(giantPunch(),false):punch())&&Math.random()<COMBO_CHANCE){
    const n=3+Math.floor(Math.random()*3);
    for(let k=1;k<=n;k++)setTimeout(()=>{if(!over)punch()},k*130);
  }
}

function update(dt){
  P.forEach((p,i)=>{
    p.cd-=dt;p.flash=(p.flash||0)-dt;
    if(p.cd<=0){p.cd+=INTERVALS[i];skill(i)}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.dash>0){const s=Math.min(p.dash,500*dt);p.x+=Math.cos(p.da)*s;p.y+=Math.sin(p.da)*s;p.dash-=s}
    if(p.x<R){p.x=R;p.vx=Math.abs(p.vx)}else if(p.x>W-R){p.x=W-R;p.vx=-Math.abs(p.vx)}
    if(p.y<R){p.y=R;p.vy=Math.abs(p.vy)}else if(p.y>W-R){p.y=W-R;p.vy=-Math.abs(p.vy)}
  });
  shots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=dt*10;
    if(s.t==='poop'){s.life-=dt;
      if(s.x<12){s.x=12;s.vx=Math.abs(s.vx)}else if(s.x>W-12){s.x=W-12;s.vx=-Math.abs(s.vx)}
      if(s.y<12){s.y=12;s.vy=Math.abs(s.vy)}else if(s.y>W-12){s.y=W-12;s.vy=-Math.abs(s.vy)}}
    if(!s.dead&&Math.hypot(P[1].x-s.x,P[1].y-s.y)<R+12){s.dead=true;damage(1,s.dmg)}});
  shots=shots.filter(s=>!s.dead&&(s.t==='poop'?s.life>0:(s.x>-40&&s.x<W+40&&s.y>-40&&s.y<W+40)));
  pens.forEach(s=>{
    if(s.done)return;
    if(s.delay>0){s.delay-=dt;s.x=P[1].x;s.y=P[1].y;return}
    s.t+=dt;const o=P[0],dist=Math.hypot(o.x-s.x,o.y-s.y);
    if(s.hit||dist>110){let d=Math.atan2(o.y-s.y,o.x-s.x)-s.a;d=Math.atan2(Math.sin(d),Math.cos(d));s.a+=Math.max(-8*dt,Math.min(8*dt,d))}
    s.x+=Math.cos(s.a)*340*dt;s.y+=Math.sin(s.a)*340*dt;
    if(s.hit&&(dist<R+6||s.t>2.5))resolve(s,true);
    else if(!s.hit&&s.t>2)resolve(s,false);
  });
  pens=pens.filter(s=>!s.done);
  fists.forEach(f=>f.t-=dt);fists=fists.filter(f=>f.t>0);
  beams.forEach(b=>b.t-=dt);beams=beams.filter(b=>b.t>0);
  texts.forEach(t=>{t.t-=dt;t.y-=25*dt});texts=texts.filter(t=>t.t>0);
}

const ok=i=>i.complete&&i.naturalWidth;
function drawCurry(s){
  if(!ok(imgs.curry))return;
  g.save();g.translate(s.x,s.y);g.rotate(s.r);g.drawImage(imgs.curry,-22,-15,44,30);g.restore();
}
function drawPoop(s){
  g.save();g.translate(s.x,s.y);g.rotate(s.r);g.fillStyle='#6b3f1d';
  [[0,8,13,7],[0,0,10,6],[0,-7,6,5]].forEach(([a,b,rx,ry])=>{g.beginPath();g.ellipse(a,b,rx,ry,0,0,7);g.fill()});
  g.beginPath();g.moveTo(-3,-11);g.lineTo(3,-16);g.lineTo(4,-9);g.fill();
  g.fillStyle='#fff';g.beginPath();g.arc(-4,0,2.5,0,7);g.arc(4,0,2.5,0,7);g.fill();
  g.fillStyle='#000';g.beginPath();g.arc(-4,0,1.2,0,7);g.arc(4,0,1.2,0,7);g.fill();g.restore();
}
function drawFist(f){
  if(!ok(imgs.fist))return;const p=P[1],sz=44+(.2-f.t)*60;
  g.drawImage(imgs.fist,p.x+Math.cos(f.a)*(R+24)-sz/2,p.y+Math.sin(f.a)*(R+24)-sz/2,sz,sz);
}
function drawBeam(b){
  if(!ok(imgs.pencil))return;g.globalAlpha=Math.min(1,b.t/.25);
  g.drawImage(imgs.pencil,b.x-BEAM_W/2,0,BEAM_W,W);
  g.save();g.translate(W/2,b.y);g.rotate(Math.PI/2);g.drawImage(imgs.pencil,-BEAM_W/2,-W/2,BEAM_W,W);g.restore();
  g.globalAlpha=1;
}
function draw(){
  g.clearRect(0,0,W,W);
  g.strokeStyle='#00000014';g.lineWidth=1;
  for(let k=50;k<W;k+=50){g.beginPath();g.moveTo(k,0);g.lineTo(k,W);g.moveTo(0,k);g.lineTo(W,k);g.stroke()}
  beams.forEach(drawBeam);
  P.forEach(p=>{
    g.save();g.beginPath();g.arc(p.x,p.y,R,0,7);g.clip();
    if(ok(imgs[p.img]))g.drawImage(imgs[p.img],p.x-R,p.y-R,R*2,R*2);else{g.fillStyle='#ccc';g.fill()}
    if(p.flash>0){g.fillStyle='#ff000066';g.fillRect(p.x-R,p.y-R,R*2,R*2)}
    g.restore();
    g.strokeStyle='#111';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,R,0,7);g.stroke();
    g.fillStyle='#ddd';g.fillRect(p.x-30,p.y-R-14,60,7);
    g.fillStyle=hpColor(p.hp,p.max);g.fillRect(p.x-30,p.y-R-14,60*p.hp/p.max,7);
    g.strokeStyle='#111';g.lineWidth=1;g.strokeRect(p.x-30,p.y-R-14,60,7);
    g.fillStyle='#111';g.font='13px Malgun Gothic, sans-serif';g.textAlign='center';g.fillText(p.hp,p.x,p.y+R+16);
  });
  shots.forEach(s=>s.t==='curry'?drawCurry(s):drawPoop(s));
  fists.forEach(drawFist);
  if(ok(imgs.pencil))pens.forEach(s=>{if(s.delay>0)return;g.save();g.translate(s.x,s.y);g.rotate(s.a+Math.PI/2);g.drawImage(imgs.pencil,-4,-16,8,32);g.restore()});
  texts.forEach(t=>{g.globalAlpha=Math.max(0,t.t);g.fillStyle=t.col;g.font='bold 18px Malgun Gothic, sans-serif';g.textAlign='center';g.fillText(t.s,t.x,t.y)});
  g.globalAlpha=1;
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(started&&!over)update(dt);draw();requestAnimationFrame(loop)}

document.getElementById('go').onclick=()=>{
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();ac.resume()}catch(e){}
  started=true;document.getElementById('start').hidden=true;
};
document.getElementById('again').onclick=init;
init();requestAnimationFrame(loop);

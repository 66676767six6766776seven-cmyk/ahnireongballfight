const W=600,R=30,BASE=170;
const CH={ai:{name:'안이령',img:'ai_base',sp:BASE*1.3,iv:3},bj:{name:'구본준',img:'bonjun',sp:BASE*.7,iv:4},cd:{name:'마법왕자님 최단유',img:'choi',sp:BASE,iv:5}};
const CURRY_DMG=30,CURRY_DASH=90,REGEN=2,POOP_DMG=50,POOP_TIME=6;
const PUNCH_DMG=50,PUNCH_RANGE=180,COMBO_CHANCE=.4,GIANT_CHANCE=.15,GIANT_DMG=100,GIANT_RANGE=420,GIANT_TRAVEL=520;
const PENCIL_DMG=50,PENCIL_CHANCE=.2,BEAM_W=40,HOMING_CHANCE=.2,HOMING_COUNT=10,HOMING_HIT=.7,HOMING_DMG=15,HOMING_BONUS=30;
const CIRCLE_CHANCE=.15,CIRCLE_HEAL=50,CIRCLE_DPS=10,CIRCLE_R=350,CIRCLE_TIME=5;
const SPIN_TIME=2,SPIN_MULT=3,SPIN_DMG=20,SWING_DMG=30,SWING_RANGE=130,GNOME_COUNT=5,GNOME_DMG=20,GNOME_TIME=5;
const cv=document.getElementById('c'),g=cv.getContext('2d');
const imgs={};['ai_base.jpg','ai_evo.jpg','bonjun.jpg','choi.jpg','gnome.jpg','fist.png','curry.png','pencil.png','staff.png'].forEach(n=>{const i=new Image();i.src=n;imgs[n.split('.')[0]]=i});
let sel=['ai','bj'],P,shots,fists,beams,pens,circles,gnomes,texts,over,gen=0,started=false,last=performance.now();
const rnd=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ok=i=>i.complete&&i.naturalWidth;

function hpColor(hp,max){const r=hp/max;return r>.75?'#2db34a':r>.5?'#f08a00':r>.25?'#f2d600':'#e02020'}
function init(){
  gen++;let a,b;
  do{a={x:rnd(R,W-R),y:rnd(R,W-R)};b={x:rnd(R,W-R),y:rnd(R,W-R)}}while(dist(a,b)<200);
  P=[a,b].map((pos,i)=>{const c=CH[sel[i]],d=rnd(.3,1.2)+Math.floor(Math.random()*4)*Math.PI/2;
    return{k:sel[i],name:c.name,img:c.img,sp:c.sp,iv:c.iv,evo:false,...pos,hp:300,max:300,dash:0,da:0,cd:c.iv,rot:0,vx:Math.cos(d)*c.sp,vy:Math.sin(d)*c.sp}});
  shots=[];fists=[];beams=[];pens=[];circles=[];gnomes=[];texts=[];over=false;
  document.getElementById('giant').hidden=true;document.querySelectorAll('.magic').forEach(e=>e.remove());
  document.getElementById('over').hidden=true;P.forEach((_,i)=>hud(i));
}
function hud(i){
  const p=P[i],c=document.getElementById('p'+i),bar=c.querySelector('.bar i');
  c.querySelector('.av').src=p.img+'.jpg';c.querySelector('.nm').textContent=p.name;
  bar.style.width=(p.hp/p.max*100)+'%';bar.style.background=hpColor(p.hp,p.max);
  c.querySelector('.hp').textContent=p.hp+' / '+p.max;
}
function say(s,x,y,col){texts.push({s,x,y,t:1,col})}
function damage(i,d){
  if(over)return;const p=P[i];p.hp=Math.max(0,p.hp-d);p.flash=.15;say('-'+d,p.x,p.y-R-18,'#d00000');
  if(p.k==='ai'&&!p.evo&&p.hp>0&&p.hp<=100){p.evo=true;p.img='ai_evo';say('진화!',p.x,p.y-R-40,'#b8860b')}
  hud(i);
  if(p.hp<=0){over=true;document.getElementById('msg').textContent=P[1-i].name+' 승리!';document.getElementById('over').hidden=false}
}

/* sounds */
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
function tone(f,t0,d,v){const o=ac.createOscillator(),n=ac.createGain();o.frequency.value=f;
  n.gain.setValueAtTime(0,t0);n.gain.linearRampToValueAtTime(v,t0+.05);n.gain.exponentialRampToValueAtTime(.001,t0+d);
  o.connect(n).connect(ac.destination);o.start(t0);o.stop(t0+d+.05)}
function holy(n){try{if(!ac)return;const t=ac.currentTime;[523,659,784,1047,1319,1568].slice(0,n).forEach((f,k)=>{tone(f,t+k*.12,1.6,.18);tone(f*2,t+k*.12,1.2,.05)})}catch(e){}}
function wind(dur){
  try{if(!ac)return;const t=ac.currentTime,len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
  for(let k=0;k<len;k++)d[k]=Math.random()*2-1;
  const s=ac.createBufferSource(),bp=ac.createBiquadFilter(),n=ac.createGain();s.buffer=buf;s.loop=true;bp.type='bandpass';bp.Q.value=1.2;
  bp.frequency.setValueAtTime(500,t);bp.frequency.linearRampToValueAtTime(1500,t+dur/2);bp.frequency.linearRampToValueAtTime(500,t+dur);
  n.gain.setValueAtTime(0,t);n.gain.linearRampToValueAtTime(.6,t+.2);n.gain.linearRampToValueAtTime(0,t+dur);
  s.connect(bp).connect(n).connect(ac.destination);s.start(t);s.stop(t+dur);}catch(e){}
}

/* 안이령 */
function aiSkill(i){
  const p=P[i],o=P[1-i],a=Math.atan2(o.y-p.y,o.x-p.x);
  if(!p.evo){shots.push({o:i,x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,dmg:CURRY_DMG,t:'curry',r:0});p.dash=CURRY_DASH;p.da=a}
  else for(let k=0;k<8;k++){const b=k*Math.PI/4;
    shots.push({o:i,x:p.x,y:p.y,vx:Math.cos(b)*380,vy:Math.sin(b)*380,dmg:POOP_DMG,t:'poop',r:0,life:POOP_TIME})}
}
/* 구본준 */
function punch(i){
  const p=P[i],o=P[1-i],a=Math.atan2(o.y-p.y,o.x-p.x);fists.push({i,a,t:.2});impact();
  if(dist(p,o)<=PUNCH_RANGE){damage(1-i,PUNCH_DMG);return true}return false;
}
function giantPunch(i){
  const p=P[i],o=P[1-i],a=Math.atan2(o.y-p.y,o.x-p.x),k=document.getElementById('arena').clientWidth/W,el=document.getElementById('giant'),g0=gen;
  el.hidden=false;el.style.width=el.style.height=(100*k)+'px';el.style.left=(p.x*k)+'px';el.style.top=(p.y*k)+'px';
  const end=`translate(calc(-50% + ${Math.cos(a)*GIANT_TRAVEL*k}px),calc(-50% + ${Math.sin(a)*GIANT_TRAVEL*k}px)) scale(3.8)`;
  el.animate([{transform:'translate(-50%,-50%) scale(.45)',opacity:1},{transform:end,opacity:1,offset:.75},{transform:end,opacity:0}],{duration:900,easing:'ease-out'}).onfinish=()=>{el.hidden=true};
  say('거대 주먹!',p.x,p.y-R-30,'#b8860b');impact();
  setTimeout(()=>{if(over||g0!==gen)return;impact();if(dist(p,o)<=GIANT_RANGE)damage(1-i,GIANT_DMG)},250);
}
function pencil(i){
  const p=P[i],o=P[1-i];beams.push({x:p.x,y:p.y,t:.6});impact();
  if(Math.abs(o.x-p.x)<=BEAM_W/2+R||Math.abs(o.y-p.y)<=BEAM_W/2+R)damage(1-i,PENCIL_DMG);
}
function homing(i){
  const p=P[i],batch={total:HOMING_COUNT,done:0,hits:0};impact();
  for(let k=0;k<HOMING_COUNT;k++)pens.push({o:i,x:p.x,y:p.y,a:rnd(0,Math.PI*2),delay:k*.08,t:0,hit:Math.random()<HOMING_HIT,batch});
}
function resolve(s,hit){
  if(s.done||over)return;s.done=true;const b=s.batch,oi=1-s.o;b.done++;
  if(hit){b.hits++;damage(oi,HOMING_DMG)}
  if(b.done===b.total&&b.hits===b.total&&!over){say('전부 명중!',P[oi].x,P[oi].y-R-40,'#b8860b');damage(oi,HOMING_BONUS)}
}
function bjSkill(i){
  const r=Math.random(),g0=gen;
  if(r<PENCIL_CHANCE)pencil(i);else if(r<PENCIL_CHANCE+HOMING_CHANCE)homing(i);
  else if(Math.random()<GIANT_CHANCE)giantPunch(i);
  else if(punch(i)&&Math.random()<COMBO_CHANCE){
    const n=3+Math.floor(Math.random()*3);
    for(let k=1;k<=n;k++)setTimeout(()=>{if(!over&&g0===gen)punch(i)},k*130);
  }
}
/* 마법왕자님 최단유 */
function circle(i){
  const p=P[i],k=document.getElementById('arena').clientWidth/W;
  p.hp=Math.min(p.max,p.hp+CIRCLE_HEAL);say('+'+CIRCLE_HEAL,p.x,p.y-R-18,'#1a9a3a');hud(i);holy(6);
  const el=document.createElement('img');el.src='circle.png';el.className='magic';el.alt='';el.style.width=el.style.height=(CIRCLE_R*2*k)+'px';
  document.getElementById('arena').appendChild(el);
  el.animate([{transform:'translate(-50%,-50%) rotate(0deg)',opacity:0},{opacity:.65,offset:.1},{opacity:.65,offset:.9},{transform:'translate(-50%,-50%) rotate(360deg)',opacity:0}],{duration:CIRCLE_TIME*1000}).onfinish=()=>el.remove();
  circles.push({o:i,t:CIRCLE_TIME,tick:1});
}
function spin(i){P[i].spin={t:SPIN_TIME,rd:0,hit:false};wind(SPIN_TIME)}
function swing(i){const p=P[i],o=P[1-i];p.swing={t:.35,a:Math.atan2(o.y-p.y,o.x-p.x),hit:false};wind(.4)}
function summon(i){
  const p=P[i];holy(2);
  for(let k=0;k<GNOME_COUNT;k++)gnomes.push({o:i,x:p.x,y:p.y,vx:0,vy:0,t:GNOME_TIME,rd:0,ph:rnd(0,6)});
}
function cdSkill(i){
  if(Math.random()<CIRCLE_CHANCE)circle(i);else[spin,swing,summon][Math.floor(Math.random()*3)](i);
}
const SKILLS={ai:aiSkill,bj:bjSkill,cd:cdSkill};

function bounce(o,r){
  if(o.x<r){o.x=r;o.vx=Math.abs(o.vx)}else if(o.x>W-r){o.x=W-r;o.vx=-Math.abs(o.vx)}
  if(o.y<r){o.y=r;o.vy=Math.abs(o.vy)}else if(o.y>W-r){o.y=W-r;o.vy=-Math.abs(o.vy)}
}
function update(dt){
  P.forEach((p,i)=>{
    if(over)return;const o=P[1-i];
    p.cd-=dt;p.flash=(p.flash||0)-dt;
    if(p.cd<=0){p.cd+=p.iv;SKILLS[p.k](i)}
    if(p.k==='ai'&&p.evo&&p.hp>0&&p.hp<p.max){p.reg=(p.reg||0)+dt;if(p.reg>=1){p.reg-=1;p.hp=Math.min(p.max,p.hp+REGEN);hud(i)}}
    if(p.spin){const s=p.spin;s.t-=dt;s.rd-=dt;p.rot+=16*dt;
      if(s.rd<=0){s.rd=.4;const d=rnd(0,Math.PI*2);p.vx=Math.cos(d)*p.sp*SPIN_MULT;p.vy=Math.sin(d)*p.sp*SPIN_MULT}
      if(!s.hit&&dist(p,o)<R*2){s.hit=true;damage(1-i,SPIN_DMG);impact()}
      if(s.t<=0){p.spin=null;const m=Math.hypot(p.vx,p.vy)||1;p.vx=p.vx/m*p.sp;p.vy=p.vy/m*p.sp}}
    if(p.swing){const s=p.swing;s.t-=dt;
      if(!s.hit&&.35-s.t>=.12){s.hit=true;if(dist(p,o)<=SWING_RANGE){damage(1-i,SWING_DMG);impact()}}
      if(s.t<=0)p.swing=null}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.dash>0){const s=Math.min(p.dash,500*dt);p.x+=Math.cos(p.da)*s;p.y+=Math.sin(p.da)*s;p.dash-=s}
    bounce(p,R);
  });
  shots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=dt*10;
    if(s.t==='poop'){s.life-=dt;bounce(s,12)}
    if(!s.dead&&dist(P[1-s.o],s)<R+12){s.dead=true;damage(1-s.o,s.dmg)}});
  shots=shots.filter(s=>!s.dead&&(s.t==='poop'?s.life>0:(s.x>-40&&s.x<W+40&&s.y>-40&&s.y<W+40)));
  pens.forEach(s=>{
    if(s.done)return;const src=P[s.o];
    if(s.delay>0){s.delay-=dt;s.x=src.x;s.y=src.y;return}
    s.t+=dt;const o=P[1-s.o],d0=dist(o,s);
    if(s.hit||d0>110){let d=Math.atan2(o.y-s.y,o.x-s.x)-s.a;d=Math.atan2(Math.sin(d),Math.cos(d));s.a+=Math.max(-8*dt,Math.min(8*dt,d))}
    s.x+=Math.cos(s.a)*340*dt;s.y+=Math.sin(s.a)*340*dt;
    if(s.hit&&(d0<R+6||s.t>2.5))resolve(s,true);else if(!s.hit&&s.t>2)resolve(s,false);
  });
  pens=pens.filter(s=>!s.done);
  circles.forEach(c=>{c.t-=dt;c.tick-=dt;
    if(c.tick<=0){c.tick+=1;const o=P[1-c.o];if(Math.hypot(o.x-W/2,o.y-W/2)<=CIRCLE_R)damage(1-c.o,CIRCLE_DPS)}});
  circles=circles.filter(c=>c.t>0);
  gnomes.forEach(n=>{
    n.t-=dt;n.rd-=dt;n.ph+=dt*12;
    if(n.rd<=0){n.rd=rnd(.5,1);const d=rnd(0,Math.PI*2);n.vx=Math.cos(d)*150;n.vy=Math.sin(d)*150}
    n.x+=n.vx*dt;n.y+=n.vy*dt;bounce(n,14);
    if(!n.dead&&dist(P[1-n.o],n)<R+14){n.dead=true;damage(1-n.o,GNOME_DMG)}});
  gnomes=gnomes.filter(n=>!n.dead&&n.t>0);
  fists.forEach(f=>f.t-=dt);fists=fists.filter(f=>f.t>0);
  beams.forEach(b=>b.t-=dt);beams=beams.filter(b=>b.t>0);
  texts.forEach(t=>{t.t-=dt;t.y-=25*dt});texts=texts.filter(t=>t.t>0);
}

/* draw */
function drawCurry(s){if(!ok(imgs.curry))return;g.save();g.translate(s.x,s.y);g.rotate(s.r);g.drawImage(imgs.curry,-22,-15,44,30);g.restore()}
function drawPoop(s){
  g.save();g.translate(s.x,s.y);g.rotate(s.r);g.fillStyle='#6b3f1d';
  [[0,8,13,7],[0,0,10,6],[0,-7,6,5]].forEach(([a,b,rx,ry])=>{g.beginPath();g.ellipse(a,b,rx,ry,0,0,7);g.fill()});
  g.beginPath();g.moveTo(-3,-11);g.lineTo(3,-16);g.lineTo(4,-9);g.fill();
  g.fillStyle='#fff';g.beginPath();g.arc(-4,0,2.5,0,7);g.arc(4,0,2.5,0,7);g.fill();
  g.fillStyle='#000';g.beginPath();g.arc(-4,0,1.2,0,7);g.arc(4,0,1.2,0,7);g.fill();g.restore();
}
function drawFist(f){
  if(!ok(imgs.fist))return;const p=P[f.i],sz=44+(.2-f.t)*60;
  g.drawImage(imgs.fist,p.x+Math.cos(f.a)*(R+24)-sz/2,p.y+Math.sin(f.a)*(R+24)-sz/2,sz,sz);
}
function drawBeam(b){
  if(!ok(imgs.pencil))return;g.globalAlpha=Math.min(1,b.t/.25);
  g.drawImage(imgs.pencil,b.x-BEAM_W/2,0,BEAM_W,W);
  g.save();g.translate(W/2,b.y);g.rotate(Math.PI/2);g.drawImage(imgs.pencil,-BEAM_W/2,-W/2,BEAM_W,W);g.restore();g.globalAlpha=1;
}
function drawStaff(p){
  if(!ok(imgs.staff))return;const asp=imgs.staff.naturalWidth/imgs.staff.naturalHeight;
  g.save();g.translate(p.x,p.y);
  if(p.swing){const s=p.swing,u=1-s.t/.35,len=120;g.rotate(s.a-1.4+2.8*u);g.translate(R-6+len/2,0);g.rotate(Math.PI/2);g.drawImage(imgs.staff,-len*asp/2,-len/2,len*asp,len)}
  else{g.translate(R+4,2);g.rotate(.25);g.drawImage(imgs.staff,-26*asp,-26,52*asp,52)}
  g.restore();
}
function drawGnome(n){
  g.save();g.translate(n.x,n.y);const s=Math.sin(n.ph)*5;
  g.strokeStyle='#111';g.lineWidth=2.5;g.lineCap='round';g.beginPath();
  g.moveTo(-4,12);g.lineTo(-5+s,25);g.moveTo(4,12);g.lineTo(5-s,25);g.moveTo(-13,3);g.lineTo(-20,10-s);g.moveTo(13,3);g.lineTo(20,10+s);g.stroke();
  g.save();g.beginPath();g.arc(0,0,14,0,7);g.clip();if(ok(imgs.gnome))g.drawImage(imgs.gnome,-14,-14,28,28);g.restore();
  g.beginPath();g.arc(0,0,14,0,7);g.stroke();g.restore();
}
function draw(){
  g.clearRect(0,0,W,W);
  g.strokeStyle='#00000014';g.lineWidth=1;
  for(let k=50;k<W;k+=50){g.beginPath();g.moveTo(k,0);g.lineTo(k,W);g.moveTo(0,k);g.lineTo(W,k);g.stroke()}
  beams.forEach(drawBeam);
  P.forEach(p=>{
    g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.beginPath();g.arc(0,0,R,0,7);g.clip();
    if(ok(imgs[p.img]))g.drawImage(imgs[p.img],-R,-R,R*2,R*2);else{g.fillStyle='#ccc';g.fill()}
    if(p.flash>0){g.fillStyle='#ff000066';g.fillRect(-R,-R,R*2,R*2)}
    g.restore();
    g.strokeStyle='#111';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,R,0,7);g.stroke();
    if(p.spin){g.strokeStyle='rgba(90,150,200,.65)';g.lineWidth=3;
      for(let k=0;k<3;k++){g.beginPath();g.arc(p.x,p.y,R+8+k*7,p.rot*1.3+k*2.1,p.rot*1.3+k*2.1+1.2);g.stroke()}}
    if(p.k==='cd'&&!p.spin)drawStaff(p);
    g.fillStyle='#ddd';g.fillRect(p.x-30,p.y-R-14,60,7);
    g.fillStyle=hpColor(p.hp,p.max);g.fillRect(p.x-30,p.y-R-14,60*p.hp/p.max,7);
    g.strokeStyle='#111';g.lineWidth=1;g.strokeRect(p.x-30,p.y-R-14,60,7);
    g.fillStyle='#111';g.font='13px Malgun Gothic, sans-serif';g.textAlign='center';g.fillText(p.hp,p.x,p.y+R+16);
  });
  gnomes.forEach(drawGnome);
  shots.forEach(s=>s.t==='curry'?drawCurry(s):drawPoop(s));
  fists.forEach(drawFist);
  if(ok(imgs.pencil))pens.forEach(s=>{if(s.delay>0)return;g.save();g.translate(s.x,s.y);g.rotate(s.a+Math.PI/2);g.drawImage(imgs.pencil,-4,-16,8,32);g.restore()});
  texts.forEach(t=>{g.globalAlpha=Math.max(0,t.t);g.fillStyle=t.col;g.font='bold 18px Malgun Gothic, sans-serif';g.textAlign='center';g.fillText(t.s,t.x,t.y)});
  g.globalAlpha=1;
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(started&&!over)update(dt);draw();requestAnimationFrame(loop)}

/* UI */
document.getElementById('go').onclick=()=>{
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();ac.resume()}catch(e){}
  started=true;document.getElementById('start').hidden=true;
};
document.getElementById('again').onclick=init;
document.querySelectorAll('.pf').forEach((c,i)=>{
  const btn=c.querySelector('.selbtn'),list=c.querySelector('.list');
  Object.keys(CH).forEach(k=>{const b=document.createElement('button');b.textContent=CH[k].name;
    b.onclick=()=>{sel[i]=k;list.hidden=true;init()};list.appendChild(b)});
  btn.onclick=e=>{e.stopPropagation();const h=list.hidden;document.querySelectorAll('.list').forEach(l=>l.hidden=true);list.hidden=!h};
});
addEventListener('click',()=>document.querySelectorAll('.list').forEach(l=>l.hidden=true));
init();requestAnimationFrame(loop);

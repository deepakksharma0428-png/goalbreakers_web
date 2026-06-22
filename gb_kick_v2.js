/* Goalbreakers — cinematic flick kick (zoom-on-ball aim -> zoom-out -> strike). root.GBK2 */
(function(root){
const W=780,H=1380;
const GLX=180,GRX=600,GY=1000,GTY=840; const GW=GRX-GLX,GCX=(GLX+GRX)/2;  // big, close free-kick goal
const BX0=440,BY0=1340;                     // ball on the ground at the RIGHT foot
const KX=GCX,KY=GY;
const DX=400,DY=1150;                        // defender between striker and goal
const SSX=370,SFY=1378,SH=340;               // striker foreground, head visible
const KH=165, DH=230;                        // keeper sized to the goal (face visible); defender by distance
const AIMZ=1.5, AIMX=W/2, AIMY=1150;         // aim camera frames the whole player + ball
const MODES={PRO:{reach:0.22*GW,err:0.30*GW,kspd:0.95,defender:false},
             ELITE:{reach:0.32*GW,err:0.12*GW,kspd:1.2,defender:true}};
const IMG={},NEED=["stadium_bg2","keeper_ready","keeper_dive_l","keeper_dive_r",
 "defender_block","defender_jump","striker_stance","striker_kickR","striker_celebrate","ball_plain"];
let loaded=0,ready=false;
function load(){NEED.forEach(n=>{const i=new Image();i.onload=i.onerror=()=>{if(++loaded===NEED.length)ready=true;};
 i.src=(n==="stadium_bg2"?"sprites/":"sprites_t/")+n+".png";IMG[n]=i;});}
const S={mode:"PRO",phase:"aim",score:0,streak:0,best:0,
 cs:1,cx:W/2,cy:H/2,zt:0,pending:null,
 ball:null,kx:KX,kdir:0,kxT:KX,striker:"stance",spin:0,energy:0,lean:0,
 dust:[],imp:[],result:"",rt:0,flash:0,shake:0,slow:1,sound:null,netRipple:0,defJump:false,
 pdx:0,pdy:0,dragging:false};
function reset(){Object.assign(S,{phase:"aim",result:"",ball:null,kx:KX,kdir:0,striker:"stance",
 dust:[],imp:[],slow:1,netRipple:0,energy:0,lean:0,dragging:false,pdx:0,pdy:0,
 cs:1,cx:W/2,cy:H/2,zt:0,pending:null});}
function drag(dx,dy){if(S.phase==="aim"){S.dragging=true;S.pdx=dx;S.pdy=dy;}}
function dragEnd(){S.dragging=false;}
function ease(x){return 1-Math.pow(1-x,2);}
function lerp(a,b,t){return a+(b-a)*t;}
function flick(dx,dy,dt){
  if(!ready)return;
  if(S.phase==="result"){reset();return;}
  if(S.phase!=="aim")return;
  if(dy>-30&&Math.abs(dx)<30)return;                     // ignore taps; need a real flick
  const power=Math.max(0.25,Math.min(1,(-dy)/(H*0.34)));
  const dirX=Math.max(-1.2,Math.min(1.2,dx/(W*0.42)));
  S.pending={power:power,dirX:dirX,
    landingX:GCX+dirX*(GW*0.95), curve:Math.max(-0.16,Math.min(0.16,dirX*0.16)),
    over:Math.max(0,(power-0.86))*1000, short:power<0.33};
  S.dragging=false; launch();
}
function launch(){
  const M=MODES[S.mode],p=S.pending;
  S.ball={u:0,T:1.02-0.40*p.power,fx:p.landingX,fy:GY-p.over,short:p.short,curve:p.curve,trail:[]};
  S.kxT=Math.max(GLX,Math.min(GRX,p.landingX+(Math.random()*2-1)*M.err));
  S.defJump=M.defender&&Math.abs(p.dirX)<0.22;
  S.striker="kick";S.spin=0;S.energy=1;S.lean=1;S.phase="flight";
  for(let i=0;i<24;i++){const a=Math.PI+(Math.random()-0.5)*1.6,sp=2+Math.random()*5;
    S.dust.push({x:BX0+(Math.random()-0.5)*30,y:BY0+6,vx:Math.cos(a)*sp*1.4*(Math.random()<.5?-1:1),vy:-Math.abs(Math.sin(a))*sp-1,life:1,r:8+Math.random()*14});}
  S.shake=8;S.sound="kick";
}
function evaluate(){
  const M=MODES[S.mode],b=S.ball,fx=b.fx;let r="GOAL";
  if(S.defJump&&Math.abs(fx-GCX)<GW*0.24)r="BLOCKED";
  else if(b.short)r="SHORT";
  else if(b.fy<GTY-8)r="OVER";
  else if(fx<GLX-6||fx>GRX+6)r="WIDE";
  else if(Math.abs(Math.abs(fx-GCX)-GW/2)<10)r="POST";
  else if(Math.abs(fx-S.kx)<M.reach)r="SAVE";
  const iy=(r==="OVER")?GTY-16:(r==="WIDE"?GY:b.fy),ix=Math.max(GLX-26,Math.min(GRX+26,fx));
  const col=r==="GOAL"?[255,210,61]:(r==="POST"?[255,255,255]:[210,225,255]);
  for(let i=0;i<26;i++){const a=Math.random()*Math.PI*2,sp=2+Math.random()*7;
    S.imp.push({x:ix,y:iy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,r:3+Math.random()*7,c:col});}
  if(r==="GOAL"){S.score+=(S.mode==="ELITE"?150:100)+S.streak*10;S.streak++;S.best=Math.max(S.best,S.streak);
    S.flash=1;S.shake=18;S.sound="goal";S.striker="celebrate";S.netRipple=1;}
  else{S.streak=0;S.shake=12;S.sound=(r==="POST"?"post":(r==="SAVE"?"save":"miss"));}
  S.result=r;S.rt=0;S.phase="result";
}
function pstep(arr,dt){for(const p of arr){p.x+=p.vx;p.y+=p.vy;p.vy+=0.25;p.vx*=0.97;p.life-=dt*1.6;}return arr.filter(p=>p.life>0);}
function update(dt){
  if(!ready)return;
  if(S.shake>0)S.shake=Math.max(0,S.shake-dt*42);
  if(S.flash>0)S.flash=Math.max(0,S.flash-dt*2.2);
  if(S.netRipple>0)S.netRipple=Math.max(0,S.netRipple-dt*2.4);
  if(S.lean>0)S.lean=Math.max(0,S.lean-dt*2.5);
  S.dust=pstep(S.dust,dt);S.imp=pstep(S.imp,dt);
  if(S.phase==="flight"){const b=S.ball;const near=b.u>0.8;S.slow=near?0.5:1;
    b.u+=dt*0.92*S.slow/b.T;S.spin+=dt*22*S.slow;const u=Math.min(1,b.u);
    S.kx=Math.max(GLX+10,Math.min(GRX-10,KX+(S.kxT-KX)*ease(Math.min(1,u*MODES[S.mode].kspd))));
    S.kdir=S.kxT<KX-6?-1:(S.kxT>KX+6?1:0);
    if(u>=1)evaluate();}
  if(S.phase==="result")S.rt+=dt;
}
function ballPos(u){const b=S.ball,ez=1-Math.pow(1-u,1.7),m=1-u;
  const y=BY0+(b.fy-BY0)*ez;
  const x=BX0*m*m+(BX0+(b.fx-BX0)*0.5+b.curve*GW*2.2)*2*m*u+b.fx*u*u;
  return {x:x,y:y,s:1-0.55*ez};}
function spr(ctx,name,cx,cy,h){const im=IMG[name];if(!im||!im.width)return;const s=h/im.height,w=im.width*s;ctx.drawImage(im,cx-w/2,cy-h,w,h);}
function drawBall(ctx,x,y,size,spin,energy){
  if(energy>0){ctx.save();ctx.globalCompositeOperation="lighter";ctx.translate(x,y);
    for(let k=0;k<3;k++){ctx.rotate(spin*1.3+k*2.1);ctx.strokeStyle=k%2?"rgba(255,170,40,"+(0.8*energy)+")":"rgba(90,180,255,"+(0.8*energy)+")";
      ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,size*0.74,0.3,2.4);ctx.stroke();ctx.beginPath();ctx.arc(0,0,size*0.64,3.6,5.2);ctx.stroke();}
    for(let k=0;k<6;k++){const a=spin*2+k*1.1,rr=size*0.85;ctx.fillStyle=k%2?"#ffcf5a":"#8fd0ff";ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.6*energy+1,0,7);ctx.fill();}
    ctx.restore();}
  const bi=IMG.ball_plain;if(bi&&bi.width){const bw=size*(bi.width/bi.height);ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.drawImage(bi,-bw/2,-size/2,bw,size);ctx.restore();}
}
function curveArrow(ctx,bx,by,t){
  const drag=S.dragging,dx=drag?Math.max(-150,Math.min(150,S.pdx)):0,len=drag?Math.max(40,Math.min(240,-S.pdy)):110+Math.sin(t*4)*8;
  const x0=bx,y0=by-60,tipx=bx+dx*0.7,tipy=by-60-len,cxp=bx+dx*0.28,cyp=by-60-len*0.5;
  ctx.save();ctx.globalAlpha=drag?0.95:0.65;ctx.strokeStyle="#ffd23d";ctx.lineWidth=8;ctx.lineCap="round";ctx.shadowColor="rgba(255,210,61,.9)";ctx.shadowBlur=14;
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cxp,cyp,tipx,tipy);ctx.stroke();
  const ang=Math.atan2(tipy-cyp,tipx-cxp);
  ctx.beginPath();ctx.moveTo(tipx,tipy);ctx.lineTo(tipx-16*Math.cos(ang-0.5),tipy-16*Math.sin(ang-0.5));
  ctx.moveTo(tipx,tipy);ctx.lineTo(tipx-16*Math.cos(ang+0.5),tipy-16*Math.sin(ang+0.5));ctx.stroke();ctx.restore();
}
function puffs(ctx,arr){for(const p of arr){ctx.save();ctx.globalAlpha=Math.max(0,p.life)*0.5;ctx.fillStyle=p.c?`rgb(${p.c[0]},${p.c[1]},${p.c[2]})`:"#dbe5f0";ctx.beginPath();ctx.arc(p.x,p.y,p.r*(0.6+p.life*0.6),0,7);ctx.fill();ctx.restore();}}
function world(ctx,t){
  const bg=IMG.stadium_bg2;if(bg&&bg.width){const r=Math.max(W/bg.width,H/bg.height),bw=bg.width*r,bh=bg.height*r;ctx.drawImage(bg,(W-bw)/2,(H-bh)/2,bw,bh);}
  if(S.netRipple>0){ctx.save();ctx.globalAlpha=S.netRipple*0.55;ctx.strokeStyle="#cfeaff";ctx.lineWidth=3;
    for(let i=0;i<5;i++){const yy=GTY+i*((GY-GTY)/4);ctx.beginPath();ctx.moveTo(GLX,yy);ctx.lineTo(GRX,yy+Math.sin(t*30+i)*5);ctx.stroke();}ctx.restore();}
  if(MODES[S.mode].defender){const dj=(S.phase==="flight"&&S.defJump)?ease(Math.min(1,S.ball.u*1.3))*70:0;
    spr(ctx,S.defJump?"defender_jump":"defender_block",DX,DY-dj,DH);}
  let kn="keeper_ready";
  if(S.phase==="flight"||S.phase==="result"){const off=S.kxT-GCX; kn=(off<-GW*0.16)?"keeper_dive_l":(off>GW*0.16?"keeper_dive_r":"keeper_ready");}
  const kArc=(S.phase==="flight")?Math.sin(Math.min(1,S.ball.u)*Math.PI)*(kn==="keeper_ready"?8:16):0;  // grounded dive, stays in goal
  spr(ctx,kn,S.kx,KY-kArc,KH);
  if(S.ball){const p=ballPos(Math.min(1,S.ball.u)),bs=120*p.s;
    S.ball.trail.push({x:p.x,y:p.y});if(S.ball.trail.length>16)S.ball.trail.shift();
    for(let i=0;i<S.ball.trail.length;i++){const tp=S.ball.trail[i],a=i/S.ball.trail.length;ctx.save();ctx.globalAlpha=a*0.45;ctx.fillStyle=i%2?"#ffd23d":"#5ab4ff";ctx.beginPath();ctx.arc(tp.x,tp.y,bs*0.26*a,0,7);ctx.fill();ctx.restore();}
    drawBall(ctx,p.x,p.y,bs,S.spin,S.energy);}
  puffs(ctx,S.dust);
  const sn=S.striker==="celebrate"?"striker_celebrate":(S.striker==="kick"?"striker_kickR":"striker_stance");
  spr(ctx,sn,SSX,SFY-S.lean*18,SH);
  if(S.phase==="aim"){drawBall(ctx,BX0,BY0,118,0.2,0);curveArrow(ctx,BX0,BY0,t);}
  puffs(ctx,S.imp);
}
function draw(ctx,t){
  ctx.clearRect(0,0,W,H);
  if(!ready){ctx.fillStyle="#06101f";ctx.fillRect(0,0,W,H);ctx.fillStyle="#7fdcff";ctx.font="34px sans-serif";ctx.textAlign="center";ctx.fillText("Loading…",W/2,H/2);return;}
  const sh=S.shake>0?(Math.random()*2-1)*S.shake:0;
  ctx.save();ctx.translate(sh,sh*0.5);
  world(ctx,t);
  ctx.restore();
  if(S.flash>0){ctx.fillStyle="rgba(255,255,255,"+(S.flash*0.7)+")";ctx.fillRect(0,0,W,H);}
  hud(ctx);
}
function hud(ctx){
  ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font="bold 40px -apple-system,sans-serif";ctx.fillText(String(S.score),28,52);
  ctx.font="bold 22px -apple-system,sans-serif";ctx.fillStyle="#9fc4e6";ctx.fillText("SCORE",28,76);
  ctx.textAlign="right";ctx.fillStyle="#ffd23d";ctx.font="bold 24px -apple-system,sans-serif";ctx.fillText("STREAK "+S.streak+"  (best "+S.best+")",W-24,48);
  ctx.textAlign="center";
  if(S.phase==="aim"){ctx.fillStyle="rgba(207,230,255,.85)";ctx.font="600 22px -apple-system,sans-serif";ctx.fillText("drag the ball to curve · release to strike",W/2,H*0.085);}
  if(S.phase==="result"){const big={GOAL:"⚡ GOAL! ⚡",SAVE:"SAVED!",POST:"OFF THE POST!",WIDE:"WIDE!",OVER:"OVER!",SHORT:"SHORT!",BLOCKED:"BLOCKED!"}[S.result]||S.result;
    ctx.fillStyle=S.result==="GOAL"?"#ffd23d":"#ff7a7a";ctx.font="bold 70px -apple-system,sans-serif";ctx.fillText(big,W/2,H*0.30);
    ctx.fillStyle="#dff3ff";ctx.font="bold 26px -apple-system,sans-serif";ctx.fillText("tap to shoot again",W/2,H*0.30+44);}
}
root.GBK2={load,update,draw,flick,drag,dragEnd,setMode:m=>{S.mode=m;reset();},get state(){return S;},W,H};
})(typeof window!=="undefined"?window:globalThis);

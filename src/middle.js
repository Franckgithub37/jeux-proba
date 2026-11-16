/* ---------- Rendu 3D ---------- */
const view=$("#view"),canvas=$("#gl");
if(!window.THREE){$("#nogl").style.display="flex";return}
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"})}catch(e){$("#nogl").style.display="flex";return}
const big=window.innerWidth>900;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const maxAniso=renderer.capabilities.getMaxAnisotropy();
const scene=new THREE.Scene();scene.background=new THREE.Color(0x06131f);
const camera=new THREE.PerspectiveCamera(46,1.6,.02,40);
const V3=THREE.Vector3,Y=new V3(0,1,0),PI=Math.PI;
const M=(color,o)=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:.7,metalness:0},o||{}));
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),cyl=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||24),sph=(r,a,b)=>new THREE.SphereGeometry(r,a||24,b||16);
function mesh(geo,mat,x,y,z,parent,o){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);o=o||{};m.castShadow=o.cast!==false;m.receiveShadow=o.recv!==false;(parent||scene).add(m);return m}
function ell(rx,ry,rz,mat,x,y,z,parent){const m=mesh(sph(1,24,18),mat,x,y,z,parent);m.scale.set(rx,ry,rz);return m}
function stick(a,b,r,mat,parent){const d=new V3().subVectors(b,a),m=mesh(cyl(r,r,d.length(),12),mat,0,0,0,parent);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(Y,d.clone().normalize());return m}
function ctex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAniso;return t}
function woodTex(base,dark,light,planks){return ctex(1024,1024,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);const rows=planks||1,rh=h/rows;
  for(let r=0;r<rows;r++){const y0=r*rh;g.fillStyle=(rnd()<.5?"rgba(0,0,0,":"rgba(255,255,255,")+(rnd()*.09).toFixed(3)+")";g.fillRect(0,y0,w,rh);
    for(let i=0;i<Math.round(520/rows)+20;i++){const y=y0+rnd()*rh,a=rnd()*8-4;g.strokeStyle=rnd()<.6?dark:light;g.globalAlpha=.04+rnd()*.16;g.lineWidth=.6+rnd()*1.8;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(w*.3,y+a,w*.65,y-a,w,y+rnd()*4-2);g.stroke()}
    g.globalAlpha=1;if(planks){g.fillStyle="rgba(40,22,8,.6)";g.fillRect(0,y0,w,2);const off=rnd()*w;g.fillRect(off,y0,2,rh);g.fillRect((off+w*.55)%w,y0,2,rh)}}})}
function scribble(g,x,y,w,col){g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.moveTo(x,y);let cx=x;while(cx<x+w){const st=6+rnd()*10;g.quadraticCurveTo(cx+st/2,y+(rnd()*10-5),cx+st,y+(rnd()*4-2));cx+=st;if(rnd()<.18)cx+=8}g.stroke()}

const C={nuit:0x01233F,profond:0x0C497B,moyen:0x0B80B2,vif:0x29ABE2,cyan:0x74D2FA,orange:0xFF8000};
const mWhite=M(0xf4f7f9,{roughness:.6}),mNuit=M(0x0a2c4a,{roughness:.5,metalness:.3}),mAlu=M(0xa9b2ba,{roughness:.32,metalness:.9}),mBrass=M(0xc9a24a,{roughness:.3,metalness:.9}),mDark=M(0x14181d,{roughness:.55});

/* Pièce */
(function room(){
  const ft=woodTex("#b89468","#6b4a2a","#e6cda6",8);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(3,3);
  const fl=mesh(new THREE.PlaneGeometry(10,10),M(0xffffff,{map:ft,roughness:.5}),0,0,1.2,scene,{cast:false});fl.rotation.x=-PI/2;
  const wL=M(0xdde8ee,{roughness:.95}),wB=M(0x11426b,{roughness:.9});
  mesh(new THREE.PlaneGeometry(4.9,2.7),wB,0,1.35,-1.3,scene,{cast:false});
  const rw=mesh(new THREE.PlaneGeometry(6,2.7),wL,2.4,1.35,1.4,scene,{cast:false});rw.rotation.y=-PI/2;
  const ce=mesh(new THREE.PlaneGeometry(4.9,6),M(0xeef3f6,{roughness:1}),0,2.7,1.4,scene,{cast:false});ce.rotation.x=PI/2;
  /* mur gauche en 4 blocs autour de la fenêtre : ils projettent l'ombre, le soleil n'entre que par l'ouverture */
  mesh(box(.08,.9,6),wL,-2.44,.45,1.4);mesh(box(.08,.6,6),wL,-2.44,2.4,1.4);
  mesh(box(.08,1.2,1.1),wL,-2.44,1.5,-1.05);mesh(box(.08,1.2,3.1),wL,-2.44,1.5,2.85);
  const sky=ctex(512,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#8cc6f2");gr.addColorStop(.7,"#e4f3fd");gr.addColorStop(1,"#fff6e6");g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle="rgba(255,255,255,.75)";for(let i=0;i<7;i++){g.beginPath();g.ellipse(rnd()*w,40+rnd()*130,50+rnd()*60,14+rnd()*12,0,0,7);g.fill()}
    for(let i=0;i<9;i++){const bw=40+rnd()*50,bh=60+rnd()*110;g.fillStyle="rgba(120,160,190,"+(.35+rnd()*.3)+")";g.fillRect(i*58-10,h-bh,bw,bh)}});
  const pane=mesh(new THREE.PlaneGeometry(1.8,1.2),new THREE.MeshBasicMaterial({map:sky,toneMapped:false}),-2.47,1.5,.4,scene,{cast:false,recv:false});pane.rotation.y=PI/2;
  mesh(box(.06,.05,1.9),mWhite,-2.41,2.11,.4);mesh(box(.06,.05,1.9),mWhite,-2.41,.89,.4);mesh(box(.06,1.2,.05),mWhite,-2.41,1.5,-.52);mesh(box(.06,1.2,.05),mWhite,-2.41,1.5,1.32);mesh(box(.05,1.2,.04),mWhite,-2.41,1.5,.4);
  mesh(box(.2,.03,1.96),mWhite,-2.33,.875,.4);
  for(let i=0;i<8;i++){const s=mesh(box(.045,.005,1.8),mWhite,-2.39,2.07-i*.045,.4);s.rotation.z=.5}
  mesh(box(.02,.09,4.9),mWhite,0,.045,-1.29).rotation.y=PI/2;
  mesh(new THREE.PlaneGeometry(1.3,.32),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),0,2.695,.8,scene,{cast:false,recv:false}).rotation.x=PI/2;
  /* étagères et classeurs */
  const cols=[C.nuit,C.vif,C.cyan,C.orange,0xf4f7f9,C.profond,C.moyen];
  [1.5,1.92].forEach((sy,si)=>{mesh(box(1.35,.03,.24),mWhite,-1.35,sy,-1.17);let x=-1.97;while(x<-0.78){const w=.035+rnd()*.045,h=.2+rnd()*.1;if(rnd()<.88){const b=mesh(box(w,h,.17),M(cols[Math.floor(rnd()*cols.length)],{roughness:.65}),x+w/2,sy+.015+h/2,-1.18);if(rnd()<.15)b.rotation.z=.12}x+=w+.006}});
  /* tableau de liège */
  const cork=ctex(1024,640,(g,w,h)=>{g.fillStyle="#c59a63";g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){g.fillStyle="rgba("+(rnd()<.5?"90,60,30":"230,200,150")+","+(rnd()*.25)+")";g.fillRect(rnd()*w,rnd()*h,2,2)}
    const notes=[["#fff",60,50,260,330],["#74D2FA",360,70,200,200],["#FF8000",600,50,190,190],["#DEF5FF",820,90,160,240],["#fff",380,320,300,260],["#FA9C3C",730,360,220,200]];
    notes.forEach(n=>{g.save();g.translate(n[1]+n[3]/2,n[2]+n[4]/2);g.rotate((rnd()-.5)*.14);g.shadowColor="rgba(0,0,0,.35)";g.shadowBlur=14;g.shadowOffsetY=5;g.fillStyle=n[0];g.fillRect(-n[3]/2,-n[4]/2,n[3],n[4]);g.shadowColor="transparent";
      for(let y=-n[4]/2+34;y<n[4]/2-16;y+=28)scribble(g,-n[3]/2+18,y,n[3]-36-rnd()*40,"#01233F");g.fillStyle="#0C497B";g.beginPath();g.arc(0,-n[4]/2+12,8,0,7);g.fill();g.restore()})});
  mesh(box(1.26,.82,.03),M(0xe9eef1,{roughness:.6}),.05,1.3,-1.28);mesh(new THREE.PlaneGeometry(1.18,.74),M(0xffffff,{map:cork,roughness:.95}),.05,1.3,-1.262,scene,{cast:false});
  /* cadre tracé cardiaque */
  const ecg=ctex(768,512,(g,w,h)=>{g.fillStyle="#01233F";g.fillRect(0,0,w,h);g.strokeStyle="rgba(116,210,250,.16)";g.lineWidth=1;for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
    const beat=(x0,col)=>{g.strokeStyle=col;g.lineWidth=6;g.lineJoin="round";g.beginPath();const b=h*.55;g.moveTo(x0,b);g.lineTo(x0+40,b);g.quadraticCurveTo(x0+58,b-34,x0+76,b);g.lineTo(x0+96,b);g.lineTo(x0+108,b+26);g.lineTo(x0+126,b-170);g.lineTo(x0+144,b+60);g.lineTo(x0+158,b);g.lineTo(x0+186,b);g.quadraticCurveTo(x0+214,b-56,x0+242,b);g.lineTo(x0+256,b);g.stroke()};
    beat(0,"#74D2FA");beat(256,"#FF8000");beat(512,"#74D2FA")});
  mesh(box(.86,.6,.03),mWhite,1.45,1.6,-1.28);mesh(new THREE.PlaneGeometry(.78,.52),M(0xffffff,{map:ecg,roughness:.4}),1.45,1.6,-1.262,scene,{cast:false});
  /* horloge 7 h 42 */
  const clk=ctex(256,256,(g,w)=>{g.fillStyle="#fff";g.beginPath();g.arc(128,128,124,0,7);g.fill();g.strokeStyle="#01233F";g.lineWidth=10;g.stroke();g.lineWidth=5;for(let i=0;i<12;i++){const a=i/12*PI*2;g.beginPath();g.moveTo(128+Math.sin(a)*98,128-Math.cos(a)*98);g.lineTo(128+Math.sin(a)*112,128-Math.cos(a)*112);g.stroke()}
    const hand=(a,l,lw,c)=>{g.strokeStyle=c;g.lineWidth=lw;g.lineCap="round";g.beginPath();g.moveTo(128,128);g.lineTo(128+Math.sin(a)*l,128-Math.cos(a)*l);g.stroke()};hand((7+42/60)/12*PI*2,60,9,"#01233F");hand(42/60*PI*2,92,6,"#FF8000")});
  const ck=mesh(cyl(.16,.16,.03,40),M(0xffffff,{map:clk,roughness:.5}),-.62,2.2,-1.28);ck.rotation.x=PI/2;
  /* meuble à tiroirs, plante, porte-manteau avec blouse, fauteuil */
  mesh(box(.5,1.1,.5),mWhite,1.95,.55,-.95);for(let i=0;i<4;i++){mesh(box(.44,.005,.01),mDark,1.95,.3+i*.26,-.698);mesh(box(.12,.015,.02),mAlu,1.95,.19+i*.26,-.69)}
  const leaf=M(0x2f7d6a,{roughness:.6});
  const plant=(x,y,z,s)=>{mesh(cyl(.13*s,.1*s,.24*s,24),M(0xf4f7f9,{roughness:.5}),x,y+.12*s,z);for(let i=0;i<11;i++){const a=i/11*PI*2+rnd(),t=.25+rnd()*.5,l=mesh(sph(1,12,10),leaf,x+Math.sin(a)*.1*s*t*2,y+(.42+rnd()*.2)*s,z+Math.cos(a)*.1*s*t*2);l.scale.set(.045*s,.24*s,.1*s);l.rotation.set(Math.cos(a)*t,a,-Math.sin(a)*t)}};
  plant(-1.95,0,-.85,1.5);plant(1.95,1.1,-.95,.55);
  const ch=new THREE.Group();ch.position.set(-.85,0,1.0);ch.rotation.y=-.7;scene.add(ch);const fab=M(0x0d3a5f,{roughness:.9});
  mesh(box(.48,.08,.46),fab,0,.5,0,ch);mesh(box(.44,.52,.07),fab,0,.86,-.22,ch).rotation.x=-.08;mesh(cyl(.03,.03,.4,12),mAlu,0,.27,0,ch);
  for(let i=0;i<5;i++){const a=i/5*PI*2,sp=mesh(box(.05,.03,.3),mDark,Math.sin(a)*.15,.06,Math.cos(a)*.15,ch);sp.rotation.y=a;mesh(sph(.03,10,8),mDark,Math.sin(a)*.3,.03,Math.cos(a)*.3,ch)}
})();

/* Bureau et objets */
const deskT=woodTex("#cfab7f","#8a6238","#f0dab6",0);
mesh(box(1.8,.04,.84),M(0xffffff,{map:deskT,roughness:.45}),0,.73,0);
[[-.84,-.36],[.84,-.36],[-.84,.36],[.84,.36]].forEach(p=>mesh(box(.05,.71,.05),mNuit,p[0],.355,p[1]));
mesh(box(1.66,.05,.03),mNuit,0,.68,-.37);mesh(box(.4,.5,.6),mWhite,-.6,.43,0);
/* tasse */
(function(){const g=new THREE.Group();g.position.set(-.36,.75,-.1);scene.add(g);const w=M(0xfbfcfd,{roughness:.25,side:THREE.DoubleSide});
  mesh(new THREE.CylinderGeometry(.04,.035,.09,32,1,true),w,0,.045,0,g);mesh(cyl(.035,.035,.004,32),w,0,.002,0,g);mesh(cyl(.0405,.0395,.016,32),M(C.orange,{roughness:.3}),0,.03,0,g);
  mesh(cyl(.037,.037,.002,32),M(0x2a1608,{roughness:.2}),0,.078,0,g,{cast:false});const h=mesh(new THREE.TorusGeometry(.024,.006,10,24),w,-.05,.045,0,g);h.rotation.y=0})();
/* bloc-notes et stylo */
(function(){const t=ctex(512,680,(g,w,h)=>{g.fillStyle="#fffdf6";g.fillRect(0,0,w,h);g.strokeStyle="#b9dcec";g.lineWidth=2;for(let y=90;y<h;y+=38){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}g.strokeStyle="#FF8000";g.beginPath();g.moveTo(64,0);g.lineTo(64,h);g.stroke();
    for(let y=84;y<h-60;y+=38){if(rnd()<.2)continue;scribble(g,84,y,300-rnd()*140+80,"#0C497B")}});
  const n=mesh(box(.15,.012,.2),M(0xffffff,{roughness:.9}),-.37,.756,.17);n.rotation.y=.22;const top=mesh(new THREE.PlaneGeometry(.15,.2),M(0xffffff,{map:t,roughness:.9}),-.37,.7625,.17,scene,{cast:false});top.rotation.set(-PI/2,0,.22);
  const pen=mesh(cyl(.0045,.0045,.14,10),M(C.orange,{roughness:.35}),-.26,.7545,.2);pen.rotation.set(PI/2,0,.9)});
/* stéthoscope */
(function(){const n0=scene.children.length;const tube=M(0x0C497B,{roughness:.45});const y=.7548;
  const c1=new THREE.CatmullRomCurve3([new V3(-.55,y+.004,.3),new V3(-.5,y,.33),new V3(-.4,y,.34),new V3(-.3,y,.3),new V3(-.25,y,.34),new V3(-.19,y,.36)]);
  mesh(new THREE.TubeGeometry(c1,60,.0045,8),tube);
  const c2=new THREE.CatmullRomCurve3([new V3(-.19,y,.36),new V3(-.14,y,.35),new V3(-.1,y,.31)]),c3=new THREE.CatmullRomCurve3([new V3(-.19,y,.36),new V3(-.15,y,.385),new V3(-.09,y,.37)]);
  mesh(new THREE.TubeGeometry(c2,20,.003,8),mAlu);mesh(new THREE.TubeGeometry(c3,20,.003,8),mAlu);mesh(sph(.006,10,8),mWhite,-.1,y+.002,.31);mesh(sph(.006,10,8),mWhite,-.09,y+.002,.37);
  mesh(cyl(.024,.024,.01,28),mAlu,-.56,.757,.3);mesh(cyl(.019,.019,.004,28),mWhite,-.56,.763,.3);scene.children.slice(n0).forEach(o=>{o.position.x+=.95;o.position.z+=.03})})();

/* Ordinateur portable */
const HINGE=new V3(0,.768,-.115);
mesh(box(.34,.014,.235),mAlu,0,.757,.0025);
(function(){const km=M(0x15191e,{roughness:.5}),k=new THREE.InstancedMesh(box(.0185,.003,.0165),km,70),d=new THREE.Object3D();let i=0;
  for(let r=0;r<5;r++)for(let c=0;c<14;c++){d.position.set(-.143+c*.022,.7655,-.088+r*.0205);d.updateMatrix();k.setMatrixAt(i++,d.matrix)}k.receiveShadow=true;scene.add(k);
  mesh(box(.1,.0008,.058),M(0x98a1a9,{roughness:.25,metalness:.9}),0,.7644,.064,scene,{cast:false});mesh(cyl(.006,.006,.3,12),mDark,0,.766,-.115).rotation.z=PI/2})();
const lid=new THREE.Group();lid.position.copy(HINGE);scene.add(lid);
mesh(box(.34,.007,.235),mAlu,0,.0035,.1175,lid);mesh(box(.332,.001,.227),mDark,0,-.0004,.1175,lid,{cast:false});
const scrC=document.createElement("canvas");scrC.width=1536;scrC.height=960;const sg=scrC.getContext("2d");
const scrT=new THREE.CanvasTexture(scrC);scrT.colorSpace=THREE.SRGBColorSpace;scrT.anisotropy=maxAniso;
const scrM=mesh(new THREE.PlaneGeometry(.312,.195),new THREE.MeshBasicMaterial({map:scrT,toneMapped:false}),0,-.0011,.1175,lid,{cast:false,recv:false});scrM.rotation.x=PI/2;
const LID_OPEN=-1.83;let scrMode="off",scrDirty=true,bootU=0,caret=true;

/* Plateau de dés, perchoir, lampe */
const TRAY={x:.43,z:.07,y:.756};
(function(){const felt=ctex(512,460,(g,w,h)=>{g.fillStyle="#0b3557";g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){g.fillStyle="rgba("+(rnd()<.5?"255,255,255":"0,0,0")+","+(rnd()*.07)+")";g.fillRect(rnd()*w,rnd()*h,1.5,1.5)}
    g.strokeStyle="#FF8000";g.lineWidth=4;g.setLineDash([14,9]);g.strokeRect(22,22,w-44,h-44);g.setLineDash([]);g.strokeStyle="rgba(116,210,250,.5)";g.lineWidth=2;g.strokeRect(36,36,w-72,h-72)});
  mesh(box(.4,.006,.36),M(0xffffff,{map:felt,roughness:1}),TRAY.x,.753,TRAY.z);const rim=M(0x082640,{roughness:.45});
  mesh(box(.424,.018,.012),rim,TRAY.x,.759,TRAY.z-.186);mesh(box(.424,.018,.012),rim,TRAY.x,.759,TRAY.z+.186);mesh(box(.012,.018,.36),rim,TRAY.x-.206,.759,TRAY.z);mesh(box(.012,.018,.36),rim,TRAY.x+.206,.759,TRAY.z)})();
const wDark=M(0x6b4424,{roughness:.5});
const perch=new THREE.Group();perch.position.set(.44,.75,-.28);perch.rotation.y=-.3;scene.add(perch);
mesh(cyl(.06,.068,.014,32),wDark,0,.007,0,perch);mesh(cyl(.006,.006,.15,12),mBrass,0,.089,0,perch);mesh(cyl(.007,.007,.16,12),wDark,0,.164,0,perch).rotation.z=PI/2;
stick(new V3(0,.046,0),new V3(0,.046,.102),.004,mBrass,perch);
mesh(new THREE.CylinderGeometry(.029,.02,.016,24,1,true),M(0xc9a24a,{roughness:.3,metalness:.9,side:THREE.DoubleSide}),0,.056,.102,perch);mesh(cyl(.02,.02,.002,24),mBrass,0,.049,.102,perch);

/* Perroquet (l'IA) : pivot aux pattes pour qu'il se penche vers la coupelle */
const R=.021,RIN=R*.7947;
const cupSpot=new THREE.Object3D();cupSpot.position.set(0,.051+RIN,.102);perch.add(cupSpot);
const parrot=new THREE.Group();parrot.position.set(0,.171,0);perch.add(parrot);
const pBody=new THREE.Group();parrot.add(pBody);
const fV=M(C.vif,{roughness:.55}),fC=M(C.cyan,{roughness:.55}),fN=M(C.profond,{roughness:.55}),fO=M(C.orange,{roughness:.4}),fO2=M(0xE86008,{roughness:.4});
ell(.05,.068,.055,fV,0,.075,-.005,pBody).rotation.x=.25;const belly=ell(.038,.052,.036,fC,0,.068,.022,pBody);
const head=new THREE.Group();head.position.set(0,.15,.022);pBody.add(head);
mesh(sph(.04,28,20),fV,0,0,0,head);
const eyes=[];[-1,1].forEach(s=>{ell(.012,.021,.021,mWhite,s*.031,.004,.012,head);const e=mesh(sph(.0068,14,10),M(0x05080b,{roughness:.15}),s*.0375,.008,.017,head);eyes.push(e);mesh(sph(.002,8,6),new THREE.MeshBasicMaterial({color:0xffffff}),s*.0415,.011,.021,head,{cast:false})});
ell(.016,.015,.024,fO,0,-.004,.04,head);const hook=mesh(new THREE.ConeGeometry(.0095,.026,16),fO,0,-.02,.057,head);hook.rotation.x=PI-.25;ell(.011,.008,.014,fO2,0,-.021,.036,head);
const crest=new THREE.Group();crest.position.set(0,.034,-.004);head.add(crest);
[fO,fC,fO].forEach((m,i)=>{const c=mesh(new THREE.ConeGeometry(.0065,.04,10),m,0,.016-i*.003,-i*.013,crest);c.rotation.x=-.5-i*.28});
const beakTip=new THREE.Object3D();beakTip.position.set(0,-.036,.06);head.add(beakTip);
const wings=[];[-1,1].forEach(s=>{const w=new THREE.Group();w.position.set(s*.045,.11,-.01);pBody.add(w);ell(.012,.055,.04,fN,s*.006,-.04,-.004,w);ell(.009,.03,.024,fC,s*.01,-.07,-.02,w);wings.push(w)});
[[0,fN],[-.013,fV],[.013,fO]].forEach(t=>{const f=ell(.011,.075,.013,t[1],t[0],-.012,-.062,pBody);f.rotation.x=.55});
const mLeg=M(0x8b8f94,{roughness:.6});[-1,1].forEach(s=>{mesh(cyl(.004,.004,.03,8),mLeg,s*.018,.012,0,pBody);const f=mesh(new THREE.TorusGeometry(.0095,.0035,8,16),mLeg,s*.018,-.007,0,parrot);f.rotation.y=PI/2});

/* Lampe de bureau : sa lumière suit la température */
const LAMP={head:new V3(.69,1.1,-.1),target:new V3(TRAY.x,.756,TRAY.z)};
mesh(cyl(.07,.08,.02,32),mNuit,.82,.76,-.3);
stick(new V3(.82,.77,-.3),new V3(.88,1.04,-.32),.008,mAlu);mesh(sph(.014,12,10),mNuit,.88,1.04,-.32);stick(new V3(.88,1.04,-.32),LAMP.head,.008,mAlu);
const lampHead=new THREE.Group();lampHead.position.copy(LAMP.head);lampHead.quaternion.setFromUnitVectors(new V3(0,-1,0),new V3().subVectors(LAMP.target,LAMP.head).normalize());scene.add(lampHead);
mesh(new THREE.CylinderGeometry(.026,.074,.1,32,1,true),M(C.orange,{roughness:.35,side:THREE.DoubleSide}),0,0,0,lampHead);mesh(cyl(.026,.026,.004,24),M(C.orange,{roughness:.35}),0,.05,0,lampHead);
const bulbMat=new THREE.MeshBasicMaterial({color:0xfff0dc,toneMapped:false});mesh(sph(.024,16,12),bulbMat,0,-.025,0,lampHead,{cast:false,recv:false});
const glowT=ctex(128,128,g=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.35,"rgba(255,255,255,.35)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,128,128)});
const mkGlow=(sc,op)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op}));s.scale.set(sc,sc,1);scene.add(s);return s};
const lampGlow=mkGlow(.34,.55);lampGlow.position.copy(LAMP.head).add(new V3(-.03,-.06,.03));
const steam=[0,1,2].map(i=>{const s=mkGlow(.05,.0);s.userData.o=i/3;return s});

/* Dé à 20 faces : chaque face a son numéro, sa normale et son "haut" pour retomber lisible */
const faceN=[],faceUp=[];
const die=(function(){const geo=new THREE.IcosahedronGeometry(R,0),pos=geo.attributes.position,uv=new Float32Array(120),W=1000,H=800,pts=[[100,14],[6,177],[194,177]];
  const tex=ctex(W,H,g=>{const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,"#FFA033");gr.addColorStop(1,"#F26F00");g.fillStyle=gr;g.fillRect(0,0,W,H);
    for(let i=0;i<20;i++){const cx=(i%5)*200,cy=Math.floor(i/5)*200;g.strokeStyle="rgba(255,236,205,.9)";g.lineWidth=7;g.lineJoin="round";g.beginPath();g.moveTo(cx+pts[0][0],cy+pts[0][1]);g.lineTo(cx+pts[1][0],cy+pts[1][1]);g.lineTo(cx+pts[2][0],cy+pts[2][1]);g.closePath();g.stroke();
      g.fillStyle="#01233F";g.font="800 76px Montserrat,Arial,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(String(i+1),cx+100,cy+126);if(i===5||i===8)g.fillRect(cx+78,cy+162,44,6)}});
  for(let i=0;i<20;i++){const cx=(i%5)*200,cy=Math.floor(i/5)*200;for(let k=0;k<3;k++){uv[(i*3+k)*2]=(cx+pts[k][0])/W;uv[(i*3+k)*2+1]=1-(cy+pts[k][1])/H}
    const a=new V3().fromBufferAttribute(pos,i*3),b=new V3().fromBufferAttribute(pos,i*3+1),c=new V3().fromBufferAttribute(pos,i*3+2),cen=a.clone().add(b).add(c).divideScalar(3);faceN.push(cen.clone().normalize());faceUp.push(a.clone().sub(cen).normalize())}
  geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  return mesh(geo,new THREE.MeshPhysicalMaterial({map:tex,roughness:.34,clearcoat:.45,clearcoatRoughness:.3}),0,0,0)})();
const dieGlow=mkGlow(.16,.35);
function faceQuat(k,away){const q1=new THREE.Quaternion().setFromUnitVectors(faceN[k],Y),u=faceUp[k].clone().applyQuaternion(q1),b=Math.atan2(away.x,away.z)-Math.atan2(u.x,u.z);return new THREE.Quaternion().setFromAxisAngle(Y,b).multiply(q1)}
function resetDie(){perch.updateMatrixWorld(true);cupSpot.getWorldPosition(die.position);die.quaternion.copy(faceQuat(19,new V3(-.3,0,-1).normalize()))}

/* Lumières */
const hemi=new THREE.HemisphereLight(0xd6eaff,0x9a7a58,1.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe2bd,4.2);sun.position.set(-5.5,2.36,1.34);sun.target.position.set(0,.8,.3);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(big?4096:2048,big?4096:2048);Object.assign(sun.shadow.camera,{left:-3.4,right:3.4,top:2.6,bottom:-2.6,near:.5,far:13});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0003;sun.shadow.normalBias=.012;
const lamp=new THREE.SpotLight(0xfff0dc,2.2,3,.72,.7,2);lamp.position.copy(LAMP.head);lamp.target.position.copy(LAMP.target);scene.add(lamp,lamp.target);
lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.camera.near=.05;lamp.shadow.camera.far=2;lamp.shadow.bias=-.0006;
const fill=new THREE.PointLight(0xeaf4ff,7,9,2);fill.position.set(.2,2.45,1);scene.add(fill);
const scrL=new THREE.PointLight(0x9fd8ff,0,1.2,2);scrL.position.set(0,.92,.05);scene.add(scrL);
(function env(){const es=new THREE.Scene(),b=new THREE.MeshBasicMaterial({color:0x1a2836,side:THREE.BackSide});es.add(new THREE.Mesh(box(8,5,8),b));
  const p=(c,w,h,x,y,z,ry,rx)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);es.add(m)};
  p(0xffffff,2.4,1.6,-3.6,.6,.4,PI/2);p(0xfff2dc,2,.8,0,2.3,.8,0,PI/2);p(0xffb46a,.5,.5,1.4,1.2,-.4,-PI/3);p(0x3d6e96,5,2.5,0,.4,-3.8);
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(es,.03).texture;pm.dispose()})();
scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.material.envMapIntensity=.55});die.material.envMapIntensity=.28;

const tcA=new THREE.Color(0x8fd0ff),tcB=new THREE.Color(0xfff0dc),tcC=new THREE.Color(0xff7a1a),tc=new THREE.Color();
function tempColor(s){return s<50?tc.copy(tcA).lerp(tcB,s/50):tc.copy(tcB).lerp(tcC,(s-50)/50)}

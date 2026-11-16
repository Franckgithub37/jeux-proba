
/* ---------- Ajouts de scène : "IA" sur le ventre, texte du plateau, carnet, bras en blouse ---------- */
const FT="Poppins,Arial,sans-serif",FX="Montserrat,Arial,sans-serif",HAND='Caveat,"Segoe Script",cursive';
/* Images generees par API (PNG detoures de images/generated/, voir scripts/). Si le fichier manque, l'element de secours qui suit s'affiche. */
const GI="images/generated/";
const gimg=(n,cls,fb)=>'<img class="gi '+(cls||"")+'" src="'+GI+n+'.png" alt="" onerror="this.dataset.miss=1">'+(fb||"");
const ICFB='<i class="fb"></i>';
const bellyC=document.createElement("canvas");bellyC.width=1024;bellyC.height=512;
const bellyT=new THREE.CanvasTexture(bellyC);bellyT.colorSpace=THREE.SRGBColorSpace;bellyT.anisotropy=maxAniso;
belly.material=M(0xffffff,{map:bellyT,roughness:.55});belly.material.envMapIntensity=.55;
const signC=document.createElement("canvas");signC.width=1024;signC.height=160;
const signT=new THREE.CanvasTexture(signC);signT.colorSpace=THREE.SRGBColorSpace;signT.anisotropy=maxAniso;
const sign=mesh(new THREE.PlaneGeometry(.32,.05),new THREE.MeshBasicMaterial({map:signT,transparent:true,depthWrite:false,toneMapped:false}),TRAY.x,.7572,TRAY.z+.118,scene,{cast:false,recv:false});sign.rotation.x=-PI/2;
function drawDecals(){let g=bellyC.getContext("2d");g.fillStyle="#74D2FA";g.fillRect(0,0,1024,512);g.fillStyle="#01233F";g.font="700 150px "+FT;g.textAlign="center";g.textBaseline="middle";g.fillText("IA",256,262);bellyT.needsUpdate=true;
  g=signC.getContext("2d");g.clearRect(0,0,1024,160);g.font="700 60px "+FT;g.textAlign="center";g.textBaseline="middle";g.fillStyle="#fff";g.fillText("IA : un perroquet stochastique",512,84);signT.needsUpdate=true}

/* Carnet : couverture qui s'ouvre vers la gauche, page de droite dessinée en Canvas */
const NB={PW:.158,PH:.218,CW:768,CH:1024};
const nb=new THREE.Group();nb.position.set(-.42,.751,.19);nb.rotation.y=.1;scene.add(nb);
mesh(box(.166,.012,.226),M(0xf3efe4,{roughness:.9}),0,.006,0,nb);
const pageC=document.createElement("canvas");pageC.width=NB.CW;pageC.height=NB.CH;const pg=pageC.getContext("2d");
const pageT=new THREE.CanvasTexture(pageC);pageT.colorSpace=THREE.SRGBColorSpace;pageT.anisotropy=maxAniso;
mesh(new THREE.PlaneGeometry(NB.PW,NB.PH),M(0xffffff,{map:pageT,roughness:.9}),0,.0125,0,nb,{cast:false}).rotation.x=-PI/2;
const cover=new THREE.Group();cover.position.set(-.083,.008,0);nb.add(cover);
mesh(box(.17,.003,.23),M(0x0C497B,{roughness:.55}),.085,.0075,0,cover);
mesh(box(.012,.0034,.232),M(C.orange,{roughness:.5}),.142,.0076,0,cover);
const labT=ctex(512,200,(g,w,h)=>{g.fillStyle="#F8FCFF";g.fillRect(0,0,w,h);g.fillStyle="#01233F";g.font="700 64px Arial,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("Notes de garde",w/2,h/2+4)});
mesh(new THREE.PlaneGeometry(.1,.039),M(0xffffff,{map:labT,roughness:.8}),.075,.0092,-.04,cover,{cast:false}).rotation.x=-PI/2;
nb.updateMatrixWorld(true);
const ROWS=[];
const noteFont=r=>(r.head?"700 74px ":"700 64px ")+HAND;
function drawPage(){const g=pg,W=NB.CW,H=NB.CH;g.fillStyle="#fffdf6";g.fillRect(0,0,W,H);g.fillStyle="#c5dbe6";for(let y=30;y<H;y+=32)for(let x=128;x<W;x+=32)g.fillRect(x,y,3,3);
  g.strokeStyle="#FF8000";g.lineWidth=3;g.beginPath();g.moveTo(96,0);g.lineTo(96,H);g.stroke();g.textBaseline="alphabetic";g.textAlign="left";
  ROWS.forEach(r=>{if(r.dot&&r.n){g.fillStyle="#FF8000";g.beginPath();g.arc(70,r.y-18,8,0,7);g.fill()}if(!r.n)return;g.font=noteFont(r);g.fillStyle=r.head?"#d05c00":"#0C497B";const t=r.t.slice(0,r.n);g.fillText(t,116,r.y);
    if(r.head&&r.n===r.t.length){g.strokeStyle="#d05c00";g.lineWidth=4;g.beginPath();g.moveTo(116,r.y+12);g.lineTo(116+g.measureText(t).width,r.y+9);g.stroke()}});pageT.needsUpdate=true}
function nbW(x,y,z){return nb.localToWorld(new V3(x,y,z))}
function tipW(r,n,out){pg.font=noteFont(r);const x=116+pg.measureText(r.t.slice(0,Math.round(n))).width,y=r.y-10;out=out||new V3();out.set((x/NB.CW-.5)*NB.PW,.0135,(y/NB.CH-.5)*NB.PH);return nb.localToWorld(out)}

/* Bras en blouse blanche. Origine du bras droit : la pointe du stylo. Origine du bras gauche : le dessous de la paume. */
const mCoat=M(0xf7f9fb,{roughness:.85}),mSkin=M(0xd9a47c,{roughness:.65});
const HAND_PHI=.5;
/* Mains : paume extrudée aux bords arrondis, doigts en trois phalanges effilées reliées par des articulations, pouce en opposition, ongles discrets.
   La main est construite dans son propre repère (paume vers le bas, doigts vers -z, pouce du côté sx) puis orientée dans le bras. */
const mNail=M(0xeabfa6,{roughness:.4}),mBtn=M(0xcfd8e0,{roughness:.4});[mNail,mBtn].forEach(m=>m.envMapIntensity=.55);
function mkHand(sx,curls,grip){const h=new THREE.Group(),v=(x,y,z)=>new V3(sx*x,y,z);
  const ball=(p,r)=>mesh(sph(r,18,14),mSkin,p.x,p.y,p.z,h);
  const taper=(a,b,r1,r2)=>{const d=new V3().subVectors(b,a),m=mesh(cyl(r2,r1,d.length(),18),mSkin,0,0,0,h);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(Y,d.normalize());return m};
  const nail=(p,d,n,r)=>{const z=d.clone().negate(),x=new V3().crossVectors(n,z).normalize(),y=new V3().crossVectors(z,x).normalize(),m=mesh(sph(1,14,10),mNail,0,0,0,h);m.scale.set(r*.7,r*.2,r*.92);m.position.copy(p).addScaledVector(y,r*.8);m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z))};
  /* paume : contour vu du dessus (x, vers l'avant), extrudé puis couché */
  const s=new THREE.Shape(),O=[[-.021,-.048],[-.03,-.012],[-.0305,.03],[0,.043],[.0315,.038],[.0335,.012],[.035,-.02],[.023,-.048]];
  s.moveTo(sx*O[0][0],O[0][1]);s.splineThru(O.slice(1).map(p=>new THREE.Vector2(sx*p[0],p[1])));s.closePath();
  const pm=mesh(new THREE.ExtrudeGeometry(s,{depth:.005,bevelEnabled:true,bevelThickness:.0095,bevelSize:.0075,bevelSegments:10,curveSegments:28}),mSkin,0,.0095,0,h);pm.rotation.x=-PI/2;
  ell(.034,.0095,.047,mSkin,sx*.002,.0158,-.003,h);
  /* doigts : [x, z, écartement, longueur, rayon] de l'index à l'auriculaire */
  const F=[[.027,-.043,.09,.072,.0086],[.0095,-.049,.02,.08,.0088],[-.0085,-.047,-.06,.074,.0084],[-.0255,-.039,-.16,.058,.0074]];
  const tips=F.map((f,i)=>{const yaw=sx*f[2],L=f[3],r=f[4],ls=[L*.46,L*.3,L*.24],rs=[r,r*.93,r*.86,r*.78];let p=v(f[0],.0142,f[1]),th=0,d,n;ball(p,r*1.14);
    for(let k=0;k<3;k++){th+=curls[i][k];d=new V3(Math.sin(yaw)*Math.cos(th),-Math.sin(th),-Math.cos(yaw)*Math.cos(th));n=new V3(Math.sin(yaw)*Math.sin(th),Math.cos(th),-Math.cos(yaw)*Math.sin(th));const q=p.clone().addScaledVector(d,ls[k]);taper(p,q,rs[k],rs[k+1]);ball(q,rs[k+1]);if(k===2)nail(p.clone().lerp(q,.62),d,n,rs[3]);p=q}
    return p});
  /* pouce : métacarpien épais, deux phalanges */
  const T=(grip?[[.024,.0115,.024],[.046,-.004,-.012],[.05,-.022,-.045],[.04,-.034,-.07]]:[[.024,.0115,.024],[.046,.0108,-.004],[.056,.0098,-.03],[.0585,.009,-.05]]).map(p=>v(p[0],p[1],p[2])),tr=[.0125,.0108,.0096,.0082];
  ball(T[0],tr[0]);for(let k=0;k<3;k++){taper(T[k],T[k+1],tr[k],tr[k+1]);ball(T[k+1],tr[k+1])}
  const td=new V3().subVectors(T[3],T[2]).normalize(),tn=grip?new V3().subVectors(T[3],tips[0]).normalize():new V3(0,1,0);nail(T[2].clone().lerp(T[3],.62),td,tn,tr[3]);
  /* poignet, légèrement aplati */
  ell(.0265,.0142,.026,mSkin,0,.0125,.047,h);const wl=grip?.108:.082,wm=taper(new V3(0,.0125,.046),new V3(0,.014,wl),.0235,.022);wm.scale.set(1,1,.62);
  if(grip){/* montre au poignet de la main qui écrit : bracelet, boîtier métal, cadran clair, aiguilles, couronne */
    const mStrap=M(0x1b2a3d,{roughness:.6}),mCase=M(0xc9d1d9,{roughness:.25,metalness:.9}),mDial=M(0xfbfcfd,{roughness:.35}),zc=.075;[mStrap,mCase,mDial].forEach(m=>m.envMapIntensity=.55);
    const st=mesh(cyl(.0243,.0243,.0135,28),mStrap,0,.0133,zc,h);st.rotation.x=PI/2;st.scale.set(1,1,.64);
    mesh(cyl(.0132,.0132,.005,28),mCase,0,.0298,zc,h);mesh(cyl(.0109,.0109,.0054,28),mDial,0,.0299,zc,h);
    mesh(box(.0012,.0006,.0068),mDark,0,.0329,zc-.0029,h);mesh(box(.005,.0006,.0012),mDark,sx*-.0022,.0329,zc,h);mesh(cyl(.0011,.0011,.0008,10),M(C.orange),0,.0331,zc,h);
    mesh(cyl(.0019,.0019,.004,10),mCase,sx*.0148,.0298,zc,h).rotation.z=PI/2}
  h.userData={tips,thumb:T[3],wrist:new V3(0,.014,wl-.002)};return h}
function mkArm(right){const g=new THREE.Group();scene.add(g);g.visible=false;const sx=right?-1:1;
  const h=mkHand(sx,right?[[.5,.65,.4],[.66,.9,.5],[.85,1.05,.6],[.95,1.1,.6]]:[[.03,.07,.1],[.03,.07,.1],[.04,.08,.1],[.06,.1,.12]],right);g.add(h);
  if(right){
    /* stylo tenu entre le pouce et l'index, appuyé dans le creux du pouce ; la pointe du stylo est l'origine du bras */
    const P=h.userData.tips[0].clone().lerp(h.userData.thumb,.5),u=new V3(sx*.04,.021,-.024).sub(P).normalize(),tip=P.clone().addScaledVector(u,-.03),mPen=M(C.orange,{roughness:.3});mPen.envMapIntensity=.55;
    stick(tip.clone().addScaledVector(u,.014),tip.clone().addScaledVector(u,.142),.0048,mPen,h);
    const cap=mesh(cyl(.0052,.0052,.02,14),mNuit,0,0,0,h);cap.position.copy(tip).addScaledVector(u,.134);cap.quaternion.setFromUnitVectors(Y,u);
    const pt=mesh(new THREE.ConeGeometry(.0048,.015,12),mDark,0,0,0,h);pt.position.copy(tip).addScaledVector(u,.0075);pt.quaternion.setFromUnitVectors(Y,u.clone().negate());
    const bw=new V3(.028,.105,.07).normalize(),q=new THREE.Quaternion().setFromUnitVectors(u,bw),tq=new THREE.Quaternion().setFromAxisAngle(bw,HAND_PHI);
    h.quaternion.copy(tq).multiply(q);h.position.copy(tip).applyQuaternion(h.quaternion).negate()}
  else h.rotation.y=-.38;
  /* manche de blouse, revers et bouton, dans le prolongement du poignet */
  h.updateMatrix();const w=h.userData.wrist.clone().applyMatrix4(h.matrix),dn=(right?new V3(.5,.1,.86):new V3(-.52,.12,.84)).normalize(),q2=new THREE.Quaternion().setFromUnitVectors(Y,dn);
  const sl=mesh(cyl(.046,.031,.38,24),mCoat,0,0,0,g);sl.position.copy(w).addScaledVector(dn,.19);sl.quaternion.copy(q2);
  const cf=mesh(cyl(.0345,.0335,.032,24),mCoat,0,0,0,g);cf.position.copy(w).addScaledVector(dn,.022);cf.quaternion.copy(q2);
  const bt=mesh(cyl(.0042,.0042,.003,12),mBtn,0,0,0,g);bt.position.copy(w).addScaledVector(dn,.022).add(new V3(0,.0345,0));
  return g}
let armL=mkArm(false),armR=mkArm(true);
/* Mains en image (PNG générés par API, images/generated/main_*.png) : plans horizontaux posés juste au-dessus du carnet, avec une ombre portée découpée selon la transparence.
   Si les deux images se chargent, elles remplacent les bras 3D et la scène du carnet est filmée du dessus. Repère : pointe du stylo (main droite), centre de la paume (main gauche). */
let SPR=false;
(function(){const TL=new THREE.TextureLoader();
  const mk=(name,W,H,ax,ay,yaw,lift)=>new Promise((res,rej)=>TL.load(GI+name+".png",t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAniso;
    const g=new THREE.Group(),piv=new THREE.Group(),m=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.04,roughness:.95}));
    m.material.envMapIntensity=.3;m.rotation.x=-PI/2;m.position.set((.5-ax)*W,lift,(.5-ay)*H);m.castShadow=true;m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:t,alphaTest:.5});
    piv.rotation.y=yaw;piv.add(m);g.add(piv);g.visible=false;scene.add(g);res(g)},undefined,rej));
  Promise.all([mk("main_gauche",.33,.495,.49,.28,-.38,.012),mk("main_droite",.37,.555,.164,.051,.1,.003)]).then(a=>{armL.visible=armR.visible=false;armL=a[0];armR=a[1];SPR=true}).catch(()=>{})})();
[mCoat,mSkin].forEach(m=>m.envMapIntensity=.55);

/* Décor du mur du fond, visible depuis le poste de jeu : bibliothèque à gauche, étagère de livres à droite (le tableau de liège est descendu dans middle.js) */
(function(){const bm=c=>{const m=M(c,{roughness:.65});m.envMapIntensity=.55;return m},mPage=bm(0xf3ecdd);
  /* Livres : chacun a un dos illustré avec son titre (texture dessinée), une tranche couleur papier, et une hauteur proche de ses voisins */
  const TIT=["Pharmacologie","Anatomie","Sémiologie","Urgences","Éthique du soin","IA en santé","Recommandations","Soins infirmiers","Biostatistiques","Protocoles","Cardiologie","Pédiatrie","Qualité des soins","Thérapeutique","Gériatrie","Santé publique","Dermatologie","Neurologie","Douleur","Hygiène"],
    PAL=[["#01233F","#74D2FA"],["#0C497B","#FFFFFF"],["#29ABE2","#01233F"],["#FF8000","#01233F"],["#F4F7F9","#0C497B"],["#0B80B2","#FFFFFF"],["#E86008","#FFFFFF"],["#74D2FA","#01233F"]];let bi=0;
  const book=(x,y,z,w,h)=>{const p=PAL[(bi*3+1)%PAL.length],t=TIT[bi%TIT.length];bi++;
    const tex=ctex(96,512,(g,W,H)=>{g.fillStyle=p[0];g.fillRect(0,0,W,H);g.fillStyle=p[1];g.fillRect(12,24,W-24,6);g.fillRect(12,H-60,W-24,6);g.fillRect(12,H-46,W-24,3);g.beginPath();g.arc(W/2,H-24,7,0,7);g.fill();
      g.save();g.translate(W/2,H/2-14);g.rotate(-PI/2);g.font="700 44px Arial,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(t,0,2,H-150);g.restore()});
    const side=bm(new THREE.Color(p[0]).getHex()),spine=M(0xffffff,{map:tex,roughness:.6});spine.envMapIntensity=.55;return mesh(box(w,h,.165),[side,side,mPage,side,spine,side],x+w/2,y+h/2,z)};
  const books=(x0,x1,y,z)=>{let x=x0,h=.215+rnd()*.04;while(x<x1-.045){const w=.03+rnd()*.02;h=Math.max(.2,Math.min(.262,h+(rnd()-.5)*.03));book(x,y,z,w,h);x+=w+.0025;if(rnd()<.1)x+=.028}};
  const bx=-1.2,bz=-1.15;mesh(box(.92,1.36,.02),mWhite,bx,.68,-1.285);mesh(box(.03,1.36,.26),mWhite,bx-.46,.68,bz);mesh(box(.03,1.36,.26),mWhite,bx+.46,.68,bz);
  [.012,.4,.74,1.05,1.348].forEach(y=>mesh(box(.92,.025,.26),mWhite,bx,y,bz));
  [.4,.74,1.05].forEach(y=>books(bx-.43,bx+.43,y+.0125,bz+.02));
  mesh(box(.2,.05,.15),bm(C.profond),bx-.2,1.385,bz);mesh(box(.17,.04,.13),bm(C.orange),bx-.19,1.43,bz);mesh(sph(.06,20,14),bm(C.cyan),bx+.22,1.42,bz);
  mesh(box(.7,.025,.2),mWhite,1.32,.985,-1.19);mesh(box(.025,.09,.16),mAlu,1.02,.93,-1.2);mesh(box(.025,.09,.16),mAlu,1.62,.93,-1.2);books(1.0,1.64,.9975,-1.19)})();

/* ---------- Écran de l'ordinateur (texture dessinée) ---------- */
function rr(g,x,y,w,h,r){g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)}
function wrapLines(g,text,maxW){const out=[];let line="";for(const w of text.split(" ")){const t=line?line+" "+w:w;if(g.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t}if(line)out.push(line);return out}
function drawScreen(){const g=sg,W=1536,H=960,P=G.role;g.setLineDash([]);g.textAlign="left";g.textBaseline="middle";
  if(scrMode==="off"){g.fillStyle="#04080c";g.fillRect(0,0,W,H);scrT.needsUpdate=true;return}
  if(scrMode==="boot"){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,"#01233F");gr.addColorStop(1,"#0B80B2");g.fillStyle=gr;g.fillRect(0,0,W,H);g.textAlign="center";g.fillStyle="#fff";g.font="700 120px "+FT;g.fillText("Elliacare",W/2,H/2-50);
    g.font="600 34px "+FX;g.fillStyle="#74D2FA";g.fillText("Assistant IA",W/2,H/2+50);g.fillStyle="rgba(255,255,255,.2)";rr(g,W/2-240,H/2+120,480,12,6);g.fill();g.fillStyle="#FF8000";rr(g,W/2-240,H/2+120,480*bootU,12,6);g.fill();scrT.needsUpdate=true;return}
  g.fillStyle="#F8FCFF";g.fillRect(0,0,W,H);g.fillStyle="#01233F";g.fillRect(0,0,W,92);g.fillStyle="#FF8000";g.fillRect(40,26,8,40);
  g.fillStyle="#fff";g.font="700 38px "+FT;g.fillText("Assistant IA",66,48);g.font="600 26px "+FX;g.fillStyle="#74D2FA";g.textAlign="right";g.fillText("Sources : "+SRC[G.src].n,W-44,48);g.textAlign="left";
  /* la demande, avec la phrase qui cadre les sources */
  g.fillStyle="#0B80B2";g.font="700 24px "+FX;g.fillText("VOTRE DEMANDE",60,134);
  g.font="600 42px "+FX;const ql=wrapLines(g,P.q,W-210);g.font="700 36px "+FX;const al=SRC[G.src].add?wrapLines(g,SRC[G.src].add,W-210):[];
  const bh=40+ql.length*54+(al.length?8+al.length*48:0);g.fillStyle="#E8F4F8";rr(g,60,160,W-120,bh,22);g.fill();g.fillStyle="#29ABE2";rr(g,60,160,10,bh,5);g.fill();
  let y=160+20+27;g.font="600 42px "+FX;g.fillStyle="#01233F";ql.forEach(l=>{g.fillText(l,100,y);y+=54});
  if(al.length){y+=4;g.font="700 36px "+FX;g.fillStyle="#D05C00";al.forEach(l=>{g.fillText(l,100,y);y+=48})}
  /* les réponses : les précédentes en petit, la réponse en cours en grand */
  y=160+bh+46;g.fillStyle="#0B80B2";g.font="700 24px "+FX;g.fillText("RÉPONSE DE L'IA",60,y);y+=54;
  const h=G.chapHist,past=G.fresh?h.slice(0,-1):h,old=past.slice(-2),base=past.length-old.length;
  g.font="600 31px "+FX;g.fillStyle="#7d99ab";old.forEach((ci,i)=>{wrapLines(g,(base+i+1)+". "+P.pre+" "+P.c[ci][0]+".",W-120).forEach(l=>{g.fillText(l,60,y);y+=42});y+=4});
  y+=18;g.font="600 46px "+FX;g.fillStyle="#01233F";const pl=wrapLines(g,P.pre,W-120);pl.forEach((l,i)=>{g.fillText(l,60,y);if(i<pl.length-1)y+=70});
  let x=60+g.measureText(pl[pl.length-1]).width+16;
  const full=G.typing?P.c[G.typing.ci][0]:G.fresh?P.c[h[h.length-1]][0]:null,cur=G.typing?full.slice(0,G.typing.n):full;
  const fw=full===null?260:g.measureText(full).width+28;if(x+fw>W-60){x=60;y+=70}
  if(cur===null){g.setLineDash([10,8]);g.lineWidth=4;g.strokeStyle="#FF8000";g.fillStyle="#FFF1E0";rr(g,x,y-33,260,66,12);g.fill();g.stroke();g.setLineDash([]);if(caret){g.fillStyle="#FF8000";g.fillRect(x+18,y-26,6,52)}}
  else{const w=g.measureText(cur).width+28;g.fillStyle=G.typing?"#FFF1E0":"#DEF5FF";rr(g,x,y-34,w,68,12);g.fill();g.fillStyle="#01233F";g.fillText(cur,x+14,y);if(G.typing){if(caret){g.fillStyle="#FF8000";g.fillRect(x+w-8,y-26,6,52)}}else g.fillText(".",x+w+4,y)}
  g.fillStyle="#01233F";g.fillRect(0,H-64,W,64);g.fillStyle="#74D2FA";g.font="600 24px "+FX;g.fillText("Température : "+tempName(G.s).toLowerCase(),44,H-31);g.textAlign="right";g.fillStyle="#fff";g.fillText("Réponse non vérifiée",W-44,H-31);g.textAlign="left";scrT.needsUpdate=true}

/* ---------- Son (synthèse, démarre au clic) et voix off (fichiers audio facultatifs) ---------- */
let AC=null,muted=false;
function initAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume()}catch(e){AC=null}}
function noise(d,f,v){if(!AC||muted)return;try{const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);const s=AC.createBufferSource(),bp=AC.createBiquadFilter(),ga=AC.createGain();s.buffer=b;bp.type="bandpass";bp.frequency.value=f;bp.Q.value=1.1;ga.gain.value=v;s.connect(bp);bp.connect(ga);ga.connect(AC.destination);s.start()}catch(e){}}
function tone(f0,f1,d,v,type,delay){if(!AC||muted)return;try{const o=AC.createOscillator(),ga=AC.createGain(),t=AC.currentTime+(delay||0);o.type=type||"sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);ga.gain.setValueAtTime(v,t);ga.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(ga);ga.connect(AC.destination);o.start(t);o.stop(t+d+.03)}catch(e){}}
const sfx={hit:v=>{noise(.06,1700,.55*v);tone(230,95,.08,.28*v)},key:()=>noise(.022,3300,.1),chime:()=>{tone(880,880,.25,.1);tone(1320,1320,.32,.09,"sine",.09)},squawk:()=>{tone(720,1500,.09,.06,"sawtooth");tone(1400,620,.14,.05,"sawtooth",.09)},warn:()=>tone(320,180,.35,.12,"triangle"),ok:()=>{tone(660,660,.15,.09);tone(990,990,.28,.09,"sine",.11)},boot:()=>{tone(440,440,.2,.06);tone(660,660,.3,.06,"sine",.15)},
  pen:()=>noise(.05,2600,.035),page:()=>noise(.3,900,.14),whoosh:()=>noise(.35,480,.12),pop:()=>tone(520,780,.12,.07)};
/* Cri du perroquet (fichier audio/perroquet.mp3) : il part dès que le perroquet apparaît pour prendre le dé et dure 4,4 s,
   jusqu'à un silence naturel de l'enregistrement, avec un court fondu de sortie. Sans le fichier, le petit cri de synthèse reste utilisé. */
const CRI=new Audio();CRI.preload="auto";CRI.src="audio/perroquet.mp3";let criTok=0;const CRI_VOL=.35,CRI_DEB=.15,CRI_DUR=4.4;
function cri(){const tok=++criTok;if(muted||G.norender||CRI.readyState<2)return;
  try{CRI.currentTime=CRI_DEB;CRI.volume=CRI_VOL;const p=CRI.play();if(p)p.catch(()=>{})}catch(e){return}
  const t0=performance.now();(function f(){if(tok!==criTok)return;const t=(performance.now()-t0)/1000;if(t>=CRI_DUR){try{CRI.pause()}catch(e){}return}
    CRI.volume=CRI_VOL*Math.min(1,Math.max(0,(CRI_DUR-t)/.25));setTimeout(f,40)})()}
function criStop(){criTok++;try{CRI.pause()}catch(e){}}
const AUD={};let voLoaded=false,voTok=0,voSkip=false,voCur=null;
function loadVO(){if(voLoaded)return;voLoaded=true;Object.keys(VO).forEach(id=>{const tryExt=x=>{if(!x.length)return;const a=new Audio();a.preload="auto";a.addEventListener("loadedmetadata",()=>{AUD[id]=a});a.addEventListener("error",()=>tryExt(x.slice(1)));a.src="audio/vo_"+id+"."+x[0]};tryExt(["wav","mp3","m4a"])})}
/* Durée d'une ligne de sous-titre sans fichier audio, et rythme propre à certaines séquences (l'arrivée au cabinet et le chapitre 3 vont plus vite) */
const lineDur=t=>1.2+t.length/15,VOK={intro:.5,c3:.7,c2a:.9,c2b:.9,c4:.9};
function voDur(id){const a=AUD[id];return a&&isFinite(a.duration)&&a.duration>0?a.duration:VO[id].reduce((s,l)=>s+lineDur(l[0]),0)*(VOK[id]||1)}
function caption(t){const el=$("#caption");if(t){el.textContent=t;el.classList.add("show")}else el.classList.remove("show")}
/* Joue une séquence de voix off : sous-titres ligne à ligne, calés sur la durée du fichier audio s'il existe */
/* Deux voix ne s'enchaînent jamais à la suite : 2 s de silence après une voix allée à son terme, un court instant après une voix coupée par le joueur. */
let voLibre=0;const VO_ECART=2,VO_COUPE=.35;
async function speak(id,run,onLine,muet){const tok=++voTok,L=VO[id],a=AUD[id],sum=L.reduce((s,l)=>s+lineDur(l[0]),0),k=voDur(id)/sum;voSkip=false;
  if(voCur){try{if(!voCur.paused&&!voCur.ended)voLibre=Math.max(voLibre,performance.now()+VO_COUPE*1000);voCur.pause()}catch(e){}}voCur=null;
  if(!G.norender){const att=voLibre-performance.now();if(att>0){await new Promise(r=>setTimeout(r,att));if(tok!==voTok||run!==G.run)return false}}
  if(a){try{a.currentTime=0;a.muted=muted;a.play().catch(()=>{});voCur=a}catch(e){}}
  /* Le passage d'une ligne à la suivante suit l'horloge du son (ou l'heure réelle sans fichier), jamais le rythme d'affichage :
     si l'ordinateur affiche lentement, l'image saute des étapes mais ne prend pas de retard sur la voix. */
  const t0=performance.now(),attendre=cible=>new Promise(res=>{(function f(){if(tok!==voTok||run!==G.run||voSkip)return res();
    const t=(a&&!a.paused&&a.currentTime>0)?a.currentTime:(performance.now()-t0)/1000;if(t>=cible||(a&&a.ended))return res();setTimeout(f,50)})()});
  let cum=0;
  for(let i=0;i<L.length;i++){if(onLine)onLine(i);if(!muet)caption(L[i][0]);cum+=lineDur(L[i][0])*k;if(G.norender)await wait(lineDur(L[i][0])*k);else await attendre(cum);if(tok!==voTok||run!==G.run)return;if(voSkip){if(onLine)onLine(L.length-1);break}}
  caption("");if(voSkip&&a){try{a.pause()}catch(e){}}voLibre=performance.now()+(voSkip?VO_COUPE:VO_ECART)*1000;return voSkip}

/* ---------- Caméra, tweens, boucle ---------- */
const POSES={menu:{p:[1.55,1.66,3.0],l:[.1,.95,-.2],f:46},desk:{p:[.19,1.42,1.3],l:[.19,.83,-.1],f:44},card:{p:[.19,1.5,1.4],l:[.19,.95,-.1],f:44},
  screen:{p:[.02,1.07,.40],l:[0,.872,-.14],f:31},screenB:{p:[.27,1.05,.36],l:[0,.875,-.14],f:35},
  parrot:{p:[.17,1.07,.34],l:[.44,.95,-.27],f:40},parrotB:{p:[.6,.85,.22],l:[.44,.99,-.27],f:42},parrotC:{p:[-.14,1.03,.04],l:[.44,.96,-.27],f:36},
  note:{p:[-.37,1.13,.43],l:[-.41,.76,.2],f:36},noteB:{p:[-.98,1.06,.3],l:[-.3,.78,.16],f:40},noteW:{p:[-.36,1.4,.42],l:[-.38,.76,.22],f:40},noteT:{p:[-.4,1.19,.37],l:[-.41,.76,.21],f:36},shelf:{p:[-.5,1.12,.35],l:[-1.2,.95,-1.15],f:40},
  e2:{p:[-1.3,1.25,.8],l:[.15,.86,-.1],f:42},e3:{p:[1.3,1.22,.6],l:[.15,.86,-.1],f:42},wide:{p:[.9,1.5,2.2],l:[.1,.9,-.2],f:46}};
/* Plans alternés d'un lancer à l'autre : gros plans sur le perroquet, puis sur l'écran */
const PSH=["parrot","parrotB","parrotC"],SSH=["screen","screenB"];
const ENTRY={1:"parrot",2:"e2",3:"e3"};
const CAM={p:new V3(),l:new V3(),f:46,tp:new V3(),tl:new V3(),tf:46,rate:4.2,pose:"menu"};
function setCam(n,snap){const o=POSES[n];CAM.pose=n;CAM.tp.set(o.p[0],o.p[1],o.p[2]);CAM.tl.set(o.l[0],o.l[1],o.l[2]);CAM.tf=o.f;if(snap||RM){CAM.p.copy(CAM.tp);CAM.l.copy(CAM.tl);CAM.f=CAM.tf}}
const tweens=[],waiters=[];
function tw(d,fn){return new Promise(res=>tweens.push({t:0,d,fn,res}))}
const wait=d=>tw(d,()=>{}),nextFrame=()=>new Promise(r=>waiters.push(r));
const fadeEl=$("#fade");
/* Changement de plan franc : fondu au noir très court */
/* Léger travelling avant après une coupe, pour qu'aucun plan ne soit figé */
function dolly(){CAM.rate=.3;CAM.tp.lerp(CAM.tl,.1)}
async function cut(n){fadeEl.classList.add("on");await wait(.22);setCam(n,true);await wait(.06);fadeEl.classList.remove("on")}
let VW=1,VH=1,time=0,last=performance.now(),holding=false,follow=false,tossing=false,blinkT=0;
const _v=new V3(),_a=new V3();function toScreen(v){_v.copy(v).project(camera);return[(_v.x*.5+.5)*VW,(-_v.y*.5+.5)*VH]}
function loop(now){requestAnimationFrame(loop);tick(now)}
/* Qualité adaptative : si l'affichage peine (moins de 33 images par seconde en moyenne), on baisse la définition du rendu, puis les flous et les ombres. */
let PR=Math.min(window.devicePixelRatio||1,1.75),QL=0,perfN=0,perfT=0;
function alleger(){if(PR>1){PR=Math.max(1,PR-.4);renderer.setPixelRatio(PR);VW=0;return}
  if(QL===0){QL=1;view.classList.add("lowfx");lamp.castShadow=false;return}
  if(QL===1){QL=2;sun.shadow.mapSize.set(1024,1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}}
function tick(now){const raw=Math.max(0,(now-last)/1000),dt=Math.min(.1,raw)*G.speed;last=now;time+=dt;
  if(!G.norender&&raw<.5){perfN++;perfT+=raw;if(perfT>2){if(perfT/perfN>.03)alleger();perfN=0;perfT=0}}
  const w=view.clientWidth,h=view.clientHeight;if(w!==VW||h!==VH){VW=w;VH=h;renderer.setSize(w,h,false);camera.aspect=w/h}
  for(let i=tweens.length-1;i>=0;i--){const a=tweens[i];a.t+=dt;const u=Math.min(1,a.t/a.d);a.fn(u);if(u>=1){tweens.splice(i,1);a.res()}}
  if(waiters.length){const ws=waiters.splice(0);ws.forEach(r=>r(dt))}
  /* vie de la scène */
  const hot=G.s/100;
  if(!tossing){head.rotation.y=Math.sin(time*(.6+hot*1.6))*.35;head.rotation.z=Math.sin(time*(.9+hot*2.2)+1)*.12;pBody.rotation.x=Math.sin(time*1.7)*.02}
  crest.rotation.x=-.15+hot*.5+Math.sin(time*3)*.04*hot;
  blinkT-=dt;if(blinkT<0)blinkT=2.5+Math.random()*2.5;const ey=blinkT<.12?.15:1;eyes.forEach(e=>e.scale.y=ey);
  steam.forEach(s=>{const u=(time*.22+s.userData.o)%1;s.position.set(-.36+Math.sin(u*6+s.userData.o*9)*.012,.84+u*.16,-.1);s.material.opacity=Math.sin(u*PI)*.16;s.scale.setScalar(.04+u*.07)});
  if(holding){beakTip.getWorldPosition(die.position);die.position.y-=R*.55}
  dieGlow.position.copy(die.position);dieGlow.position.y+=.004;
  if(follow)CAM.tl.lerp(die.position,.35);
  if(CAM.pose==="menu"||CAM.pose==="wide"){const o=POSES[CAM.pose];CAM.tp.x=o.p[0]+Math.sin(time*.16)*.28;CAM.tp.y=o.p[1]+Math.sin(time*.11)*.05}
  if(CAM.pose==="desk"&&G.state==="aim"){CAM.tp.x=POSES.desk.p[0]+Math.sin(time*.33)*.04;CAM.tp.y=POSES.desk.p[1]+Math.sin(time*.27)*.012}
  const k=1-Math.exp(-dt*CAM.rate);CAM.p.lerp(CAM.tp,k);CAM.l.lerp(CAM.tl,k);CAM.f+=(CAM.tf-CAM.f)*k;
  camera.position.copy(CAM.p);camera.position.y+=Math.sin(time*1.1)*.0012;camera.lookAt(CAM.l);
  const asp=VW/VH;let f=CAM.f;if(asp<1.5)f=2*Math.atan(Math.tan(f*PI/360)*1.5/asp)*180/PI;camera.fov=Math.min(f,88);camera.updateProjectionMatrix();
  /* pendant le jeu, l'image est décalée vers la droite de la moitié de la colonne de gauche, pour que la scène reste centrée dans la zone libre */
  const sw=(G.state==="aim"||G.state==="roll"||G.state==="wait")&&VW>900?UIK*158:0;shiftPx+=(sw-shiftPx)*(RM?1:1-Math.exp(-dt*6));if(shiftPx>.5)camera.setViewOffset(VW,VH,-shiftPx,0,VW,VH);else if(camera.view)camera.clearViewOffset();
  if(Math.floor(time*2)%2!==(caret?0:1)){caret=!caret;if(scrMode==="doc"&&(G.state==="aim"||G.typing))scrDirty=true}
  if(scrDirty){scrDirty=false;drawScreen()}
  if(pop.classList.contains("show")){const p=toScreen(die.position);pop.style.left=(p[0]+VH*.12)+"px";pop.style.top=p[1]+"px"}
  if(bubble.classList.contains("show")){head.getWorldPosition(_v);_v.y+=.075;const p=toScreen(_v);bubble.style.left=Math.max(120,Math.min(VW-120,p[0]))+"px";bubble.style.top=Math.max(70,p[1])+"px"}
  if(!G.norender)renderer.render(scene,camera)}

/* ---------- Interface ---------- */
const pop=$("#pop"),bubble=$("#bubble"),consoleEl=$("#console"),facesEl=$("#faces"),card=$("#card"),rollBtn=$("#roll"),tempEl=$("#temp"),gT=$("#gT"),gS=$("#gS"),planEl=$("#plan");
$("#srcs").innerHTML=SRC.map((s,i)=>'<button data-i="'+i+'" style="--sc:'+s.c+';--s1:'+s.c1+';--sg:'+s.g+'" aria-pressed="'+(i===0)+'"><span class="ic">'+gimg(s.ic,"",ICFB)+"</span><span>"+s.n+"<small>"+s.d+"</small></span></button>").join("");
const srcB=[...$$("#srcs button")];
function say(t){if(!t){bubble.classList.remove("show");return}bubble.textContent=t;bubble.classList.add("show")}
/* Consigne au-dessus des commandes. La flèche est à droite, au-dessus du bouton de lancer, ou à gauche (gauche=true) quand il faut d'abord agir sur la température. */
function hint(t,gauche){const el=$("#hint");if(!t){el.classList.remove("show");el.dataset.t="";return}el.classList.toggle("gauche",!!gauche);
  if(el.dataset.t!==t){el.dataset.t=t;el.innerHTML=gimg("fleche","harrow")+"<span>"+t+"</span>"}el.classList.add("show")}
(function buildNet(){const s=40,h=s*Math.sqrt(3)/2;let o="",n=1;const tri=p=>{const cx=(p[0][0]+p[1][0]+p[2][0])/3,cy=(p[0][1]+p[1][1]+p[2][1])/3;o+='<g class="tri" data-n="'+n+'"><polygon points="'+p.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ")+'"/><text x="'+cx.toFixed(1)+'" y="'+(cy+3.8).toFixed(1)+'">'+n+"</text></g>";n++};
  for(let i=0;i<5;i++)tri([[i*s,h],[(i+1)*s,h],[(i+.5)*s,0]]);
  for(let i=0;i<5;i++){tri([[i*s,h],[(i+1)*s,h],[(i+.5)*s,2*h]]);tri([[(i+.5)*s,2*h],[(i+1.5)*s,2*h],[(i+1)*s,h]])}
  for(let i=0;i<5;i++)tri([[(i+.5)*s,2*h],[(i+1.5)*s,2*h],[(i+1)*s,3*h]]);
  const net=$("#netd20");net.setAttribute("viewBox","-2 -2 "+(5.5*s+4)+" "+(3*h+4).toFixed(1));net.innerHTML=o})();
function setLocks(){const a=G.state==="aim";gT.classList.toggle("locked",G.chap<2);gS.classList.toggle("locked",G.chap<3);tempEl.disabled=!a||G.chap<2;srcB.forEach((b,i)=>b.disabled=!a||G.chap<3||G.tested.includes(i));rollBtn.disabled=!a||!zoneOK()}
/* Chapitre 2 : deux lancers imposés, le premier à froid, le second à chaud. Le dé ne se lance que si le curseur est dans la bonne zone. */
function zoneOK(){return G.chap!==2||(G.chapHist.length?G.s>=67:G.s<34)}
function ui(){const P=G.role||ROLES[0],f=G.fo||faces(WEI[G.src],tempT(G.s));
  if(G.chap===2&&G.state==="aim"){const c=G.chapHist.length,z=c?"Chaud":"Froid";hint("Lancer "+(c+1)+" sur 2 : "+(zoneOK()?"la température est sur « "+z+" ». Lancez le dé":"glissez la température jusqu'à « "+z+" »"),!zoneOK())}
  const ra=$("#rav");if(ra.dataset.r!==P.ic){ra.dataset.r=P.ic;delete ra.dataset.miss;ra.src=GI+P.ic+".png"}
  $("#tname").textContent=tempName(G.s);srcB.forEach((b,i)=>{b.setAttribute("aria-pressed",i===G.src);b.classList.toggle("done",G.chap===3&&G.tested.includes(i))});
  const owner=[],byF=[0,0,0,0];f.forEach((k,i)=>{byF[P.c[i][1]]+=k;for(let j=0;j<k;j++)owner.push(i)});
  $$("#netd20 .tri").forEach((e,i)=>{e.firstChild.style.fill=FAM[P.c[owner[i]][1]].c});
  $("#leg").innerHTML=FAM.map((F,i)=>'<div class="leg'+(byF[i]?"":" off")+'"><i style="background:'+F.c+'"></i><span>'+F.n+"</span><b>"+byF[i]+"</b></div>").join("");
  const k=G.chap,n=G.chapHist.length;$("#chtag").textContent="CHAPITRE "+k+" SUR 4 · "+CH[k].t.toUpperCase();
  $("#objtxt").textContent=k===1?"Posez la question à l'IA":k===2?"Même question : lancer "+Math.min(n+1,2)+" sur 2":k===3?"Sources comparées : "+G.tested.length+" sur 2":"Retour à la source";
  $$("#pips i").forEach((e,i)=>{e.className=i+1<k?"done":i+1===k?"on":""});
  tempColor(G.s);lamp.color.copy(tc);bulbMat.color.copy(tc);lampGlow.material.color.copy(tc);dieGlow.material.color.copy(tc);lamp.intensity=1.9+G.s*.012;setLocks();scrDirty=true}
function hideCard(){card.classList.remove("show","t2")}
let cardT=0;
function showCard(n,ci,done){const P=G.role,c=P.c[ci],k=G.chap;let tr=k===3?TRUTHS[3][G.lastSrc]:TRUTHS[k][(G.chapHist.length-1)%TRUTHS[k].length];

  card.innerHTML='<small class="k">LE DÉ TRANCHE, L\'IA ÉCRIT</small><div class="res"><span class="face">'+n+'</span><span class="arr">donne</span><b class="word">'+c[0]+'</b>'+(c[2]&&k===3?'<span class="stamp ok">VÉRIFIÉ</span>':(c[2]||c[1]===1)?'<span class="stamp pr">PROBABLE</span>':'<span class="stamp">NON VÉRIFIÉ</span>')+'</div>'+
   '<div class="orig"><span class="oic" style="background:'+FAM[c[1]].c+'">'+gimg(["ico_notice","ico_notice","ico_science","ico_science","ico_site_sante","ico_encyclopedie","ico_forum","ico_forum","ico_reseau","ico_reseau"][ci],"",ICFB)+'</span><span>Sous le capot, ce mot vient de : <b>'+c[3]+"</b></span></div>"+
   (k===3?'<span class="verd'+(c[2]?"":" ko")+'">'+(c[2]?"Conforme à la notice":"Absent de la notice")+"</span>":"")+
   '<div class="truth"><small class="k">À RETENIR</small><p>'+tr+"</p></div>"+'<div class="todo"><span>'+(done?"Cliquez sur « Continuer » pour passer à la suite.":k===2?"Lancer 2 sur 2 : glissez la température jusqu'à « Chaud », puis relancez le dé.":"Choisissez une autre source à gauche, puis relancez le dé.")+"</span>"+(done?'<button class="btn" id="next">Continuer</button>':"")+"</div>";
  card.classList.remove("t2");card.classList.add("show");clearTimeout(cardT);/* chaque commentaire « À retenir » est dit par la voix off, sans sous-titre puisque le texte est sur la carte */
  const cle=k===1?"t1":k===2?(G.chapHist.length<=1?"t2a":"t2b"):"t3"+"abcd"[G.lastSrc],run=G.run;
  cardT=setTimeout(()=>{card.classList.add("t2");sfx.pop();if(run===G.run)speak(cle,run,null,true)},1000)}
function taire(){voTok++;if(voCur){try{if(!voCur.paused&&!voCur.ended)voLibre=performance.now()+VO_COUPE*1000;voCur.pause()}catch(e){}}caption("")}

/* ---------- Plans : écrans narratifs plein écran ---------- */
/* Les illustrations sont des PNG détourés générés par API (images/generated/, voir scripts/). Sans fichier, un élément de secours simple s'affiche. */
/* Logo : découpé dans l'image d'accueil (images/accueil.webp), un seul par écran */
const BRAND='<i class="brand" role="img" aria-label="Elliacare"></i>';
const planHead=k=>BRAND+'<div class="eyebrow">CHAPITRE '+k+" SUR 4</div><h2>"+CH[k].h+"</h2>";
const PARROT_FB='<svg class="fb" viewBox="668 4 244 456"><path d="M748,340 q-34,74 -22,112 q42,-30 62,-92z" fill="#0C497B"/><ellipse cx="790" cy="270" rx="92" ry="118" fill="#29ABE2"/><ellipse cx="874" cy="272" rx="25" ry="84" fill="#0C497B" transform="rotate(-8 874 272)"/><ellipse cx="706" cy="272" rx="25" ry="84" fill="#0C497B" transform="rotate(8 706 272)"/><ellipse cx="790" cy="292" rx="58" ry="80" fill="#74D2FA"/><text x="790" y="313" text-anchor="middle" font-size="58" font-weight="700" font-family="Poppins,Arial,sans-serif" fill="#01233F">IA</text><circle cx="790" cy="128" r="64" fill="#29ABE2"/><path d="M770,72 q-8,-40 12,-58 q6,30 8,54z" fill="#FF8000"/><path d="M790,68 q6,-40 32,-48 q-4,32 -14,54z" fill="#74D2FA"/><circle cx="764" cy="120" r="17" fill="#fff"/><circle cx="768" cy="122" r="8" fill="#01233F"/><circle cx="816" cy="120" r="17" fill="#fff"/><circle cx="812" cy="122" r="8" fill="#01233F"/><path d="M772,142 q18,-14 36,0 q-4,36 -18,44 q-14,-8 -18,-44z" fill="#FF8000"/></svg>';
/* Les six sources du chapitre 1 : [libellé, famille, image] */
const SRCL=[["Notice officielle",0,"ico_notice"],["Publication scientifique",1,"ico_science"],["Encyclopédie en ligne",2,"ico_encyclopedie"],["Site santé grand public",2,"ico_site_sante"],["Forum : l'avis d'une personne",3,"ico_forum"],["Réseau social",3,"ico_reseau"]];
const PLANS={
 1(){return planHead(1)+'<div class="p1"><svg class="links"></svg><div class="pills">'+SRCL.map((s,i)=>'<div class="pill f'+s[1]+'" data-s="'+(i+1)+'"><span class="ic">'+gimg(s[2],"",ICFB)+"</span>"+s[0]+"</div>").join("")+
  '</div><div class="mascot">'+gimg("perroquet","",PARROT_FB)+'<p class="tag" data-s="7">Tout est mélangé, sans étiquette.</p></div></div><p class="say" data-s="8">Posez votre question sans rien préciser. Regardez d\'où vient la réponse.</p>'},
 2(){const P=G.role,words=P.pre.replace(/,/g,"").split(" ").slice(-6).concat(["?"]),idx=[0,6,8,4],y0=240-words.length*21;let o="",net="";const ln=(a,b,c,d)=>'<line x1="'+a+'" y1="'+b+'" x2="'+c+'" y2="'+d+'"/>';
  words.forEach((w,i)=>{const q=w==="?";o+='<g data-s="1" style="transition-delay:'+(i*.3)+'s"><rect x="20" y="'+(y0+i*42)+'" width="190" height="34" rx="10" fill="'+(q?"#FF8000":"rgba(116,210,250,.18)")+'" stroke="'+(q?"#ffd9a6":"rgba(159,232,255,.55)")+'" stroke-width="1.5"/><text x="115" y="'+(y0+i*42+23)+'" text-anchor="middle" font-size="17" fill="'+(q?"#01233F":"#DEF5FF")+'">'+w+"</text></g>"});
  const L=[[300,[130,203,277,350]],[395,[95,167,240,313,385]],[490,[130,203,277,350]]];
  L[0][1].forEach(y=>net+=ln(212,240,300,y));for(let a=0;a<2;a++)L[a][1].forEach(y1=>L[a+1][1].forEach(y2=>net+=ln(L[a][0],y1,L[a+1][0],y2)));L[2][1].forEach(y=>net+=ln(490,y,560,240));
  L.forEach(l=>l[1].forEach(y=>net+='<circle cx="'+l[0]+'" cy="'+y+'" r="7"/>'));net+='<circle cx="560" cy="240" r="11" style="fill:#FF8000;stroke:#ffd9a6"/>';
  o+='<g data-s="2" class="net">'+net+"</g>";const X=[640,685,725,760],Yc=[92,190,290,388];
  idx.forEach((ci,i)=>{o+='<g data-s="3" class="cw" style="transition-delay:'+(i*.45)+'s"><path class="cp" d="M560,240 C612,240 596,'+Yc[i]+" "+X[i]+","+Yc[i]+'"/><circle cx="'+X[i]+'" cy="'+Yc[i]+'" r="8"/><text class="cwt" x="'+(X[i]+18)+'" y="'+(Yc[i]+3)+'" font-size="19">'+P.c[ci][0]+'</text><text class="cf" x="'+(X[i]+18)+'" y="'+(Yc[i]+24)+'" font-size="13.5"></text></g>'});
  o+='<text data-s="3" class="lab" x="640" y="46" font-size="13">MOT PROCHE</text><text data-s="3" class="lab" x="760" y="446" font-size="13">MOT LOINTAIN</text>';
  o+='<defs><linearGradient id="tg"><stop offset="0" stop-color="#74D2FA"/><stop offset=".4" stop-color="#29ABE2"/><stop offset="1" stop-color="#FF8000"/></linearGradient></defs><g data-s="4"><image href="'+GI+'thermometre.png" x="240" y="408" width="50" height="62" onerror="this.style.opacity=0"/><rect x="295" y="430" width="200" height="12" rx="6" fill="url(#tg)"/><circle id="p2k" cx="405" cy="436" r="11" fill="#fff" stroke="#01233F" stroke-width="3"/><text id="p2t" x="395" y="470" text-anchor="middle" font-size="15" fill="#fff"></text></g>';
  o+='<image id="p2s" href="'+GI+'de20.png" x="-22" y="-22" width="44" height="44" opacity="0" onerror="this.style.opacity=0"/><circle id="p2d" r="10" fill="#FF8000" opacity="0"/>';
  return planHead(2)+'<svg class="net2" viewBox="0 0 1060 480">'+o+'</svg><p class="say" data-s="7">Même question, deux fois : à froid, puis à chaud.</p>'},
 3(){const P=G.role,B=[["Tout Internet",3,"ico_reseau",100,2],["Sites santé grand public",2,"ico_site_sante",80,3],["Publications scientifiques",1,"ico_science",62,3],["Notice officielle, HAS",0,"ico_notice",46,4]];
  return planHead(3)+'<div class="pcard ask" data-s="1">'+gimg("entonnoir","deco")+'<small>VOTRE DEMANDE</small>'+P.q+' <b data-s="5">'+SRC[3].add+'</b></div><div class="funnel">'+B.map(b=>'<div class="pill f'+b[1]+'" data-s="'+b[4]+'" style="width:'+b[3]+'%"><span class="ic">'+gimg(b[2],"",ICFB)+"</span>"+b[0]+"</div>").join("")+
  '</div><p class="say" data-s="6">À vous : choisissez deux sources et comparez les réponses.</p>'},
 4(){const P=G.role,cnt={};G.hist.forEach(ci=>cnt[ci]=(cnt[ci]||0)+1);
  const rows=Object.keys(cnt).map(Number).sort((a,b)=>P.c[b][2]-P.c[a][2]).slice(0,4).map((ci,i)=>{const ok=P.c[ci][2];return '<li class="srow '+(ok?"ok":"ko")+'" data-s="3" style="transition-delay:'+(i*.6)+'s"><span class="ic">'+gimg(ok?"ico_conforme":"ico_alerte","",'<i class="fb">'+(ok?"✓":"!")+"</i>")+"</span><div><b>"+P.c[ci][0]+" <em>"+(ok?"conforme à la notice":"absent de la notice")+"</em></b><span>Vient de : "+P.c[ci][3]+"</span></div></li>"}).join("");
  return planHead(4)+'<div class="cmp"><div class="pcard notice" data-s="2">'+gimg("boite_calmidol","deco")+gimg("loupe","deco2")+'<small>EXTRAIT DE LA NOTICE OFFICIELLE</small><h3>Calmidol <i>(médicament fictif)</i></h3><ul>'+P.notice.map(l=>"<li>"+l+"</li>").join("")+'</ul></div><div class="ans"><small data-s="3">PENDANT VOTRE GARDE, L\'IA A RÉPONDU</small><ul>'+rows+'</ul></div></div><p class="say" data-s="5">Même bien cadrée, l\'IA peut se tromper. La notice fait foi.</p>'}};
/* Chapitre 1 : pointillés de couleur entre chaque source affichée et le perroquet, recalculés d'après la mise en page */
function p1links(el,s){const box=el.querySelector(".p1"),svg=el.querySelector(".links"),m=el.querySelector(".mascot");if(!box||!svg||!m)return;const b=box.getBoundingClientRect(),mb=m.getBoundingClientRect();if(!b.width)return;
  const tx=mb.left-b.left+mb.width*.5-Math.min(mb.width,mb.height*.6)*.42,ty=mb.top-b.top+mb.height*.54;svg.setAttribute("viewBox","0 0 "+b.width+" "+b.height);let o="";
  el.querySelectorAll(".pill").forEach((p,i)=>{if(+p.dataset.s>s)return;const x=p.offsetLeft+p.offsetWidth+8,y=p.offsetTop+p.offsetHeight/2;o+='<path class="lk f'+SRCL[i][1]+'" d="M'+x+","+y+" C"+(x+(tx-x)*.6)+","+y+" "+(x+(tx-x)*.45)+","+ty+" "+tx+","+ty+'"/>'});svg.innerHTML=o}
/* Chapitre 2 : la température resserre ou élargit les chemins vers les mots candidats */
function p2temp(el,s){el._s=s;const idx=[0,6,8,4],f=faces(idx.map(i=>WEI[0][i]),tempT(s));el.querySelectorAll(".cp").forEach((p,i)=>{p.style.strokeWidth=(1.5+f[i]*1.3)+"px";p.style.opacity=f[i]?1:.3});
  el.querySelectorAll(".cf").forEach((t,i)=>t.textContent=f[i]?f[i]+(f[i]>1?" faces":" face")+" sur 20":"aucune face");const k=el.querySelector("#p2k"),t=el.querySelector("#p2t");if(k)k.setAttribute("cx",295+s*2);if(t)t.textContent="Température : "+tempName(s).toLowerCase();return f}
const p2to=(el,to,d,run)=>{const a=el._s;return tw(d,u=>{if(run===G.run)p2temp(el,lerp(a,to,eio(u)))})};
const HOOK={
 1(s,el){el.querySelector(".p1").classList.toggle("mix",s>=7);p1links(el,s)},
 2(s,el,run){if(s===0)p2temp(el,55);
  if(s>=4&&!el._c){el._c=1;el._q=p2to(el,0,1.6,run)}
  if(s>=5&&!el._h){el._h=1;el._q=(el._q||Promise.resolve()).then(()=>p2to(el,100,2.2,run))}
  if(s>=6&&!el._k){el._k=1;(el._q||Promise.resolve()).then(()=>p2to(el,55,1.2,run)).then(async()=>{if(run!==G.run)return;const f=p2temp(el,55),j=pickFace(1+Math.floor(Math.random()*20),f),ps=el.querySelectorAll(".cp"),die=el.querySelector("#p2s"),dot=el.querySelector("#p2d");if(!ps[j]||!die)return;
   const len=ps[j].getTotalLength();die.setAttribute("opacity",1);dot.setAttribute("opacity",.9);sfx.hit(.6);await tw(1.3,u=>{const p=ps[j].getPointAtLength(len*eio(u));die.setAttribute("transform","translate("+p.x+","+p.y+") rotate("+(u*540)+")");dot.setAttribute("cx",p.x);dot.setAttribute("cy",p.y)});
   dot.setAttribute("opacity",0);const g=el.querySelectorAll(".cw")[j];if(g)g.classList.add("win");sfx.chime()})}}};
/* Fichiers de voix off joués à la suite pour chaque chapitre */
const PLANVO={1:["c1a","c1b"],2:["c2a","c2b"],3:["c3"],4:["c4"]};
async function plan(k,run,onOut){planEl.innerHTML=PLANS[k]();planEl.className="show";view.classList.add("inplan");sfx.whoosh();await nextFrame();await nextFrame();planEl.classList.add("in");
  const step=s=>{planEl.querySelectorAll("[data-s]").forEach(e=>e.classList.toggle("on",+e.dataset.s<=s));if(HOOK[k])HOOK[k](s,planEl,run)};
  /* une ligne de voix off peut demander un plan de coupe sur la scène 3D : l'infographie s'efface le temps du plan */
  let peek=null;const shot=c=>{c=c||null;if(c===peek)return;peek=c;if(c){setCam(c,true);dolly();sfx.whoosh()}planEl.classList.toggle("peek",!!c)};
  step(0);await wait(.7);if(run!==G.run)return;let sk=false,last=0;
  for(const id of PLANVO[k]){const L=VO[id];L.forEach(l=>{if(l[1]!=null)last=Math.max(last,l[1])});if(sk)continue;
    sk=await speak(id,run,i=>{shot(L[i][2]);if(L[i][1]!=null)step(L[i][1])});if(run!==G.run)return}
  if(sk){shot(null);step(last)}
  await wait(sk?.4:.7);if(run!==G.run)return;if(onOut)onOut();
  planEl.classList.remove("in");await wait(.5);if(run!==G.run)return;planEl.className="";planEl.innerHTML="";view.classList.remove("inplan")}

/* ---------- Carnet : les bras entrent, la main écrit la note ---------- */
async function writeRow(r,run){const L=r.t.length,p0=armR.position.clone(),p1=tipW(r,0);
  await tw(.22,u=>{armR.position.lerpVectors(p0,p1,eio(u));armR.position.y+=Math.sin(u*PI)*.012});if(run!==G.run)return;
  await tw(Math.max(.6,L*.085),u=>{const n=Math.round(u*L);if(n!==r.n){r.n=n;drawPage();if(n%2===0)sfx.pen()}tipW(r,u*L,armR.position);armR.position.y+=Math.abs(Math.sin(u*L*1.7))*.0016;armR.position.z+=Math.sin(u*L*2.9)*.0022})}
async function note(i,run){G.state="note";view.classList.add("innote");say("");hint();hideCard();sfx.whoosh();
  /* premier plan : les bras entrent (vue du dessus avec les mains en image, vue de côté avec les mains 3D de secours) */
  await cut(SPR?"noteW":"noteB");dolly();if(run!==G.run)return;const oy=SPR?0:1;
  const first=!ROWS.length,mine=[];let y=first?124:ROWS[ROWS.length-1].y+96;
  if(first){mine.push({t:"Note à moi-même",head:1,n:0,y});y+=88}
  pg.font=noteFont({});wrapLines(pg,NOTE_TXT[i],NB.CW-150).forEach((t,j)=>{mine.push({t,n:0,y,dot:!j});y+=70});mine.forEach(r=>ROWS.push(r));
  const sp=speak("n"+(i+1),run),rStart=tipW(mine[0],0);rStart.y+=.03*oy;
  /* mains en image : le carnet s'ouvre seul avant que les mains n'entrent, pour que rien ne se traverse */
  if(first&&SPR){sfx.page();await tw(.55,u=>{cover.rotation.z=eio(u)*PI});if(run!==G.run)return}
  const lRest=first&&!SPR?nbW(.05,.018,.05):nbW(-.2,.005,.05);
  armL.visible=armR.visible=true;
  await tw(.55,u=>{const e=1-eo(u);armL.position.copy(lRest).add(_a.set(-.12,-.1*oy,.5).multiplyScalar(e));armR.position.copy(rStart).add(_a.set(.14,-.1*oy,.5).multiplyScalar(e))});if(run!==G.run)return;
  if(first&&!SPR){sfx.page();await tw(.95,u=>{const th=eio(u)*PI;cover.rotation.z=th;armL.position.copy(nbW(-.083+.133*Math.cos(th),lerp(.018,.005,u)+.133*Math.sin(th),.05))});if(run!==G.run)return}
  else await wait(.2);
  /* second plan : vue du dessus, la main écrit */
  setCam(SPR?"noteT":"note",true);dolly();sfx.whoosh();
  for(const r of mine){await writeRow(r,run);if(run!==G.run)return}
  /* la main droite se retire entièrement : la note reste lisible jusqu'au bout, le temps de la relire */
  const r0=armR.position.clone();await tw(.6,u=>{armR.position.copy(r0).add(_a.set(.22,.04*oy,.46).multiplyScalar(eio(u)))});armR.visible=false;if(run!==G.run)return;
  CAM.rate=.45;CAM.tp.lerp(CAM.tl,.1);
  await sp;if(run!==G.run)return;await wait(3.2);if(run!==G.run)return;
  const l0=armL.position.clone();await tw(.4,u=>{armL.position.copy(l0).add(_a.set(-.12,-.1*oy,.5).multiplyScalar(u*u))});
  armL.visible=armR.visible=false;view.classList.remove("innote")}

/* ---------- Déroulé ---------- */
async function toss(n,run){tossing=true;head.rotation.set(0,0,0);
  await tw(.36,u=>{pBody.rotation.x=1.745*eio(u);wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*.5*u)});if(run!==G.run)return;
  holding=true;if(CRI.paused)sfx.squawk();
  await tw(.3,u=>{pBody.rotation.x=1.745-1.6*eo(u)});if(run!==G.run)return;
  holding=false;const p0=die.position.clone(),pf=new V3(TRAY.x-.08+Math.random()*.16,TRAY.y+RIN,TRAY.z-.08+Math.random()*.13);
  const camP=new V3(pf.x,pf.y+.34,pf.z+.075),away=new V3(pf.x-camP.x,0,pf.z-camP.z).normalize(),qf=faceQuat(n-1,away);
  const dir=new V3(pf.x-p0.x,0,pf.z-p0.z).normalize(),back=[.105,.042,.013,0],pts=[p0].concat(back.map(b=>new V3(pf.x-dir.x*b,pf.y,pf.z-dir.z*b)));
  const hs=[.05,.042,.017,.005],ds=[.4,.3,.2,.14],T=ds.reduce((a,b)=>a+b,0),ax1=new V3(Math.random()-.5,Math.random()*.4,Math.random()-.5).normalize(),ax2=new V3(dir.z,0,-dir.x),th1=9+Math.random()*4,th2=14+Math.random()*4;
  const qa=new THREE.Quaternion(),qb=new THREE.Quaternion();let hop=0;
  CAM.pose="toss";CAM.p.copy(camP).add(_a.set(.04,.16,.2));CAM.l.set(TRAY.x,TRAY.y,TRAY.z);CAM.f=38;CAM.tp.copy(camP);CAM.tf=30;CAM.rate=2.4;follow=true;
  tw(.5,u=>{pBody.rotation.x=.145*(1-eo(u));wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.5*(1-u)+Math.sin(u*PI*3)*.5*(1-u)))});
  await tw(T,u=>{let t=u*T,i=0;while(i<3&&t>ds[i]){t-=ds[i];i++}if(i>hop){hop=i;sfx.hit(1-i*.25)}const v=Math.min(1,t/ds[i]);
    die.position.lerpVectors(pts[i],pts[i+1],v);die.position.y+=4*hs[i]*v*(1-v);
    qa.setFromAxisAngle(ax1,th1*Math.pow(1-u,2.4));qb.setFromAxisAngle(ax2,-th2*Math.pow(1-u,2));die.quaternion.copy(qf).multiply(qb).multiply(qa)});
  sfx.hit(.3);die.position.copy(pf);die.quaternion.copy(qf);follow=false;CAM.tl.copy(pf);tossing=false;tw(.6,u=>{dieGlow.scale.setScalar(.16+.3*Math.sin(u*PI));dieGlow.material.opacity=.35+.5*Math.sin(u*PI)})}
/* L'IA écrit sa réponse sur l'écran : la frappe dure au moins 1,5 s, puis la réponse reste affichée 1,5 s, soit environ 3 s de lecture sur ce plan */
async function typeWord(ci,run){const L=G.role.c[ci][0].length,step=Math.max(1.5,Math.min(2.2,L*.07))/L;G.typing={ci,n:0};
  for(let n=1;n<=L;n++){G.typing.n=n;scrDirty=true;if(n%2)sfx.key();await wait(step);if(run!==G.run)return}await wait(1.5)}
const LINES={Froid:["À froid, je me répète.","Toujours mon favori."],Tiède:["Je tire au sort !","Voyons ce qui sort."],Chaud:["À chaud, tout peut sortir !","J'improvise !"]};
/* Consigne affichée en permanence au-dessus de la console tant que c'est au joueur d'agir */
const HINTS={1:"Cliquez sur « Lancer le dé » pour poser votre question à l'IA",2:"Lancer 1 sur 2 : glissez la température jusqu'à « Froid », puis lancez le dé",3:"Choisissez une source à gauche, puis lancez le dé (2 essais)"};
/* Tirage : jamais deux fois la même réponse dans une partie. La bonne réponse (indice 0) est réservée à la source "Notice officielle, HAS".
   Chapitre 1 : une réponse de forum ou de réseau social. Chapitre 2 : trois familles différentes à la suite (site grand public, étude, forum ou réseau).
   Chapitre 3 : chaque niveau de sources fait sortir une réponse de sa propre famille. Si le dé n'a aucune face pour la réponse voulue, une face lui est donnée. */
function drawFace(){const P=G.role,k=G.chap,all=P.c.map((x,i)=>i),ok=i=>!G.hist.includes(i),fam=n=>i=>P.c[i][1]===n&&i!==0;let f=faces(WEI[G.src],tempT(G.s));
  const want=k===1?fam(3):k===2?(G.chapHist.length?fam(3):i=>i===0):[fam(3),fam(2),fam(1),i=>i===0][G.src];
  let pool=all.filter(i=>ok(i)&&want(i));if(k===3&&G.src===3)pool=[0];if(!pool.length)pool=all.filter(i=>ok(i)&&i!==0);if(!pool.length)pool=all.filter(i=>i!==0);
  let el=pool.filter(i=>f[i]>0);
  if(!el.length){const j=pool.slice().sort((a,b)=>WEI[G.src][b]-WEI[G.src][a]||Math.random()-.5)[0],big=f.indexOf(Math.max.apply(null,f));f=f.slice();f[big]--;f[j]++;G.fo=f;el=[j]}
  const nums=[];let a=0;f.forEach((c,i)=>{for(let q=0;q<c;q++){a++;if(el.includes(i))nums.push(a)}});const n=nums[Math.floor(Math.random()*nums.length)];return{n,ci:pickFace(n,f)}}
async function roll(){if(G.state!=="aim"||!zoneOK())return;const run=G.run,P=G.role;G.fo=null;const dr=drawFace(),n=dr.n,ci=dr.ci,first=!G.chapHist.length;
  G.state="roll";G.fresh=false;hint();hideCard();taire();$$("#netd20 .hit").forEach(e=>e.classList.remove("hit"));ui();
  const ls=LINES[tempName(G.s)];say(ls[Math.floor(Math.random()*ls.length)]);
  setCam(PSH[G.hist.length%PSH.length],true);dolly();cri();await wait(first?.95:.65);if(run!==G.run)return;
  say("");await toss(n,run);if(run!==G.run)return;
  const tri=document.querySelector('#netd20 .tri[data-n="'+n+'"]');if(tri)tri.classList.add("hit");
  $("#popn").textContent=n;$("#popw").textContent=P.c[ci][0];pop.classList.add("show");sfx.chime();await wait(1);if(run!==G.run)return;
  pop.classList.remove("show");setCam(SSH[G.hist.length%SSH.length],true);dolly();await wait(.45);if(run!==G.run)return;
  await typeWord(ci,run);if(run!==G.run)return;
  resetDie();G.typing=null;G.fresh=true;G.chapHist.push(ci);G.hist.push(ci);G.lastSrc=G.src;if(G.chap===3){G.tested.push(G.src);const nx=[3,2,1,0].find(i=>!G.tested.includes(i));if(nx!=null&&G.tested.length<2)G.src=nx}
  const k=G.chap,done=k===1||(k===2&&G.chapHist.length>=2)||(k===3&&G.tested.length>=2);
  setCam("card",true);CAM.p.lerp(CAM.l,.14);CAM.rate=2;showCard(n,ci,done);
  if(!done){G.state="aim";if(k!==2)hint("Choisissez une autre source à gauche, puis relancez le dé");ui();return}
  G.state="wait";ui();consoleEl.classList.add("hide");P.c[ci][2]?sfx.ok():sfx.warn();
  $("#next").onclick=()=>{if(run!==G.run||G.state!=="wait")return;afterChapter(run)}}
/* Question quiz entre deux chapitres : le joueur choisit une réponse, la bonne s'allume, l'explication s'affiche, puis il continue */
async function quiz(k,run){const Q=QUIZ[k];G.state="quiz";caption("");
  planEl.innerHTML=BRAND+'<div class="eyebrow">QUESTION</div><h2 class="qh">'+Q.h+'</h2><div class="quiz"><div class="qopts">'+Q.o.map((o,i)=>'<button class="pill f2 qopt" data-i="'+i+'"><span class="ic"><b>'+"ABC"[i]+"</b></span>"+o+"</button>").join("")+'</div><div class="mascot">'+gimg("perroquet","",PARROT_FB)+'</div></div><div class="qend"></div>';
  planEl.className="show";view.classList.add("inplan","inquiz");sfx.whoosh();await nextFrame();await nextFrame();planEl.classList.add("in");speak(Q.vo,run,null,true);
  const opts=[...planEl.querySelectorAll(".qopt")],pick=await new Promise(res=>opts.forEach(b=>b.onclick=()=>res(+b.dataset.i)));if(run!==G.run)return;
  opts.forEach((b,i)=>{b.disabled=true;b.classList.add(i===Q.a?"ok":i===pick?"ko":"off")});pick===Q.a?sfx.ok():sfx.warn();
  planEl.querySelector(".qend").innerHTML='<p class="say">'+(pick===Q.a?"Bien vu. ":"Pas tout à fait. ")+Q.x.replace(/ ([:;?!])/g," $1")+'</p><button class="btn" id="qgo">Continuer</button>';speak(Q.vo+"r",run,null,true);
  await new Promise(res=>{$("#qgo").onclick=res});if(run!==G.run)return;voTok++;caption("");if(voCur){try{voCur.pause()}catch(e){}}
  planEl.classList.remove("in");await wait(.4);if(run!==G.run)return;planEl.className="";planEl.innerHTML="";view.classList.remove("inplan","inquiz")}
async function afterChapter(run){const k=G.chap;G.state="note";facesEl.classList.add("hide");hideCard();taire();
  await note(k-1,run);if(run!==G.run)return;if(QUIZ[k]){await quiz(k,run);if(run!==G.run)return}chapter(k+1)}
async function chapter(k){const run=G.run;Object.assign(G,{chap:k,chapHist:[],tested:[],fo:null,fresh:false,typing:null,state:"plan"});if(k===3)G.src=0;hideCard();consoleEl.classList.add("hide");facesEl.classList.add("hide");hint();say("");ui();
  await plan(k,run,()=>{if(k<4){setCam(ENTRY[k],true);CAM.rate=1.5;setCam("desk")}});if(run!==G.run)return;
  if(k===4){await note(3,run);if(run!==G.run)return;end();return}
  if(k===1){say("Bonjour ! L'IA, c'est moi.");sfx.squawk()}
  await wait(.9);if(run!==G.run)return;say("");CAM.rate=4.2;
  G.state="aim";consoleEl.classList.remove("hide");facesEl.classList.remove("hide");if(k!==2)hint(HINTS[k]);ui();
  const fr=k===2?gT:k===3?gS:null;if(fr){fr.classList.add("fresh");setTimeout(()=>fr.classList.remove("fresh"),4200)}}
const KEYS=[[0,[1.55,1.66,3.0],[.1,.95,-.2],46],[2.5,[.55,1.62,1.55],[.02,.9,-.2],44],[4.0,[.06,1.56,.98],[0,.84,-.15],42],[5.1,[.03,1.2,.66],[0,.86,-.13],38],[7.3,POSES.screen.p,POSES.screen.l,31]];
function applyIntro(t){let i=0;while(i<KEYS.length-2&&t>KEYS[i+1][0])i++;const a=KEYS[i],b=KEYS[i+1],u=sm(Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]))));
  CAM.p.set(lerp(a[1][0],b[1][0],u),lerp(a[1][1],b[1][1],u)+(t<4?Math.sin(t*7.5)*.013*Math.min(1,4-t):0),lerp(a[1][2],b[1][2],u));CAM.l.set(lerp(a[2][0],b[2][0],u),lerp(a[2][1],b[2][1],u),lerp(a[2][2],b[2][2],u));CAM.f=lerp(a[3],b[3],u);CAM.tp.copy(CAM.p);CAM.tl.copy(CAM.l);CAM.tf=CAM.f;
  lid.rotation.x=LID_OPEN*eio(Math.max(0,Math.min(1,(t-4.5)/1.1)));
  const m=t<5.6?"off":t<6.8?"boot":"doc";if(m==="boot"){bootU=(t-5.6)/1.2;scrDirty=true}if(m!==scrMode){scrMode=m;scrDirty=true;if(m==="boot")sfx.boot()}
  scrL.intensity=t<5.6?0:.35}
function resetScene(){ROWS.length=0;drawPage();cover.rotation.z=0;armL.visible=armR.visible=false;tossing=holding=follow=false;pBody.rotation.x=0;CAM.rate=4.2;
  hideCard();consoleEl.classList.add("hide");facesEl.classList.add("hide");pop.classList.remove("show");say("");hint();caption("");fadeEl.classList.remove("on");
  planEl.className="";planEl.innerHTML="";view.classList.remove("cine","innote","inplan","inquiz");if(voCur){try{voCur.pause()}catch(e){}}voTok++;voLibre=0;criStop();resetDie()}
/* Voix d'accueil : jouée une fois sur la page de garde, au premier geste du joueur (les navigateurs interdisent le son avant), ou à la demande avec le bouton */
let accJoue=false;
function majEcoute(){const b=$("#ecoute"),a=AUD.accueil;b.hidden=!a;b.textContent=a&&!a.paused?"Couper la présentation":"Écouter la présentation"}
function jouerAccueil(force){const a=AUD.accueil;if(!a||G.state!=="menu"||(!force&&accJoue))return;accJoue=true;
  try{a.currentTime=0;a.muted=muted;voCur=a;a.onended=a.onpause=a.onplay=majEcoute;a.play().catch(()=>{accJoue=false;majEcoute()})}catch(e){accJoue=false}}
async function start(){if(!G.role)G.role=ROLES[0];const run=++G.run;tweens.length=0;initAudio();loadVO();$("#menu").classList.remove("show");$("#end").classList.remove("show");
  Object.assign(G,{state:"intro",s:55,src:0,chap:1,chapHist:[],hist:[],tested:[],fo:null,lastSrc:0,typing:null,fresh:false,skip:RM});tempEl.value=55;resetScene();ui();
  CAM.pose="intro";view.classList.remove("idle");view.classList.add("cine");
  const D=Math.max(6.5,voDur("intro")+.3);speak("intro",run);let t=0;const T0=performance.now();
  while(t<D&&!G.skip){applyIntro(t/D*7.4);const d=await nextFrame();t=G.norender?t+d:(performance.now()-T0)/1000;if(run!==G.run)return}
  voTok++;caption("");if(voCur){try{voCur.pause()}catch(e){}}applyIntro(7.4);view.classList.remove("cine");chapter(1)}
function toMenu(){G.run++;tweens.length=0;G.state="menu";resetScene();lid.rotation.x=0;scrMode="off";scrDirty=true;scrL.intensity=0;
  view.classList.add("idle");$("#end").classList.remove("show");$("#menu").classList.add("show");setCam("menu")}
/* Phrase de félicitations de l'écran de fin (une parmi cinq propositions, voir VOIX_OFF.md) */
const BRAVO="Vous comprenez le côté probabiliste de l'IA : ce perroquet qui parle bien, mais ne comprend absolument pas ce qu'il dit.";
function end(){const P=G.role,n=G.hist.length,ok=G.hist.filter(ci=>P.c[ci][2]).length;G.state="end";say("");view.classList.add("idle");setCam("wide",true);
  $("#end").innerHTML='<div class="endbox">'+BRAND+'<h2>Fin de <em>garde</em></h2><div class="pcard paper">'+gimg("carnet_stylo","deco")+'<h3>Note à moi-même</h3>'+NOTE_TXT.map(t=>"<p>"+t+"</p>").join("")+"</div>"+
  '<div class="dcard"><h3>La phrase à ajouter à chaque demande</h3><p class="copy">« '+SRC[3].add+' »</p>'+
  '<h3>Votre garde</h3><p class="stat">'+n+" réponse"+(n>1?"s":"")+" de l'IA, "+(ok?"dont "+ok+" conforme"+(ok>1?"s":"")+" à la notice. Les autres étaient écrites avec le même aplomb.":"aucune conforme à la notice. Toutes étaient écrites avec le même aplomb.")+"</p>"+
  '<p class="sig">L\'IA assiste, le clinicien décide.</p><p class="legal">Illustration simplifiée : probabilités fictives, effet volontairement amplifié. Le Calmidol est un médicament inventé. L\'image du perroquet est un raccourci : ces modèles font plus que répéter, mais rien dans leur fonctionnement ne garantit qu\'une phrase est vraie.</p></div>'+
  '<div class="bravo">'+gimg("perroquet","peek")+'<p><b>Félicitations, vous avez maintenant terminé votre garde.</b>'+BRAVO+'</p></div></div>';
  $("#end").classList.add("show");sfx.ok();speak("fin",G.run,null,true)}

/* ---------- Branchements ---------- */
/* Page de garde : image fournie, avec une zone cliquable transparente sur chaque poste (position en % de l'image) */
const HOT=[[3.47,51.65,22.37,17.85],[26.79,51.65,21.41,17.85],[3.47,71.2,22.13,18.07],[26.67,71.2,21.65,18.07]];
$("#profs").innerHTML=ROLES.map((p,i)=>'<button class="hot'+(i?"":" base")+'" data-i="'+i+'" aria-pressed="'+(i===0)+'" aria-label="'+p.name+" : "+p.doc+'" style="left:'+HOT[i][0]+"%;top:"+HOT[i][1]+"%;width:"+HOT[i][2]+"%;height:"+HOT[i][3]+'%"></button>').join("");
$$(".hot").forEach(b=>b.onclick=()=>{G.role=ROLES[+b.dataset.i];$$(".hot").forEach(x=>x.setAttribute("aria-pressed",x===b));initAudio();sfx.pop()});
$("#go").onclick=start;$("#quit").onclick=toMenu;$("#skip").onclick=()=>{G.skip=true;voSkip=true};rollBtn.onclick=roll;
tempEl.oninput=()=>{G.s=+tempEl.value;G.fo=null;ui()};
srcB.forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(G.state!=="aim"||G.chap<3||G.tested.includes(i))return;G.src=i;G.fo=null;sfx.pop();ui()});
$("#snd").onclick=e=>{muted=!muted;if(voCur)voCur.muted=muted;if(muted)criStop();e.currentTarget.textContent="Son : "+(muted?"coupé":"activé");e.currentTarget.setAttribute("aria-pressed",!muted)};
window.addEventListener("keydown",e=>{if(e.code==="Space"&&G.state==="aim"&&e.target!==tempEl){e.preventDefault();roll()}else if(e.code==="Enter"&&G.state==="wait"){const b=$("#next");if(b){e.preventDefault();b.click()}}});
/* Taille de l'interface de jeu : doublee sur un grand ecran, reduite en proportion sur un ecran plus petit, inchangee sur telephone */
let UIK=1,shiftPx=0;
function fitUI(){const k=innerWidth<=900?1:Math.max(1,Math.min(2,innerWidth/960,innerHeight/540));UIK=k;view.style.setProperty("--K",k.toFixed(3))}
addEventListener("resize",fitUI);fitUI();
loadVO();
$("#menu").addEventListener("pointerdown",e=>{if(e.target.id!=="go"&&e.target.id!=="ecoute")jouerAccueil(false)});
$("#ecoute").onclick=()=>{const a=AUD.accueil;if(!a)return;if(!a.paused){a.pause();return}jouerAccueil(true)};
(function essai(n){if(AUD.accueil){majEcoute();jouerAccueil(false)}else if(n<40)setTimeout(()=>essai(n+1),250)})(0);
drawDecals();drawPage();
if(document.fonts&&document.fonts.load)Promise.all([document.fonts.load("700 38px Poppins"),document.fonts.load("600 42px Montserrat"),document.fonts.load("700 55px Caveat")]).then(()=>{scrDirty=true;drawDecals();drawPage()}).catch(()=>{});
resetDie();setCam("menu",true);ui();
window.__pg={G,CAM,POSES,setCam,roll,start,chapter,note,plan,end,tick,cri,CRI};
requestAnimationFrame(loop);
})();
</script>
</body>
</html>

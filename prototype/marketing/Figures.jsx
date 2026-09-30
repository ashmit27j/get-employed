const ISO=(x,y,z)=>[(x-y)*0.866,(x+y)*0.5-z];
const PTS=a=>a.map(p=>ISO(p[0],p[1],p[2]).map(n=>n.toFixed(1)).join(",")).join(" ");
function boxFaces({x,y,z,w,d,h}){return{
  top:PTS([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]]),
  left:PTS([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]]),
  right:PTS([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]])};}
const box=(x,y,z,w,d,h,k,hi)=>({t:"box",x,y,z,w,d,h,k,hi});
const ell=(z,r,k,hi,fill)=>({t:"ell",z,r,k,hi,fill});
const ln=(a,b,k,hi)=>({t:"ln",a,b,k,hi});
const SCENES={
  search:s=>{const it=[];for(let i=0;i<6;i++)it.push(box(-50,-50,i*(7+5*s),100,100,3,2+i*2,i===5));const top=5*(7+5*s)+3;it.push(ell(top+14+16*s,32,16,true,false),ell(top+14+16*s,20,18,true,false));return it;},
  match:s=>[box(-44,-44,18+30*s,38,38,38,16,true),box(6,-44,0,38,38,38,6),box(-44,6,0,38,38,38,6),box(6,6,-6*s,38,38,38,3)],
  tailor:s=>{const it=[box(-55,-40,0,110,80,4,3)];for(let i=0;i<4;i++)it.push(ln([-45,-28+i*16,4],[40-(i%2)*28,-28+i*16,4],3));const z=30+22*s;it.push(box(-45,-50,z,110,80,4,14,true));for(let i=0;i<4;i++)it.push(ln([-35,-38+i*16,z+4],[55-(i%2)*18,-38+i*16,z+4],14,true));return it;},
  outreach:s=>{const it=[];for(let i=0;i<10;i++)it.push(box(-60+i*(12+4*s),-40,0,2,80,85-i*7,14-i*1.2,i===0));return it;},
  track:s=>[28,46,36,64,22].map((h,i)=>box(-75+i*30,-20,0,20,40,h*(1+0.35*s),4+i*2.5,i===3)),
  practice:s=>{const it=[];[76,60,44,28].forEach((r,i)=>it.push(ell(-(3-i)*6*s,r*(1+0.12*s),2+i*3,false,i===3)));it.push(box(-12,-12,0,24,24,36+24*s,16,true));return it;}
};
function Shape({it,mx,my,on}){
  const tr="translate("+(mx*it.k).toFixed(2)+" "+(my*it.k).toFixed(2)+")";
  const stroke=it.hi?"var(--color-primary)":(on?"var(--color-ink-subtle)":"var(--color-ink-tertiary)");
  const base={stroke,strokeWidth:1,strokeLinejoin:"round",transition:"stroke .3s"};
  if(it.t==="box"){const f=boxFaces(it);return <g transform={tr} style={base}><polygon points={f.left} style={{fill:"var(--color-canvas)"}}></polygon><polygon points={f.right} style={{fill:"var(--color-canvas)"}}></polygon><polygon points={f.top} style={{fill:it.hi?"var(--color-surface-2)":"var(--color-surface-1)"}}></polygon></g>;}
  if(it.t==="ell"){const [X,Y]=ISO(0,0,it.z);return <ellipse transform={tr} cx={X} cy={Y} rx={it.r*1.2247} ry={it.r*0.7071} style={{...base,fill:it.fill?"var(--color-canvas)":"none"}}></ellipse>;}
  const [x1,y1]=ISO(...it.a),[x2,y2]=ISO(...it.b);
  return <line transform={tr} x1={x1} y1={y1} x2={x2} y2={y2} style={{...base,opacity:0.8}}></line>;
}
function useMouseLerp(ref,active){
  const [v,setV]=React.useState({mx:0,my:0,s:0});
  const tgt=React.useRef({mx:0,my:0,s:0}),cur=React.useRef({mx:0,my:0,s:0}),raf=React.useRef(0);
  const tick=()=>{const c=cur.current,t=tgt.current;let moving=false;
    for(const k of ["mx","my","s"]){const d=t[k]-c[k];if(Math.abs(d)>0.002){c[k]+=d*0.1;moving=true;}else c[k]=t[k];}
    setV({...c});raf.current=moving?requestAnimationFrame(tick):0;};
  const kick=()=>{if(!raf.current)raf.current=requestAnimationFrame(tick);};
  React.useEffect(()=>{
    if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const host=ref.current&&ref.current.closest("[data-step]");if(!host)return;
    const f=e=>{const r=host.getBoundingClientRect();
      tgt.current.mx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width/2)));
      tgt.current.my=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height/2)));kick();};
    const out=()=>{tgt.current.mx=0;tgt.current.my=0;kick();};
    host.addEventListener("mousemove",f);host.addEventListener("mouseleave",out);
    return()=>{host.removeEventListener("mousemove",f);host.removeEventListener("mouseleave",out);cancelAnimationFrame(raf.current);raf.current=0;};
  },[]);
  React.useEffect(()=>{tgt.current.s=active?1:0;kick();},[active]);
  return v;
}
function StepFigure({kind,active}){
  const ref=React.useRef(null);
  const {mx,my,s}=useMouseLerp(ref,active);
  const items=SCENES[kind](s);
  return (<div ref={ref} style={{height:210,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <svg viewBox="-125 -150 250 220" style={{width:"100%",maxWidth:280,height:"100%",overflow:"visible"}} aria-hidden="true">
      {items.map((it,i)=><Shape key={i} it={it} mx={mx} my={my} on={active}></Shape>)}
    </svg>
  </div>);
}
window.StepFigure=StepFigure;

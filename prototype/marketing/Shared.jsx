const DS_V1 = window.GetEmployedDesignSystem_26a74c;
/* C01: components resolve to the rebuilt design system (window.GE_DS) when on, the v1 bundle when off. */
const DS = new Proxy({}, {get:(_,k)=>(ge("C01")&&window.GE_DS?window.GE_DS:DS_V1)[k]});
const pick=(name,local)=>function Picked(p){const C=ge("C01")&&window.GE_DS&&window.GE_DS[name];return React.createElement(C||local,p);};
const v2=(before,after)=>ge("C01")?after:before; /* one-off values snapped to the DS scale under C01 */
function IconV1({name,size=16,style}){const u="url(https://unpkg.com/lucide-static@0.460.0/icons/"+name+".svg) center/contain no-repeat";return <span aria-hidden="true" style={{display:"inline-block",flex:"none",width:size,height:size,background:"currentColor",WebkitMask:u,mask:u,...style}}></span>;}
function EyebrowV1({children}){return <div style={{fontSize:13,fontWeight:500,letterSpacing:"0.4px",textTransform:"uppercase",color:"var(--color-ink-subtle)"}}>{children}</div>;}
function SectionV1({children,style,id}){return <section id={id} style={{maxWidth:1280,margin:"0 auto",padding:"120px 24px 0",boxSizing:"border-box",...style}}>{children}</section>;}
function H2V1({children,style,r}){return <h2 data-r={r} style={{margin:0,fontSize:56,fontWeight:600,lineHeight:1.1,letterSpacing:"-1.8px",textWrap:"balance",...style}}>{children}</h2>;}
const Icon=pick("Icon",IconV1);
const Eyebrow=pick("Eyebrow",EyebrowV1);
/* GridFrame — shared blueprint wrapper: full-bleed top rule + centered column with hatched gutters. */
function GridFrame({children,rule=true}){return <div className="ge-frame" data-rule={rule?"":undefined}><div className="ge-col">{children}</div></div>;}
/* Rule — full-bleed hairlines above and below a row, with an optional mono annotation. */
function Rule({label,children,style}){return <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",maxWidth:"100%",...style}}>{label&&<div className="ge-anno" aria-hidden="true">{label}</div>}<div className="ge-rule" style={{maxWidth:"100%"}}>{children}</div></div>;}
function Section({children,style,id,rule}){const C=ge("C01")&&window.GE_DS?window.GE_DS.Container:SectionV1;return <GridFrame rule={rule}><C id={id} style={style}>{children}</C></GridFrame>;}
/* H2 size="md" is the split-layout heading (48px); default is the section heading (56px). */
function H2({children,style,size}){
  const r=size==="md"?"h2-sm":"h2";
  if(ge("C01")&&window.GE_DS){const S=window.GE_DS.SectionHeading;return <S size={size} style={style} data-r={r}>{children}</S>;}
  return <H2V1 r={r} style={{...(size==="md"?{fontSize:48}:null),...style}}>{children}</H2V1>;
}
const Mo=()=>window.Motion;
const reducedMotion=()=>!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
const EASE=[0.16,1,0.3,1];
function RevealV1({children,delay=0,y=32,style}){
  const r=React.useRef(null);
  React.useEffect(()=>{const el=r.current,m=Mo();if(!el||!m||reducedMotion())return;
    el.style.opacity=0;
    return m.inView(el,()=>{m.animate(el,{opacity:[0,1],transform:["translateY("+y+"px) scale(.98)","translateY(0px) scale(1)"],filter:["blur(8px)","blur(0px)"]},{duration:1,delay,ease:EASE});},{amount:0.15});
  },[]);
  return <div ref={r} style={style}>{children}</div>;
}
const Reveal=pick("Reveal",RevealV1);
function useScrollFx(ref,fn){
  React.useEffect(()=>{if(reducedMotion())return;let q=0;
    const run=()=>{q=0;const el=ref.current;if(el)fn(el,el.getBoundingClientRect(),innerHeight);};
    const on=()=>{if(!q)q=requestAnimationFrame(run);};
    run();addEventListener("scroll",on,{passive:true});addEventListener("resize",on);
    return()=>{removeEventListener("scroll",on);removeEventListener("resize",on);cancelAnimationFrame(q);};
  },[]);
}
const REPO_URL="https://github.com/ashmit27j/get-employed";
Object.assign(window,{GridFrame,Rule,DS,pick,v2,Icon,Eyebrow,Section,H2,Mo,reducedMotion,EASE,Reveal,useScrollFx,REPO_URL});

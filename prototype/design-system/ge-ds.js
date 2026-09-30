/* GetEmployed Design System v2 — components. Plain JS, no build step. Needs React 18 on window.
   Load after design-system/tokens.css. Exports window.GE_DS. */
const GE_ASSET=(()=>{try{return new URL("../assets/",document.currentScript.src).href;}catch(_){return "assets/";}})();
(function boot(){
if(!window.React)return setTimeout(boot,20);
const R=window.React,h=R.createElement,us=R.useState,ue=R.useEffect,ur=R.useRef;
const reduced=()=>!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
const tr=p=>p.map(x=>x+" var(--duration-base) var(--ease-standard)").join(",");
const fv=e=>{try{return e.target.matches(":focus-visible");}catch(_){return true;}};

/* ---------- Foundations ---------- */
function Icon({name,size=16,style}){const u="url(https://unpkg.com/lucide-static@0.460.0/icons/"+name+".svg) center/contain no-repeat";return h("span",{"aria-hidden":"true",style:{display:"inline-block",flex:"none",width:size,height:size,background:"currentColor",WebkitMask:u,mask:u,...style}});}
function Wordmark({size=18,style}){return h("span",{style:{display:"inline-flex",alignItems:"center",gap:size*0.4,fontFamily:"var(--font-sans)",fontWeight:600,fontSize:size,letterSpacing:-size*0.03,color:"var(--color-ink)",lineHeight:1,...style}},
  h("img",{src:GE_ASSET+"ge-mark.png",alt:"","aria-hidden":"true",width:size*1.1,height:size*1.1,style:{display:"block",width:size*1.1,height:size*1.1,objectFit:"contain"}}),"GetEmployed");}
function Container({children,id,style,top="section",bottom=0}){const pad=v=>typeof v==="number"?v:v==="section"?"var(--space-section)":v==="tight"?"var(--space-section-sm)":0;
  return h("section",{id,style:{maxWidth:"var(--container-max)",margin:"0 auto",paddingTop:pad(top),paddingBottom:pad(bottom),paddingLeft:"var(--gutter)",paddingRight:"var(--gutter)",boxSizing:"border-box",...style}},children);}
function Eyebrow({children,style}){return h("div",{style:{fontSize:"var(--type-eyebrow-size)",lineHeight:"var(--type-eyebrow-lh)",fontWeight:500,letterSpacing:"var(--type-eyebrow-ls)",textTransform:"uppercase",color:"var(--color-ink-subtle)",...style}},children);}
function SectionHeading({children,size="lg",as="h2",style,...rest}){const k=size==="md"?"section-sm":"section";
  return h(as,{...rest,style:{margin:0,fontFamily:"var(--font-sans)",fontSize:"var(--type-"+k+"-size)",fontWeight:600,lineHeight:"var(--type-"+k+"-lh)",letterSpacing:"var(--type-"+k+"-ls)",textWrap:"balance",...style}},children);}

/* ---------- Actions ---------- */
const BTN={
  primary:{rest:{background:"var(--color-primary)",color:"var(--color-on-primary)",boxShadow:"var(--glow-cta)"},hover:{background:"var(--color-primary-hover)",boxShadow:"var(--glow-cta-hover)"},press:{background:"var(--color-primary-pressed)",boxShadow:"none"}},
  secondary:{rest:{background:"var(--color-surface-1)",color:"var(--color-ink)",borderColor:"var(--color-hairline)"},hover:{background:"var(--color-surface-2)",borderColor:"var(--color-hairline-strong)"},press:{background:"var(--color-surface-3)"}},
  tertiary:{rest:{background:"transparent",color:"var(--color-ink)"},hover:{background:"var(--color-surface-1)"},press:{background:"var(--color-surface-2)"}}
};
const SIZE={sm:{padding:"6px 10px",fontSize:13,minHeight:28},md:{padding:"8px 14px",fontSize:14,minHeight:36},lg:{padding:"12px 20px",fontSize:15,minHeight:44}};
function Button({variant="primary",size="md",disabled=false,fullWidth=false,iconLeft,iconRight,href,children,style,onClick,type="button",...rest}){
  const [hv,setH]=us(false),[pr,setP]=us(false),[fo,setF]=us(false);const v=BTN[variant]||BTN.primary;
  let s={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"var(--font-sans)",lineHeight:1.2,fontWeight:500,borderRadius:"var(--rounded-md)",border:"1px solid transparent",cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap",outline:"none",boxSizing:"border-box",transition:tr(["background","box-shadow","border-color"]),...SIZE[size]||SIZE.md,...v.rest};
  if(fullWidth)s.width="100%";
  if(disabled)s={...s,background:"var(--color-surface-1)",color:"var(--color-ink-tertiary)",borderColor:"var(--color-hairline)",boxShadow:"none",cursor:"not-allowed"};
  else{if(hv)s={...s,...v.hover};if(pr)s={...s,...v.press};}
  if(fo&&!disabled)s.boxShadow=(s.boxShadow&&s.boxShadow!=="none"?s.boxShadow+",":"")+"var(--focus-ring-shadow)";
  return h(href?"a":"button",{href,type:href?undefined:type,disabled:href?undefined:disabled,"aria-disabled":disabled||undefined,"data-ds-focus":"",onClick:disabled?undefined:onClick,
    onMouseEnter:()=>setH(true),onMouseLeave:()=>{setH(false);setP(false);},onMouseDown:()=>setP(true),onMouseUp:()=>setP(false),onFocus:e=>setF(fv(e)),onBlur:()=>setF(false),style:{...s,...style},...rest},iconLeft,children,iconRight);
}

/* ---------- Forms ---------- */
function TextInput({label,hint,iconLeft,disabled=false,style,inputStyle,onFocus,onBlur,type="text",...rest}){
  const [f,setF]=us(false),[hv,setH]=us(false);const id=R.useId();
  return h("label",{htmlFor:id,style:{display:"flex",flexDirection:"column",gap:6,fontFamily:"var(--font-sans)",...style}},
    label&&h("span",{style:{fontSize:"var(--type-small-size)",fontWeight:500,color:"var(--color-ink-muted)"}},label),
    h("span",{onMouseEnter:()=>setH(true),onMouseLeave:()=>setH(false),style:{display:"flex",alignItems:"center",gap:8,background:"var(--color-surface-1)",border:"1px solid "+(f||hv?"var(--color-hairline-strong)":"var(--color-hairline)"),borderRadius:"var(--rounded-md)",padding:"8px 12px",minHeight:38,boxSizing:"border-box",boxShadow:f?"var(--focus-ring-shadow)":"none",opacity:disabled?0.5:1,transition:tr(["border-color","box-shadow"])}},
      iconLeft&&h("span",{style:{display:"flex",color:"var(--color-ink-subtle)"}},iconLeft),
      h("input",{id,type,disabled,"data-ds-focus":"",onFocus:e=>{setF(true);onFocus&&onFocus(e);},onBlur:e=>{setF(false);onBlur&&onBlur(e);},style:{flex:1,minWidth:0,background:"transparent",border:"none",outline:"none",color:"var(--color-ink)",fontFamily:"inherit",fontSize:"var(--type-body-size)",lineHeight:1.3,letterSpacing:"var(--type-body-ls)",padding:0,...inputStyle},...rest})),
    hint&&h("span",{style:{fontSize:"var(--type-caption-size)",color:"var(--color-ink-subtle)"}},hint));
}

/* ---------- Status ---------- */
function StatusBadge({children,tone="neutral",dot,style}){const show=dot??tone!=="neutral";const c=tone==="success"?"var(--color-success)":tone==="accent"?"var(--color-primary)":"var(--color-ink-subtle)";
  return h("span",{style:{display:"inline-flex",alignItems:"center",gap:6,background:"var(--color-surface-2)",color:"var(--color-ink-muted)",fontSize:"var(--type-caption-size)",lineHeight:"var(--type-caption-lh)",fontWeight:500,padding:"2px 8px",borderRadius:"var(--rounded-full)",border:"1px solid var(--color-hairline)",whiteSpace:"nowrap",...style}},
    show&&h("span",{"aria-hidden":"true",style:{width:6,height:6,borderRadius:"var(--rounded-full)",background:c}}),children);}
function Tag({children,label,style,...rest}){return h("span",{style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:"var(--type-caption-size)",lineHeight:"var(--type-caption-lh)",padding:"2px 8px",borderRadius:"var(--rounded-full)",background:"var(--color-surface-3)",color:"var(--color-ink-muted)",whiteSpace:"nowrap",...style},...rest},
  label&&h("span",{style:{color:"var(--color-ink-subtle)"}},label),children);}
function ChangelogRow({version,date,title,items=[],tag}){
  return h("article",{style:{display:"grid",gridTemplateColumns:"160px minmax(0,1fr)",gap:24,padding:"24px 0",borderBottom:"1px solid var(--color-hairline)"}},
    h("div",{style:{display:"flex",flexDirection:"column",gap:4}},h("span",{style:{fontFamily:"var(--font-mono)",fontSize:"var(--type-ui-size)",color:"var(--color-ink-muted)"}},version),h("span",{style:{fontSize:"var(--type-caption-size)",color:"var(--color-ink-subtle)"}},date)),
    h("div",{style:{display:"flex",flexDirection:"column",gap:10}},
      h("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},h("span",{style:{fontSize:"var(--type-title-size)",fontWeight:500,letterSpacing:"var(--type-title-ls)",lineHeight:"var(--type-title-lh)"}},title),tag&&h(StatusBadge,{tone:"success"},tag)),
      items.length>0&&h("ul",{style:{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:4,color:"var(--color-ink-muted)"}},items.map(i=>h("li",{key:i},i)))));}

/* ---------- Navigation ---------- */
function PillTabs({options=[],value,defaultValue,onChange,style,label}){
  const first=options[0]&&(options[0].value??options[0]);const [inner,setInner]=us(defaultValue??first);const cur=value??inner;const [hov,setHov]=us(null);
  return h("div",{role:"tablist","aria-label":label,style:{display:"inline-flex",gap:4,padding:4,background:"var(--color-canvas)",border:"1px solid var(--color-hairline)",borderRadius:"var(--rounded-full)",...style}},
    options.map((o,i)=>{const val=o.value??o,lab=o.label??o,sel=val===cur;return h("button",{key:i,role:"tab","aria-selected":sel,onClick:()=>{setInner(val);onChange&&onChange(val);},onMouseEnter:()=>setHov(i),onMouseLeave:()=>setHov(null),
      style:{fontFamily:"var(--font-sans)",fontSize:"var(--type-small-size)",fontWeight:500,lineHeight:1.2,padding:"6px 14px",minHeight:30,borderRadius:"var(--rounded-full)",border:"none",cursor:"pointer",background:sel?"var(--color-surface-2)":"transparent",color:sel||hov===i?"var(--color-ink)":"var(--color-ink-subtle)",boxShadow:sel?"var(--glow-active)":"none",transition:tr(["background","color","box-shadow"])}},lab);}));}
function TopNav({links=[],active,onNavigate,signInLabel="Sign in",ctaLabel="Get started",onSignIn,onCta,sticky=true,style}){
  const [hov,setHov]=us(null);const nav=(e,l)=>{e.preventDefault();onNavigate&&onNavigate(l);};
  return h("header",{style:{position:sticky?"sticky":"relative",top:0,zIndex:10,height:"var(--nav-height)",background:"var(--color-canvas)",borderBottom:"1px solid var(--color-hairline)",...style}},
    h("div",{style:{maxWidth:"var(--container-max)",margin:"0 auto",height:"100%",padding:"0 var(--gutter)",display:"flex",alignItems:"center",gap:24,boxSizing:"border-box"}},
      h("a",{href:"#",onClick:e=>nav(e,"home"),"aria-label":"GetEmployed home",style:{display:"flex"}},h(Wordmark,{size:17})),
      h("nav",{"data-r":"nav-links","aria-label":"Main",style:{flex:1,display:"flex",justifyContent:"center",gap:4}},links.map((l,i)=>{const on=active===l;
        return h("a",{key:l,href:"#","aria-current":on?"page":undefined,onClick:e=>nav(e,l),onMouseEnter:()=>setHov(i),onMouseLeave:()=>setHov(null),style:{fontSize:"var(--type-small-size)",lineHeight:1,padding:"8px 10px",borderRadius:"var(--rounded-md)",color:on||hov===i?"var(--color-ink)":"var(--color-ink-subtle)",position:"relative",whiteSpace:"nowrap"}},l,
          on&&h("span",{style:{position:"absolute",left:10,right:10,bottom:-11,height:1,background:"var(--color-primary)",boxShadow:"var(--glow-underline)"}}));})),
      h("div",{style:{display:"flex",gap:8,marginLeft:"auto"}},h(Button,{variant:"secondary",onClick:onSignIn},signInLabel),h(Button,{onClick:onCta},ctaLabel))));}
const FOOTER_COLUMNS=[{title:"Product",links:["Job search","Resume tailor","Outbox","Tracker","Mock interviews","Pricing"]},{title:"Open source",links:["GitHub","Self-host guide","Changelog"]},{title:"Company",links:["About","Privacy","Terms"]}];
const GH="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2";
function Footer({columns=FOOTER_COLUMNS,note="© 2026 GetEmployed",githubUrl="https://github.com/ashmit27j/get-employed",onLink,style}){
  const href=l=>l==="GitHub"&&githubUrl?githubUrl:"#";
  return h("footer",{style:{borderTop:"1px solid var(--color-hairline)",padding:"64px 32px",fontSize:"var(--type-caption-size)",lineHeight:"var(--type-caption-lh)",color:"var(--color-ink-subtle)",...style}},
    h("div",{"data-r":"footer-grid",style:{maxWidth:"var(--container-max)",margin:"0 auto",display:"grid",gridTemplateColumns:"minmax(160px,1.4fr) repeat("+columns.length+",minmax(0,1fr))",gap:32}},
      h("div",{style:{display:"flex",flexDirection:"column",gap:12}},h(Wordmark,{size:15}),h("span",null,note),
        githubUrl&&h("a",{href:githubUrl,target:"_blank",rel:"noreferrer",style:{display:"inline-flex",alignItems:"center",gap:8,color:"var(--color-ink-subtle)",width:"fit-content"}},h("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"},h("path",{d:GH})),"Star on GitHub")),
      columns.map(c=>h("div",{key:c.title,style:{display:"flex",flexDirection:"column",gap:10}},h("span",{style:{color:"var(--color-ink)",fontWeight:500}},c.title),
        c.links.map(l=>h("a",{key:l,href:href(l),target:href(l)!=="#"?"_blank":undefined,onClick:onLink&&href(l)==="#"?e=>{e.preventDefault();onLink(l);}:undefined,style:{color:"var(--color-ink-subtle)",width:"fit-content"}},l))))));}

/* ---------- Containers ---------- */
const CARD={
  default:{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:"var(--rounded-lg)",padding:24},
  featured:{background:"var(--color-surface-2)",border:"1px solid var(--color-hairline-strong)",borderRadius:"var(--rounded-lg)",padding:24},
  screenshot:{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:"var(--rounded-xl)",padding:24},
  testimonial:{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:"var(--rounded-lg)",padding:32,fontSize:"var(--type-lead-size)",lineHeight:1.5,letterSpacing:"var(--type-lead-ls)"}
};
function Card({variant="default",interactive=false,eyebrow,title,children,style,onClick}){
  const [hv,setH]=us(false);let s={boxSizing:"border-box",color:"var(--color-ink)",fontSize:"var(--type-body-size)",lineHeight:"var(--type-body-lh)",boxShadow:"var(--edge-highlight)",transition:tr(["background","border-color"]),display:"flex",flexDirection:"column",gap:12,...(CARD[variant]||CARD.default)};
  if(interactive&&hv)s={...s,background:"var(--color-surface-2)",borderColor:"var(--color-hairline-strong)",cursor:"pointer"};
  return h("div",{onClick,onMouseEnter:()=>setH(true),onMouseLeave:()=>setH(false),style:{...s,...style}},
    eyebrow&&h(Eyebrow,null,eyebrow),
    title&&h("div",{style:{fontSize:"var(--type-title-size)",fontWeight:500,lineHeight:"var(--type-title-lh)",letterSpacing:"var(--type-title-ls)"}},title),children);}
function PricingCard({tier,price,period="/mo",description,features=[],cta="Get started",featured=false,onSelect}){
  return h(Card,{variant:featured?"featured":"default",style:{gap:20}},
    h("div",{style:{display:"flex",flexDirection:"column",gap:8}},h("div",{style:{fontSize:"var(--type-headline-size)",fontWeight:600,lineHeight:"var(--type-headline-lh)",letterSpacing:"var(--type-headline-ls)"}},tier),description&&h("div",{style:{fontSize:"var(--type-small-size)",color:"var(--color-ink-subtle)"}},description)),
    h("div",{style:{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}},h("span",{style:{fontSize:"var(--type-stat-size)",fontWeight:600,letterSpacing:"var(--type-stat-ls)",lineHeight:1.1}},price),period&&h("span",{style:{fontSize:"var(--type-small-size)",color:"var(--color-ink-subtle)"}},period)),
    h(Button,{variant:featured?"primary":"secondary",fullWidth:true,onClick:onSelect},cta),
    h("ul",{style:{listStyle:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:10,fontSize:"var(--type-small-size)",color:"var(--color-ink-muted)"}},features.map(f=>h("li",{key:f,style:{display:"flex",gap:10,alignItems:"flex-start"}},h("span",{"aria-hidden":"true",style:{flex:"none",marginTop:7,width:6,height:6,borderRadius:"var(--rounded-full)",background:featured?"var(--color-primary)":"var(--color-ink-tertiary)"}}),f))));}
function TestimonialCard({quote,name,role,avatar}){const ini=(name||"").split(" ").map(w=>w[0]).join("").slice(0,2);
  return h(Card,{variant:"testimonial",style:{gap:24,height:"100%"}},h("p",{style:{margin:0,textWrap:"pretty"}},quote),
    h("div",{style:{display:"flex",alignItems:"center",gap:12,marginTop:"auto"}},
      h("div",{"aria-hidden":"true",style:{width:36,height:36,flex:"none",borderRadius:"var(--rounded-full)",background:"var(--color-surface-3)",border:"1px solid var(--color-hairline)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:"var(--color-ink-muted)"}},avatar?h("img",{src:avatar,alt:"",style:{width:"100%",height:"100%",objectFit:"cover"}}):ini),
      h("div",{style:{display:"flex",flexDirection:"column",fontSize:"var(--type-small-size)",lineHeight:1.35}},h("span",{style:{fontWeight:500}},name),h("span",{style:{color:"var(--color-ink-subtle)"}},role))));}
function CodeWindow({children,style}){
  return h("div",{style:{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:"var(--rounded-xl)",overflow:"hidden",...style}},
    h("div",{"aria-hidden":"true",style:{display:"flex",gap:6,padding:"12px 14px",borderBottom:"1px solid var(--color-hairline)"}},[0,1,2].map(i=>h("span",{key:i,style:{width:10,height:10,borderRadius:"50%",background:"var(--color-surface-4)"}}))),
    h("pre",{style:{margin:0,padding:"20px 22px",fontFamily:"var(--font-mono)",fontSize:"var(--type-ui-size)",lineHeight:1.8,color:"var(--color-ink-muted)",whiteSpace:"pre-wrap"}},children));}
function Accordion({items=[],defaultOpen=0}){
  const [open,setOpen]=us(defaultOpen);const base=R.useId();
  return h("div",null,items.map((it,i)=>{const q=it.q??it[0],a=it.a??it[1],on=open===i,pid=base+"p"+i;
    return h("div",{key:q,style:{borderBottom:"1px solid var(--color-hairline)"}},
      h("button",{"aria-expanded":on,"aria-controls":pid,onClick:()=>setOpen(on?-1:i),style:{all:"unset",cursor:"pointer",width:"100%",boxSizing:"border-box",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,padding:"20px 0",fontSize:"var(--type-body-size)",fontWeight:500,color:on?"var(--color-ink)":"var(--color-ink-muted)"}},q,
        h(Icon,{name:"plus",size:16,style:{transition:"transform var(--duration-slow) var(--ease-out-expo)",transform:on?"rotate(45deg)":"none",color:"var(--color-ink-subtle)"}})),
      h("div",{id:pid,role:"region",style:{display:"grid",gridTemplateRows:on?"1fr":"0fr",transition:"grid-template-rows 500ms var(--ease-out-expo)"}},h("div",{style:{overflow:"hidden"}},h("p",{style:{margin:"0 0 20px",fontSize:"var(--type-body-size)",lineHeight:1.6,color:"var(--color-ink-subtle)",maxWidth:600}},a))));}));}
function SourceChip({name,icon}){
  const [hv,setH]=us(false),[bad,setBad]=us(false);
  const wrap={width:28,height:28,flex:"none",borderRadius:"50%",background:hv?"var(--color-paper-rule)":"var(--color-surface-3)",display:"flex",alignItems:"center",justifyContent:"center",color:hv?"var(--color-paper-ink)":"var(--color-ink-muted)",transition:"background 250ms,color 250ms"};
  let mark;if(icon&&icon.startsWith("lucide:"))mark=h(Icon,{name:icon.slice(7),size:14});
  else if(icon&&!bad)mark=h("img",{src:"https://cdn.simpleicons.org/"+icon.slice(3)+"/C3C8D1",alt:"",width:14,height:14,onError:()=>setBad(true),style:{filter:hv?"brightness(0.1)":"none"}});
  else mark=h("span",{style:{fontSize:12,fontWeight:600}},name[0]);
  return h("div",{onMouseEnter:()=>setH(true),onMouseLeave:()=>setH(false),style:{display:"flex",alignItems:"center",gap:10,padding:"6px 16px 6px 6px",borderRadius:"var(--rounded-full)",background:hv?"var(--color-paper)":"var(--color-surface-1)",border:"1px solid "+(hv?"var(--color-paper)":"var(--color-hairline)"),fontSize:"var(--type-small-size)",fontWeight:500,color:hv?"var(--color-paper-ink)":"var(--color-ink-muted)",whiteSpace:"nowrap",transition:"background 250ms,color 250ms,border-color 250ms"}},h("span",{style:wrap},mark),name);}

/* ---------- Motion ---------- */
function useInView(ref,cb,amount=0.15){ue(()=>{const el=ref.current;if(!el)return;const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();cb(el);}},{threshold:amount});io.observe(el);return()=>io.disconnect();},[]);}
function Reveal({children,delay=0,y=32,style}){
  const r=ur(null);const [armed]=us(()=>!reduced());
  useInView(r,el=>{if(!armed)return;el.animate([{opacity:0,transform:"translateY("+y+"px) scale(.98)",filter:"blur(8px)"},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:1000,delay:delay*1000,easing:"cubic-bezier(0.16,1,0.3,1)",fill:"both"});});
  return h("div",{ref:r,style:{opacity:armed?0:1,...style}},children);}
function Highlight({children,delay=450}){
  const r=ur(null);const [on,setOn]=us(reduced());
  useInView(r,()=>{setTimeout(()=>setOn(true),delay);},1);
  return h("span",{ref:r,style:{borderRadius:2,padding:"0 4px",margin:"0 -4px",backgroundImage:"linear-gradient(var(--color-selection),var(--color-selection))",backgroundRepeat:"no-repeat",backgroundPosition:"left center",backgroundSize:(on?"100%":"0%")+" 100%",transition:"background-size 700ms var(--ease-wipe)"}},children);}
function ScrollProgress(){
  const r=ur(null);
  ue(()=>{let q=0;const run=()=>{q=0;const max=document.documentElement.scrollHeight-innerHeight;if(r.current)r.current.style.transform="scaleX("+(max>0?Math.min(1,scrollY/max):0)+")";};const on=()=>{if(!q)q=requestAnimationFrame(run);};run();addEventListener("scroll",on,{passive:true});addEventListener("resize",on);return()=>{removeEventListener("scroll",on);removeEventListener("resize",on);};},[]);
  return h("div",{ref:r,"aria-hidden":"true",style:{position:"fixed",top:0,left:0,right:0,height:2,background:"var(--color-primary)",boxShadow:"var(--glow-underline)",transformOrigin:"0 50%",transform:"scaleX(0)",zIndex:100,pointerEvents:"none"}});}

window.GE_DS={Icon,Wordmark,Container,Eyebrow,SectionHeading,Button,TextInput,StatusBadge,Tag,ChangelogRow,PillTabs,TopNav,Footer,FOOTER_COLUMNS,Card,PricingCard,TestimonialCard,CodeWindow,Accordion,SourceChip,Reveal,Highlight,ScrollProgress};
})();

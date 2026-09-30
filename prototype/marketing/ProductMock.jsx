const TOUR_DUR = 5200;
const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ease = x=>1-Math.pow(1-x,3);
const mk = t=>(s,d)=>ease(clamp((t-s)/d));
const mono = {fontFamily:"var(--font-mono)",fontSize:12};
const fadeUp = v=>({opacity:v,transform:"translateY("+(1-v)*8+"px)"});

const FEATURES = [
  {id:"search",icon:"search",label:"Search",title:"Verified roles only"},
  {id:"tracker",icon:"kanban-square",label:"Tracker",title:"Every application, one board"},
  {id:"resume",icon:"file-text",label:"Resume",title:"Tailored to each role"},
  {id:"alerts",icon:"bell",label:"Alerts",title:"Never miss a follow-up"},
  {id:"salary",icon:"bar-chart-3",label:"Salary",title:"Pay bands up front"},
];

/* C06 — tour data localised to the page's audience (Indian engineering roles, ₹ LPA). V1 kept for rollback. */
const TOUR_V1={q:"Product designer, remote",rows:[["Senior Product Designer","Loop","Remote · EU","$142k – $168k"],["Product Designer, Growth","Parcel","Remote · UK","£78k – £92k"],["Design Systems Lead","Northwind","Remote · IN","₹58L – ₹72L"],["Principal Designer","Vela","Remote · US","$190k – $220k"]],
  base:{Saved:["Parcel · Growth","Meridian · Brand"],Applied:["Northwind · DS Lead","Vela · Principal"],Interview:["Loop · Senior PD"],Offer:[]},mover:"Halcyon · Staff UX Eng",
  cv:["Priya Nair","Product Designer · Bengaluru","Match score · Loop, Senior PD"],tips:["Added “design systems” to summary","Quantified impact: +18% activation","Moved Figma + React to top skills"],
  alerts:[["sparkles","New match","Senior Product Designer at Loop · 94% match","now"],["clock","Follow up","Northwind has been in Applied for 7 days","2h"],["calendar","Interview tomorrow","Halcyon onsite · Thu 10:00","5h"],["trending-up","Salary update","Median for your role rose 4% this quarter","1d"]],
  sal:{fmt:v=>"$"+v+"k",from:118,span:37,unit:"",label:"median · Senior Product Designer · Remote",ticks:["$95k","p25 $142k","p75 $168k","$230k"],notes:["Based on 412 verified offers","Updated weekly"]}};
const TOUR_V2={q:"Backend engineer, Bengaluru",rows:[["Backend Engineer (Go)","Razorpay","Bengaluru · Hybrid","₹18–26 LPA"],["SDE-1, Payments","Zepto","Bengaluru","₹16–22 LPA"],["Platform Engineer","Postman","Remote · IN","₹20–30 LPA"],["Backend Engineer, Growth","CRED","Bengaluru","₹22–32 LPA"]],
  base:{Saved:["Postman · Platform","Groww · SDE-1"],Applied:["Zepto · SDE-1","CRED · Growth"],Interview:["Razorpay · Backend"],Offer:[]},mover:"Swiggy · SDE-2",
  cv:["Priya Nair","Backend engineer · Bengaluru","Match score · Razorpay, Backend"],tips:["Added “Kafka” and “gRPC” to skills","Quantified impact: p99 latency −38%","Moved Go + Postgres to the top"],
  alerts:[["sparkles","New match","Backend Engineer at Razorpay · 94% match","now"],["clock","Follow up","Zepto has been in Applied for 7 days","2h"],["calendar","Interview tomorrow","Swiggy system design · Thu 10:00","5h"],["trending-up","Salary update","Median for your role rose 4% this quarter","1d"]],
  sal:{fmt:v=>"₹"+v+" LPA",from:14,span:6,unit:"",label:"median · Backend engineer, 1–3 yrs · Bengaluru",ticks:["₹8 LPA","p25 ₹15 LPA","p75 ₹26 LPA","₹42 LPA"],notes:["Based on 412 verified offers","Updated weekly"]}};
const tour=()=>ge("C06")?TOUR_V2:TOUR_V1;
function SearchView({t}){
  const { StatusBadge } = DS; const p=mk(t); const D=tour();
  const q=D.q; const typed=q.slice(0,Math.floor(clamp(t/1100)*q.length));
  const rows=D.rows;
  return (<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--color-surface-1)",border:"1px solid var(--color-hairline-strong)",borderRadius:8,padding:"8px 12px",boxShadow:t<1300?"var(--focus-ring-shadow)":"none",transition:"box-shadow .2s"}}>
      <Icon name="search" size={15} style={{color:"var(--color-ink-subtle)"}}/>
      <span style={{color:"var(--color-ink)"}}>{typed}<span style={{opacity:t<1300&&Math.floor(t/400)%2===0?1:0,color:"var(--color-primary)"}}>|</span></span>
      <span style={{marginLeft:"auto",...mono,color:"var(--color-ink-subtle)",opacity:p(1200,300)}}>1,284 results</span>
    </div>
    {rows.map((r,i)=>(<div key={r[0]} data-r="search-row" style={{display:"grid",gridTemplateColumns:"minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) auto",gap:12,alignItems:"center",padding:"10px 12px",border:"1px solid var(--color-hairline)",borderRadius:8,background:"var(--color-surface-1)",...fadeUp(p(1300+i*180,350))}}>
      <span style={{display:"flex",flexDirection:"column",minWidth:0}}><span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r[0]}</span><span style={{fontSize:12,color:"var(--color-ink-subtle)"}}>{r[1]}</span></span>
      <span style={{color:"var(--color-ink-subtle)"}}>{r[2]}</span>
      <span style={{...mono,color:"var(--color-ink-muted)"}}>{r[3]}</span>
      <StatusBadge tone="success">Verified</StatusBadge>
    </div>))}
  </div>);
}

function TrackerView({t}){
  const cols=["Saved","Applied","Interview","Offer"];
  const step=t<1400?1:t<2900?2:3;
  const D=tour();const base=D.base;
  const moved=cols[step];
  return (<div data-r="tracker" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10}}>
    {cols.map(c=>(<div key={c} style={{display:"flex",flexDirection:"column",gap:8,background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:v2(10,8),padding:10,minHeight:230}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--color-ink-subtle)"}}><span>{c}</span><span style={mono}>{base[c].length+(moved===c?1:0)}</span></div>
      {base[c].map(x=><div key={x} style={{padding:"8px 10px",borderRadius:6,background:"var(--color-surface-2)",border:"1px solid var(--color-hairline)",fontSize:12}}>{x}</div>)}
      {moved===c && <div key={"h"+step} className="ge-pop" style={{padding:"8px 10px",borderRadius:6,background:"var(--color-surface-3)",border:"1px solid var(--color-primary)",boxShadow:"var(--glow-active)",fontSize:12,display:"flex",flexDirection:"column",gap:4}}>
        <span>{D.mover}</span>
        <span style={{fontSize:11,color:c==="Offer"?v2("var(--color-semantic-success)","var(--color-success)"):"var(--color-ink-subtle)"}}>{c==="Offer"?"Offer received":c==="Interview"?"Onsite Thu 10:00":"Applied today"}</span>
      </div>}
    </div>))}
  </div>);
}

function ResumeView({t}){
  const p=mk(t); const score=Math.round(62+29*p(600,2000));
  const D=tour();const tips=D.tips;
  return (<div style={{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) minmax(0,1fr)",gap:14}}>
    <div style={{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:v2(10,8),padding:16,display:"flex",flexDirection:"column",gap:10,fontSize:12,color:"var(--color-ink-subtle)"}}>
      <span style={{fontSize:15,color:"var(--color-ink)",fontWeight:500}}>{D.cv[0]}</span>
      <span>{D.cv[1]}</span>
      {["Summary","Experience","Skills"].map((h,i)=>(<div key={h} style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
        <span style={{fontSize:11,letterSpacing:".4px",textTransform:"uppercase"}}>{h}</span>
        {[0,1].map(j=>{const hl=p(900+i*600,400);return <span key={j} style={{height:8,borderRadius:2,width:(88-j*22-i*6)+"%",background:j===0&&hl>0?"rgba(123,155,219,"+(0.1+0.25*hl)+")":"var(--color-surface-3)",borderRadius:v2(2,2),transition:"background .3s"}}></span>;})}
      </div>))}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:v2(10,8),padding:16,display:"flex",flexDirection:"column",gap:10}}>
        <span style={{fontSize:12,color:"var(--color-ink-subtle)"}}>{D.cv[2]}</span>
        <span style={{fontSize:40,fontWeight:600,letterSpacing:"-1px",lineHeight:1}}>{score}<span style={{fontSize:16,color:"var(--color-ink-subtle)"}}>/100</span></span>
        <div style={{height:4,borderRadius:v2(9,9999),background:"var(--color-surface-3)",overflow:"hidden"}}><div style={{height:"100%",width:score+"%",background:"var(--color-primary)",boxShadow:"var(--glow-underline)"}}></div></div>
      </div>
      {tips.map((x,i)=>(<div key={x} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:"var(--color-ink-muted)",...fadeUp(p(900+i*600,350))}}><Icon name="check" size={14} style={{color:v2("var(--color-semantic-success)","var(--color-success)")}}/>{x}</div>))}
    </div>
  </div>);
}

function AlertsView({t}){
  const p=mk(t);
  const items=tour().alerts;
  return (<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {items.map(([ic,h,b,w],i)=>{const v=p(300+i*700,450);return (<div key={h} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 14px",background:i===0?"var(--color-surface-2)":"var(--color-surface-1)",border:"1px solid "+(i===0?"var(--color-hairline-strong)":"var(--color-hairline)"),borderRadius:v2(10,8),opacity:v,transform:"translateX("+(1-v)*24+"px)"}}>
      <span style={{width:30,height:30,borderRadius:8,background:"var(--color-surface-3)",display:"flex",alignItems:"center",justifyContent:"center",color:i===0?"var(--color-primary)":"var(--color-ink-subtle)"}}><Icon name={ic} size={15}/></span>
      <span style={{display:"flex",flexDirection:"column",flex:1,minWidth:0}}><span>{h}</span><span style={{fontSize:12,color:"var(--color-ink-subtle)"}}>{b}</span></span>
      <span style={{...mono,color:"var(--color-ink-tertiary)"}}>{w}</span>
    </div>);})}
  </div>);
}

function SalaryView({t}){
  const p=mk(t); const g=p(300,1400);
  const bars=[3,6,11,17,24,21,15,9,5,2];
  const S=tour().sal;const med=Math.round(S.from+S.span*p(600,1600));
  return (<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",alignItems:"baseline",gap:12}}>
      <span style={{fontSize:40,fontWeight:600,letterSpacing:"-1px",lineHeight:1,fontFamily:v2("var(--font-display)","var(--font-sans)")}}>{S.fmt(med)}</span>
      <span style={{fontSize:12,color:"var(--color-ink-subtle)"}}>{S.label}</span>
    </div>
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:130,padding:"0 4px",borderBottom:"1px solid var(--color-hairline)"}}>
      {bars.map((h,i)=>{const on=i>=3&&i<=6;return <div key={i} style={{flex:1,height:(h/24*100*ease(clamp(g*1.4-i*0.05)))+"%",borderRadius:v2("3px 3px 0 0","4px 4px 0 0"),background:on?"var(--color-primary)":"var(--color-surface-4)",boxShadow:on&&i===4?"var(--glow-active)":"none"}}></div>;})}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",...mono,color:"var(--color-ink-subtle)",opacity:p(1800,400)}}>
      <span>{S.ticks[0]}</span><span style={{color:"var(--color-ink-muted)"}}>{S.ticks[1]}</span><span style={{color:"var(--color-ink-muted)"}}>{S.ticks[2]}</span><span>{S.ticks[3]}</span>
    </div>
    <div style={{display:"flex",gap:8,...fadeUp(p(2200,400))}}>
      {S.notes.map(x=><span key={x} style={{fontSize:12,color:"var(--color-ink-subtle)",padding:"2px 8px",border:"1px solid var(--color-hairline)",borderRadius:999}}>{x}</span>)}
    </div>
  </div>);
}

const VIEWS={search:SearchView,tracker:TrackerView,resume:ResumeView,alerts:AlertsView,salary:SalaryView};

function ProductMock(){
  const [idx,setIdx]=React.useState(0);
  const [t,setT]=React.useState(0);
  const [hover,setHover]=React.useState(false);
  const [paused,setPaused]=React.useState(false);
  const stop=hover||paused;
  React.useEffect(()=>{
    let raf,last=performance.now();
    const loop=now=>{const dt=now-last;last=now;if(!stop){setT(prev=>{const n=prev+dt;if(n>=TOUR_DUR){setIdx(i=>(i+1)%FEATURES.length);return 0;}return n;});}raf=requestAnimationFrame(loop);};
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[stop]);
  const jump=i=>{setIdx(i);setT(0);};
  const f=FEATURES[idx]; const View=VIEWS[f.id]; const a11y=ge("C03");
  return (
    <div data-r="mock" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{background:"var(--color-canvas)",border:"1px solid var(--color-hairline)",borderRadius:12,overflow:"hidden",display:"grid",gridTemplateColumns:"200px minmax(0,1fr)",minHeight:400,fontSize:13}}>
      <aside {...(a11y?{role:"tablist","aria-label":"Product tour","aria-orientation":"vertical"}:{})} style={{background:"var(--color-surface-1)",borderRight:"1px solid var(--color-hairline)",padding:12,display:"flex",flexDirection:"column",gap:2}}>
        {FEATURES.map((x,i)=>{const on=i===idx;return (
          <button key={x.id} {...(a11y?{role:"tab","aria-selected":on}:{})} onClick={()=>jump(i)} style={{position:"relative",overflow:"hidden",display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",fontSize:13,background:on?"var(--color-surface-3)":"transparent",color:on?"var(--color-ink)":"var(--color-ink-subtle)",transition:"background .15s,color .15s"}}>
            <Icon name={x.icon} size={15} style={{color:on?"var(--color-primary)":"inherit"}}/>{x.label}
            {on && <span style={{position:"absolute",left:0,bottom:0,height:1,width:(t/TOUR_DUR*100)+"%",background:"var(--color-primary)",boxShadow:"var(--glow-underline)"}}></span>}
          </button>);})}
        <div style={{marginTop:"auto",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",color:"var(--color-ink-subtle)",fontSize:12}}><span style={{width:6,height:6,borderRadius:9,background:v2("var(--color-semantic-success)","var(--color-success)")}}></span>Open to work</div>
      </aside>
      <div style={{display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid var(--color-hairline)",color:"var(--color-ink-muted)"}}>
          <span style={{color:"var(--color-ink)",fontWeight:500}}>{f.label}</span><span style={{color:"var(--color-ink-tertiary)"}}>/</span><span>{f.title}</span>
          <span style={{marginLeft:"auto",display:"flex",gap:4}}>
            {FEATURES.map((x,i)=><span key={x.id} aria-hidden={a11y||undefined} onClick={()=>jump(i)} style={{cursor:"pointer",width:18,height:3,borderRadius:v2(9,9999),background:i<idx?"var(--color-ink-tertiary)":"var(--color-surface-4)",overflow:"hidden"}}>{i===idx&&<span style={{display:"block",height:"100%",width:(t/TOUR_DUR*100)+"%",background:"var(--color-primary)"}}></span>}</span>)}
          </span>
          <button onClick={()=>setPaused(v=>!v)} aria-label={a11y?(paused?"Play product tour":"Pause product tour"):(paused?"Play":"Pause")} style={{display:"flex",alignItems:"center",justifyContent:"center",width:a11y?32:26,height:a11y?32:26,borderRadius:6,border:"1px solid var(--color-hairline)",background:"var(--color-surface-1)",color:"var(--color-ink-subtle)",cursor:"pointer"}}><Icon name={paused?"play":"pause"} size={12}/></button>
        </div>
        <div key={f.id} className="ge-fade" {...(a11y?{role:"tabpanel","aria-label":f.label+": "+f.title}:{})} style={{padding:16,flex:1}}><View t={t}/></div>
      </div>
    </div>
  );
}
window.ProductMock=ProductMock;

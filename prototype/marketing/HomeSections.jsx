const STEPS=[
  ["search","Search","Describe the job in plain English","Type “backend roles in Bengaluru, 12 LPA+, remote-friendly”. It becomes filter chips you can edit."],
  ["match","Match","A match score for every role","Each job is scored 0–100 against your profile, with a one-line reason and the skills you’re missing."],
  ["tailor","Tailor","A resume written for the role","Bullets are rewritten per job. You review the diff and the ATS score before anything is saved."],
  ["outreach","Reach out","Email the person who’s hiring","Drafts wait in your outbox with the contact’s email and a confidence score. Nothing sends until you approve."],
  ["track","Track","Every application on one board","Found, tailored, sent, replied, interview, offer. Cards move as replies come in."],
  ["practice","Practice","Rehearse the interview out loud","A live voice mock interview, then a report on communication, accuracy, structure and confidence."],
];
function Step({s,i}){
  const [on,setOn]=React.useState(false);const r=React.useRef(null);
  const hov=v=>{setOn(v);const m=Mo();if(m&&r.current&&!reducedMotion())m.animate(r.current,{transform:v?"translateY(-6px)":"translateY(0px)"},{type:"spring",stiffness:320,damping:22});};
  const [kind,eb,t,b]=s;
  return (<div data-step="" onMouseEnter={()=>hov(true)} onMouseLeave={()=>hov(false)} style={{padding:"32px 32px 40px",borderLeft:i%3?"1px solid var(--color-hairline)":"none",borderTop:i>2?"1px solid var(--color-hairline)":"none",cursor:"default"}}>
    <Reveal delay={(i%3)*0.08}><div ref={r} style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.5px",color:on?"var(--color-primary)":"var(--color-ink-tertiary)",transition:"color .3s"}}>{"0"+(i+1)+" · "+eb.toUpperCase()}</div>
      <StepFigure kind={kind} active={on}></StepFigure>
      <div style={{fontSize:16,fontWeight:500,color:"var(--color-ink)",marginTop:12}}>{t}</div>
      <p style={{margin:0,fontSize:14,lineHeight:1.6,color:"var(--color-ink-subtle)",maxWidth:320,textWrap:"pretty"}}>{b}</p>
    </div></Reveal>
  </div>);
}
function HowItWorks(){
  return (<Section id="how">
    <Reveal><div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:48}}><Eyebrow>How it works</Eyebrow><H2 style={{maxWidth:760}}>From one sentence to a booked interview.</H2></div></Reveal>
    <div data-r="steps" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}>{STEPS.map((s,i)=><Step key={s[0]} s={s} i={i}></Step>)}</div>
  </Section>);
}
const SOURCES=[
  ["LinkedIn","lucide:linkedin"],["Google Careers","si:google"],["Naukri",null],["Indeed","si:indeed"],["Glassdoor","si:glassdoor"],
  ["Wellfound",null],["Instahyre",null],["Cutshort",null],["Foundit",null],["Internshala",null],["Hirist",null],["Careers pages","lucide:building-2"],
];
function SourceIcon({src,name}){
  const [bad,setBad]=React.useState(false);
  const wrap={width:28,height:28,flex:"none",borderRadius:"50%",background:"var(--color-surface-3)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--color-ink-muted)"};
  if(src&&src.startsWith("lucide:"))return <span style={wrap}><Icon name={src.slice(7)} size={14}></Icon></span>;
  if(src&&!bad)return <span style={wrap}><img src={"https://cdn.simpleicons.org/"+src.slice(3)+"/C3C8D1"} alt="" width="14" height="14" onError={()=>setBad(true)}></img></span>;
  return <span style={{...wrap,fontSize:12,fontWeight:600}}>{name[0]}</span>;
}
function SourceCarousel(){
  const [paused,setPaused]=React.useState(false);
  const fade="linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)";
  return (<Section style={{paddingTop:72,paddingBottom:0}}>
    <Reveal><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
      <div style={{fontSize:14,color:"var(--color-ink-subtle)"}}>Listings pulled from the boards you already use</div>
      <div onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} style={{width:"100%",overflow:"hidden",WebkitMaskImage:fade,maskImage:fade}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>{[0,6].map((off,r)=>{const row=[...SOURCES.slice(off),...SOURCES.slice(0,off)];return (
          <div key={r} className="ge-track" style={{display:"flex",width:"max-content",marginLeft:-r*70,animationDelay:(-r*9)+"s",animationDuration:(45+r*6)+"s",animationPlayState:paused?"paused":"running"}}>
            {[...row,...row].map(([n,src],i)=>ge("C01")?(
              <div key={i} style={{paddingRight:12}}><DS.SourceChip name={n} icon={src}></DS.SourceChip></div>
            ):(
              <div key={i} style={{paddingRight:12}}><div className="ge-pebble" style={{display:"flex",alignItems:"center",gap:10,padding:"6px 16px 6px 6px",borderRadius:999,background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",fontSize:14,fontWeight:500,color:"var(--color-ink-muted)",whiteSpace:"nowrap"}}>
                <SourceIcon src={src} name={n}></SourceIcon>{n}
              </div></div>
            ))}
          </div>);})}
        </div>
      </div>
    </div></Reveal>
  </Section>);
}
function SelV1({children}){
  const r=React.useRef(null);
  React.useEffect(()=>{const el=r.current,m=Mo();if(!el)return;if(!m||reducedMotion()){el.classList.add("on");return;}return m.inView(el,()=>{setTimeout(()=>el.classList.add("on"),450);},{amount:1});},[]);
  return <span ref={r} className="ge-hl">{children}</span>;
}
const Sel=pick("Highlight",SelV1);
function TagV1({children}){return <span style={{fontSize:12,padding:"2px 8px",borderRadius:999,background:"var(--color-surface-3)",color:"var(--color-ink-muted)"}}>{children}</span>;}
const Tag=pick("Tag",TagV1);
function Features(){
  const {Card,Button}=DS;
  const cell={background:"var(--color-canvas)",border:"1px solid var(--color-hairline)",borderRadius:v2(10,8),padding:16,display:"flex",flexDirection:"column",gap:10,fontSize:13};
  const rub=[["Communication",82],["Technical accuracy",74],["Structure",68],["Confidence",79]];
  const cards=[
    ["Job feed","Know why a role fits before you open it",<div style={cell}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><div><div style={{color:"var(--color-ink)",fontWeight:500}}>Backend Engineer · Razorpay</div><div style={{color:"var(--color-ink-subtle)"}}>Bengaluru · ₹18–26 LPA</div></div><div style={{fontFamily:"var(--font-mono)",fontSize:28,color:"var(--color-primary)"}}>92</div></div><div style={{color:"var(--color-ink-muted)"}}>Your Go and Kafka projects cover 4 of 5 requirements.</div><div style={{display:"flex",gap:6}}><Tag>Missing: Kubernetes</Tag><Tag>gRPC</Tag></div></div>],
    ["Resume tailor","See every rewritten line",<div style={{...cell,fontFamily:"var(--font-mono)",fontSize:12}}><div style={{color:"var(--color-ink-tertiary)",textDecoration:"line-through"}}>− Worked on backend APIs for college fest app</div><div style={{color:"var(--color-ink)"}}>+ Built a Go REST API serving 12k users during a 3-day college fest</div><div style={{display:"flex",justifyContent:"space-between",color:"var(--color-ink-subtle)",fontFamily:"var(--font-sans)",fontSize:13,marginTop:4}}><span>ATS score</span><span><span style={{color:"var(--color-ink-tertiary)"}}>71 → </span><span style={{color:"var(--color-primary)"}}>89</span></span></div></div>],
    ["Outbox","Approve each email with one click",<div style={cell}><div style={{display:"flex",justifyContent:"space-between",color:"var(--color-ink-subtle)"}}><span>To: ananya.k@zepto.co</span><span style={{fontFamily:"var(--font-mono)"}}>94% match</span></div><div style={{color:"var(--color-ink)"}}>Hi Ananya, I saw the SDE-1 opening on the payments team…</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Button variant="secondary" size="sm">Edit</Button><Button size="sm">Approve & send</Button></div></div>],
    ["Interview report","Scores you can improve on",<div style={cell}>{rub.map(([l,v])=><div key={l} style={{display:"grid",gridTemplateColumns:"140px 1fr 28px",alignItems:"center",gap:10,color:"var(--color-ink-muted)"}}><span>{l}</span><span style={{height:4,borderRadius:2,background:"var(--color-surface-3)",overflow:"hidden"}}><span style={{display:"block",height:"100%",width:v+"%",background:"var(--color-primary)",opacity:0.4+v/200}}></span></span><span style={{fontFamily:"var(--font-mono)",textAlign:"right"}}>{v}</span></div>)}</div>],
  ];
  return (<Section>
    <Reveal><div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:48}}><Eyebrow>Inside the app</Eyebrow><H2 style={{maxWidth:760}}>Built <Sel>for Engineers</Sel>, by Engineers.</H2></div></Reveal>
    <div data-r="grid2" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16,marginBottom:72}}>
      {cards.map(([e,t,ui],i)=><Reveal key={e} delay={(i%2)*0.08}><Card eyebrow={e} title={t} style={{height:"100%",gap:16}}>{ui}</Card></Reveal>)}
    </div>
  </Section>);
}
function SelfHost(){
  const {StatusBadge}=DS;
  const pts=["Same app as the hosted version","Your own LLM and email API keys","No usage limits","Your data stays on your machine"];
  const lines=(<><span style={{color:"var(--color-ink-tertiary)"}}>$ </span>git clone {REPO_URL}.git{"\n"}<span style={{color:"var(--color-ink-tertiary)"}}>$ </span>cd get-employed && cp .env.example .env{"\n"}<span style={{color:"var(--color-ink-tertiary)"}}>$ </span>docker compose up -d{"\n"}<span style={{color:"var(--color-primary)"}}>✓</span> web      ready on http://localhost:3000{"\n"}<span style={{color:"var(--color-primary)"}}>✓</span> worker   scraping 12 sources{"\n"}<span style={{color:"var(--color-primary)"}}>✓</span> db       healthy</>);
  return (<Section id="selfhost">
    <div data-r="split" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.1fr)",gap:48,alignItems:"center",marginBottom:72}}>
      <Reveal><div style={{display:"flex",flexDirection:"column",gap:20,alignItems:"flex-start"}}>
        <StatusBadge>Open source</StatusBadge>
        <H2 size="md">Run it yourself <Sel>for free</Sel>.</H2>
        <p style={{margin:0,fontSize:v2(17,18),lineHeight:1.6,color:"var(--color-ink-subtle)",maxWidth:480}}>Clone the repo, add your keys, start it with Docker Compose. Everything the hosted plan does, without the quotas.</p>
        <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:10,fontSize:v2(15,16),color:"var(--color-ink-muted)"}}>{pts.map(p=><li key={p} style={{display:"flex",gap:10,alignItems:"center"}}><Icon name="check" size={14} style={{color:"var(--color-primary)"}}></Icon>{p}</li>)}</ul>
      </div></Reveal>
      <Reveal delay={0.1}>{ge("C01")?<DS.CodeWindow>{lines}</DS.CodeWindow>:<div style={{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"flex",gap:6,padding:"12px 14px",borderBottom:"1px solid var(--color-hairline)"}}>{[0,1,2].map(i=><span key={i} style={{width:10,height:10,borderRadius:"50%",background:"var(--color-surface-4)"}}></span>)}</div>
        <pre style={{margin:0,padding:"20px 22px",fontFamily:"var(--font-mono)",fontSize:13,lineHeight:1.8,color:"var(--color-ink-muted)",whiteSpace:"pre-wrap"}}><span style={{color:"var(--color-ink-tertiary)"}}>$ </span>git clone {REPO_URL}.git{"\n"}<span style={{color:"var(--color-ink-tertiary)"}}>$ </span>cd get-employed && cp .env.example .env{"\n"}<span style={{color:"var(--color-ink-tertiary)"}}>$ </span>docker compose up -d{"\n"}<span style={{color:"var(--color-primary)"}}>✓</span> web      ready on http://localhost:3000{"\n"}<span style={{color:"var(--color-primary)"}}>✓</span> worker   scraping 12 sources{"\n"}<span style={{color:"var(--color-primary)"}}>✓</span> db       healthy</pre>
      </div>}</Reveal>
    </div>
  </Section>);
}
function Testimonials(){
  const {TestimonialCard}=DS;
  const t=[
    ["I described what I wanted in one sentence and had thirty matched roles with reasons. Three interviews in two weeks.","Aditi Sharma","SDE-1, hired at a Bengaluru fintech"],
    ["The mock interviews were tough in a useful way. My structure score went from 54 to 81 before the real one.","Rohan Iyer","Backend Engineer, Pune"],
    ["I approved every outreach email myself and still got replies from two hiring managers in the first week.","Sneha Reddy","Final-year CSE, Hyderabad"],
  ];
  return (<Section style={{paddingBottom:96}}>
    <Reveal><H2 style={{marginBottom:40}}>{ge("C08")?<>From candidates <Sel>like you:</Sel></>:<>From others <Sel>like you:</Sel></>}</H2></Reveal>
    <div data-r="grid3" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16}}>{t.map(([q,n,r],i)=><Reveal key={n} delay={i*0.08} style={{height:"100%",display:"grid"}}><TestimonialCard quote={q} name={n} role={r}></TestimonialCard></Reveal>)}</div>
  </Section>);
}
const FAQS=[
  ["Is it free?","Yes. The free plan includes 5 saved searches, 20 tailored resumes and 50 outreach emails a month, plus one mock interview. Pro removes the limits."],
  ["What’s the difference between hosted and self-hosted?","It’s the same product. The self-hosted version runs on your machine with Docker Compose, uses your own API keys, and has no limits."],
  ["Will it send emails without asking me?","No. Every draft waits in your outbox until you approve it."],
  ["Where do the jobs come from?","Public listings on job boards and company careers pages, de-duplicated and refreshed daily."],
  ["Is it only for India?","It starts with roles and salary data in India. More regions are planned."],
];
function FAQListV1(){
  const [open,setOpen]=React.useState(0);const a11y=ge("C03");
  return (<div>{FAQS.map(([q,a],i)=>{const on=open===i;return (
        <div key={q} style={{borderBottom:"1px solid var(--color-hairline)"}}>
          <button {...(a11y?{"aria-expanded":on,"aria-controls":"faq-"+i}:{})} onClick={()=>setOpen(on?-1:i)} style={{all:"unset",cursor:"pointer",width:"100%",boxSizing:"border-box",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,padding:"20px 0",fontSize:17,fontWeight:500,color:on?"var(--color-ink)":"var(--color-ink-muted)"}}>{q}<Icon name="plus" size={16} style={{transition:"transform .4s cubic-bezier(.16,1,.3,1)",transform:on?"rotate(45deg)":"none",color:"var(--color-ink-subtle)"}}></Icon></button>
          <div id={a11y?"faq-"+i:undefined} role={a11y?"region":undefined} style={{display:"grid",gridTemplateRows:on?"1fr":"0fr",transition:"grid-template-rows .5s cubic-bezier(.16,1,.3,1)"}}><div style={{overflow:"hidden"}}><p style={{margin:"0 0 20px",fontSize:15,lineHeight:1.6,color:"var(--color-ink-subtle)",maxWidth:600}}>{a}</p></div></div>
        </div>);})}</div>);
}
function FAQ(){
  return (<Section>
    <div data-r="split" style={{display:"grid",gridTemplateColumns:"minmax(0,0.8fr) minmax(0,1.2fr)",gap:48}}>
      <Reveal><div style={{display:"flex",flexDirection:"column",gap:16}}><Eyebrow>FAQ</Eyebrow><H2 size="md">Questions</H2></div></Reveal>
      <Reveal delay={0.08}>{ge("C01")?<DS.Accordion items={FAQS}></DS.Accordion>:<FAQListV1/>}</Reveal>
    </div>
  </Section>);
}
function FinalCTA({go}){
  const {Button}=DS;
  const h=React.useRef(null),sel=React.useRef(null);
  React.useEffect(()=>{const m=Mo(),el=h.current;if(!m||!el||reducedMotion()){sel.current&&sel.current.classList.add("on");return;}
    const ls=el.querySelectorAll("[data-l]");ls.forEach(l=>l.style.opacity=0);
    return m.inView(el,()=>{
      m.animate(ls,{opacity:[0,1],transform:["translateY(70%) rotate(8deg)","translateY(0%) rotate(0deg)"],filter:["blur(10px)","blur(0px)"]},{duration:0.9,delay:m.stagger(0.04),ease:EASE});
      setTimeout(()=>sel.current&&sel.current.classList.add("on"),1100);
    },{amount:0.5});
  },[]);
  const words=ge("C09")?[["Get",false],["employed.",true]]:[["Get",false],["Employed",true],["Now!",false]];
  return (<Section style={{paddingBottom:120}}>
    <section data-r="cta-panel" style={{position:"relative",overflow:"hidden",background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:20,padding:"112px 48px",display:"flex",flexDirection:"column",alignItems:"center",gap:32,textAlign:"center"}}>
      <h2 ref={h} data-r="cta-h" aria-label={words.map(w=>w[0]).join(" ")} style={{position:"relative",margin:0,fontSize:104,fontWeight:600,lineHeight:1.05,letterSpacing:"-4px",display:"flex",flexWrap:"wrap",justifyContent:"center",columnGap:"0.25em"}}>
        {words.map(([w,hi])=><span key={w} ref={hi?sel:undefined} className={hi?"ge-hl":undefined} aria-hidden="true" style={{display:"inline-flex",position:"relative",color:"var(--color-ink)"}}>{w.split("").map((c,i)=><span key={i} data-l="" style={{display:"inline-block"}}>{c}</span>)}</span>)}
      </h2>
      <p style={{position:"relative",margin:0,fontSize:18,color:"var(--color-ink-subtle)"}}><strong style={{color:"var(--color-ink)",fontWeight:600}}><Sel>Free</Sel></strong> to start. No credit card. Or self-host it tonight.</p>
      <div style={{position:"relative",display:"flex",gap:8}}><a href="https://github.com" target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:8,height:36,padding:"0 16px",borderRadius:9999,background:"var(--color-surface-4)",color:"var(--color-ink)",fontSize:14,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap"}}><img src="../assets/github.png" alt="" aria-hidden="true" width="16" height="16" style={{display:"block",width:16,height:16,objectFit:"contain"}}></img>View on GitHub</a><Button onClick={()=>go("signup")}>Get started</Button></div>
    </section>
  </Section>);
}
Object.assign(window,{Sel,Tag,HowItWorks,SourceCarousel,Features,SelfHost,Testimonials,FAQ,FinalCTA});

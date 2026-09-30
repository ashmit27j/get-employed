function HeroHeadline(){
  const [phase,setPhase]=React.useState(0);
  React.useEffect(()=>{const a=setTimeout(()=>setPhase(1),5500),b=setTimeout(()=>setPhase(2),6200);return()=>{clearTimeout(a);clearTimeout(b);};},[]);
  const out=phase===1?" ge-wipeout":"";
  const a11y=ge("C03");
  const end=ge("C05")
    ? (<React.Fragment key="b"> {/* C05 */}
        <span className="ge-wipe" style={{animationDelay:"0s"}}>Get <span className="ge-sel" style={{animationDelay:"0.9s"}}>employed</span>.</span>
        <span className="ge-wipe" style={{animationDelay:"0.3s"}}>Skip the legwork.</span>
      </React.Fragment>)
    : (<React.Fragment key="b">
        <span className="ge-wipe" style={{animationDelay:"0s"}}>Get<span className="ge-sel" style={{animationDelay:"0.9s"}}>Employed</span></span>
        <span className="ge-wipe" style={{animationDelay:"0.3s"}}>Today</span>
      </React.Fragment>);
  return (<h1 data-r="h1" aria-label={a11y?(ge("C05")?"Unemployed? Get employed and skip the legwork.":"Unemployed? Let's fix that."):undefined} style={{margin:0,fontSize:80,fontWeight:600,lineHeight:1.05,letterSpacing:"-3px",maxWidth:900,display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
    {phase<2 ? (<React.Fragment key="a">
      <span aria-hidden={a11y||undefined} className={"ge-wipe"+out} style={{animationDelay:phase?"0s":"0.1s"}}><span className="ge-un">Un</span><span className="ge-sel">employed</span>?</span>
      <span aria-hidden={a11y||undefined} className={"ge-wipe"+out} style={{animationDelay:phase?"0.08s":"0.9s"}}>Let's fix that.</span>
    </React.Fragment>) : <span aria-hidden={a11y||undefined} style={{display:"contents"}}>{end}</span>}
  </h1>);
}

/* C12 — live query parser. Pattern list is deliberately small and literal; it mirrors the chips the app's search produces. */
const HERO_EXAMPLES=["React internships in Bengaluru, remote-friendly","Backend roles in Pune, 12 LPA+, 2 years of Go","Data analyst, fresher, Hyderabad or remote"];
const PARSE_RULES=[
  ["Type",[[/\bintern(ship)?s?\b/,"Internship"],[/\bfull[- ]?time\b/,"Full-time"],[/\bcontract\b/,"Contract"]]],
  ["Role",[[/\bback[- ]?end\b/,"Backend"],[/\bfront[- ]?end\b/,"Frontend"],[/\bfull[- ]?stack\b/,"Full stack"],[/\bdata analyst/,"Data analyst"],[/\bdata scien/,"Data science"],[/\b(ml|machine learning)\b/,"ML"],[/\bdevops\b/,"DevOps"],[/\bandroid\b/,"Android"],[/\bios\b/,"iOS"],[/\bsde\b/,"SDE"],[/\bproduct design/,"Product design"]]],
  ["Skill",[[/\breact\b/,"React"],[/\b(go|golang)\b/,"Go"],[/\bpython\b/,"Python"],[/\bjava\b/,"Java"],[/\bnode(\.js)?\b/,"Node.js"],[/\btypescript\b/,"TypeScript"],[/\bflutter\b/,"Flutter"],[/\bkotlin\b/,"Kotlin"]]],
  ["Location",[[/\b(bengaluru|bangalore)\b/,"Bengaluru"],[/\bpune\b/,"Pune"],[/\bhyderabad\b/,"Hyderabad"],[/\bmumbai\b/,"Mumbai"],[/\bchennai\b/,"Chennai"],[/\b(delhi|ncr)\b/,"Delhi NCR"],[/\b(gurugram|gurgaon)\b/,"Gurugram"],[/\bnoida\b/,"Noida"],[/\bremote\b/,"Remote OK"]]],
];
function parseQuery(q){
  const s=q.toLowerCase(),out=[];
  PARSE_RULES.forEach(([k,rs])=>rs.forEach(([re,v])=>{if(re.test(s))out.push([k,v]);}));
  const sal=s.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|l\b)/);if(sal)out.push(["Salary","≥ ₹"+sal[1]+" LPA"]);
  const exp=s.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/);if(exp)out.push(["Experience",exp[1]+"+ yrs"]);else if(/\b(fresher|new grad|entry[- ]level)\b/.test(s))out.push(["Experience","0–1 yrs"]);
  return out;
}
function ChipV1({label,children}){return <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,lineHeight:1.4,padding:"2px 8px",borderRadius:999,background:"var(--color-surface-3)",color:"var(--color-ink-muted)",whiteSpace:"nowrap"}}><span style={{color:"var(--color-ink-subtle)"}}>{label}</span>{children}</span>;}
const Chip=pick("Tag",ChipV1);
function HeroSearch({go}){
  const { Button, TextInput } = DS;
  const rm=reducedMotion();
  const [q,setQ]=React.useState(rm?HERO_EXAMPLES[0]:"");
  const [auto,setAuto]=React.useState(!rm);
  React.useEffect(()=>{if(!auto)return;let ex=0,i=0,t;
    const tick=()=>{const s=HERO_EXAMPLES[ex];if(i<=s.length){setQ(s.slice(0,i));i++;t=setTimeout(tick,i===1?900:42);}else t=setTimeout(()=>{ex=(ex+1)%HERO_EXAMPLES.length;i=0;tick();},2600);};
    tick();return()=>clearTimeout(t);},[auto]);
  const stop=()=>{if(auto){setAuto(false);setQ("");}};
  const chips=parseQuery(q);
  return (<div style={{display:"flex",flexDirection:"column",gap:14,width:720,maxWidth:"100%",flex:"none"}}>
    <form data-r="hero-search" onSubmit={e=>{e.preventDefault();go("signup");}} onMouseDown={stop} onFocusCapture={stop} style={{display:"flex",gap:8,width:"100%"}}>
      <TextInput aria-label="Describe the job you want" value={q} onChange={e=>setQ(e.target.value)} placeholder="Describe the job you want, in your own words" iconLeft={<Icon name="search"/>} style={{flex:"1 1 0",minWidth:0,width:"100%"}} />
      <Button type="submit">Search jobs</Button>
    </form>
    <div aria-live="polite" style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:6,minHeight:24}}>
      <span style={{fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.5px",color:"var(--color-ink-tertiary)",marginRight:4}}>{chips.length?"FILTERS":"TYPED IN, FILTERED OUT"}</span>
      {chips.map(([k,v])=><span key={k+v} className="ge-fade" style={{display:"inline-flex"}}><Chip label={k}>{v}</Chip></span>)}
    </div>
  </div>);
}
function HeroSearchV1({go}){
  const { Button, TextInput } = DS;
  return (<div style={{display:"flex",gap:8,width:720,maxWidth:"100%"}}>
    <TextInput placeholder="e.g. React internships in Bengaluru, remote-friendly" iconLeft={<Icon name="search"/>} style={{flex:"1 1 0",minWidth:0,width:"100%"}} />
    <Button onClick={()=>go("signup")}>Search jobs</Button>
  </div>);
}
function Home({go}){
  const { StatusBadge, Card } = DS;
  const hero=React.useRef(null),mock=React.useRef(null);
  useScrollFx(hero,(el)=>{const p=Math.min(1,Math.max(0,scrollY/520));el.style.opacity=1-p*0.7;el.style.transform="translateY("+(-p*40)+"px) scale("+(1-p*0.04)+")";});
  useScrollFx(mock,(el,r,vh)=>{const p=Math.min(1,Math.max(0,(vh-r.top)/(vh*0.75)));el.style.transform="perspective(1400px) rotateX("+((1-p)*16).toFixed(2)+"deg) scale("+(0.9+p*0.1).toFixed(3)+")";el.style.opacity=0.35+p*0.65;});
  const frame=ge("C01")
    ? <Card variant="screenshot" style={{display:"block"}}><div data-r="screenshot"><ProductMock/></div></Card>
    : <div style={{background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)",borderRadius:16,padding:24}}><ProductMock/></div>;
  return (<div>
    <Section style={{paddingTop:120}} rule={false}>
      <div ref={hero} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:24,transformOrigin:"0 0"}}>
        <StatusBadge tone="success">40,000+ verified roles this week</StatusBadge>
        <Rule><HeroHeadline/></Rule>
        <Rule><p style={{margin:0,fontSize:18,lineHeight:1.5,letterSpacing:"-0.1px",color:"var(--color-ink-muted)",maxWidth:560}}>Search in plain English, get a tailored resume and an outreach email for every match, and practise the interview before it happens.</p></Rule>
        <Rule style={{alignSelf:"stretch"}}><div style={{padding:"24px 0"}}>{ge("C12")?<HeroSearch go={go}/>:<HeroSearchV1 go={go}/>}</div></Rule>
      </div>
    </Section>
    <Section style={{paddingTop:72}}>
      <div ref={mock} style={{transformOrigin:"50% 0",willChange:"transform"}}>{frame}</div>
    </Section>
    <HowItWorks/>
    <SourceCarousel/>
    <Features/>
    <SelfHost/>
    <Testimonials/>
    <PricingSection go={go}/>
    <FAQ/>
    <FinalCTA go={go}/>
  </div>);
}
window.Home=Home;

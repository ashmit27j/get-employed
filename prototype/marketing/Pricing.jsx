function CloneBox(){
  const cmd="git clone "+REPO_URL+".git";
  const [ok,setOk]=React.useState(false);
  const copy=()=>{try{navigator.clipboard.writeText(cmd);}catch(e){}setOk(true);setTimeout(()=>setOk(false),1600);};
  return (<div style={{marginTop:16,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",padding:"16px 20px",borderRadius:12,background:"var(--color-surface-1)",border:"1px solid var(--color-hairline)"}}>
    <span style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color:"var(--color-ink-muted)"}}><Icon name="github" size={16}></Icon>Self-host from GitHub</span>
    <code style={{flex:1,minWidth:240,fontFamily:"var(--font-mono)",fontSize:13,color:"var(--color-ink)",padding:"8px 12px",borderRadius:8,background:"var(--color-canvas)",border:"1px solid var(--color-hairline)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:"var(--color-ink-tertiary)"}}>$ </span>{cmd}</code>
    <button onClick={copy} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,color:ok?"var(--color-primary)":"var(--color-ink-subtle)",padding:"8px 10px",borderRadius:8}}><Icon name={ok?"check":"copy"} size={14}></Icon>{ok?"Copied":"Copy"}</button>
  </div>);
}
function PricingSection({go,page}){
  const { PillTabs, PricingCard } = DS;
  const [p,setP]=React.useState("Yearly");
  const y=p==="Yearly";
  return (<Section id="pricing" style={page?{paddingTop:120,paddingBottom:120}:undefined}>
    <Reveal><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,textAlign:"center",marginBottom:48}}>
      <Eyebrow>Pricing</Eyebrow>
      <H2>Free to start. Pay to go unlimited.</H2>
      <PillTabs label="Billing period" options={["Monthly","Yearly"]} value={p} onChange={setP} />
    </div></Reveal>
    <Reveal delay={0.08}>
      <div data-r="grid3" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16,alignItems:"stretch"}}>
        <PricingCard tier="Free" price="₹0" period="" description="For getting started" cta="Start free" onSelect={()=>go("signup")} features={["5 saved searches","20 tailored resumes a month","50 outreach emails a month","1 mock interview"]} />
        <PricingCard tier="Pro" price={y?"₹299":"₹399"} description={ge("C10")?(y?"₹3,588 billed yearly · save 25%":"Billed monthly · cancel any time"):(y?"Billed yearly":"Billed monthly")} featured cta="Upgrade to Pro" onSelect={()=>go("signup")} features={["Unlimited searches and resumes","Unlimited outreach emails","Unlimited mock interviews with camera feedback","Salary intelligence","Career assistant chat"]} />
        <PricingCard tier="Self-host" price="₹0" period={ge("C10")?"+ your own API costs":""} description="Open source, your own API keys" cta="View on GitHub" onSelect={()=>window.open(REPO_URL,"_blank")} features={["Everything in Pro","No usage limits","Runs with docker compose","Your data stays on your machine"]} />
      </div>
      <CloneBox/>
    </Reveal>
  </Section>);
}
function Pricing({go}){return <PricingSection go={go} page/>;}
Object.assign(window,{Pricing,PricingSection,CloneBox});

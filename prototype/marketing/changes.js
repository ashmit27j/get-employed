/* Review changes — one entry per isolated edit to the marketing mockup.
   To keep a change permanently: leave default:true. To roll it back: set default:false (or toggle it in the on-page panel).
   Each id is searched in the code as ge("Cxx") (JS) or html.cxx (CSS), so a change can also be deleted by hand. */
window.GE_CHANGES=[
 {id:"C01",area:"Design system",title:"Adopt rebuilt design system v2",why:"Swaps the v1 bundle for design-system/ (one token file, components that match this page). Also snaps one-off values to the scale (radius 10→8, 14→16; type 17→16/18, 15→16) and fixes an undefined --font-sans that made the ATS row render in mono.",default:true},
 {id:"C02",area:"Accessibility",title:"Tertiary text meets 4.5:1",why:"ink-tertiary #656B73 measured 3.7:1 on the canvas and 3.5:1 on cards; it carries step labels, timestamps and legal copy. Raised to #7B8189 (4.9:1 / 4.6:1). Hierarchy against ink-subtle is kept.",default:true},
 {id:"C03",area:"Accessibility",title:"Keyboard and screen-reader pass",why:"Unstyled buttons (FAQ, tour tabs, copy) had no focus ring. Adds focus-visible rings, aria-expanded on FAQ, tab semantics on the product tour, a 32px pause target, and one stable label for the animated headline so readers don't hear it rewrite itself.",default:true},
 {id:"C04",area:"Layout",title:"Responsive breakpoints",why:"Every grid was fixed at 2–3 columns and the display type at 80–104px, so the page broke under ~1000px. Grids step 3→2→1 at 1024/768, split sections stack, display type scales with the viewport, nav links collapse.",default:true},
 {id:"C05",area:"Copy",title:"Hero headline lands on a promise",why:"The rewrite animation ended on 'GetEmployed Today' — the brand name plus a dangling word. It now ends on 'Get employed. Skip the legwork.', which says what the product does for you.",default:true},
 {id:"C06",area:"Content",title:"Product tour matches the audience",why:"The tour showed EU/US product designers in dollars while every other section talks to Indian engineers in ₹ LPA. Roles, companies, salaries and alerts now match the rest of the page.",default:true},
 {id:"C07",area:"Navigation",title:"Nav links that go somewhere",why:"'Jobs' and 'Companies' both dropped you on the home page. Replaced with 'How it works' and 'Self-host', which scroll to real sections.",default:true},
 {id:"C08",area:"Copy",title:"Testimonials heading",why:"'From others like you:' ended in a colon and read as a fragment. Now 'From candidates like you'.",default:true},
 {id:"C09",area:"Copy",title:"Final CTA follows the voice rules",why:"'Get Employed Now!' broke two content rules (Title Case, exclamation mark). Now 'Get employed.' with the same letter animation and highlight.",default:true},
 {id:"C10",area:"Pricing",title:"Pricing says what you pay",why:"Pro yearly showed ₹299 with no total; Self-host and Free both read ₹0. Pro now shows the yearly total and saving, Self-host says you bring your own API costs.",default:true},
 {id:"C11",area:"Footer",title:"Footer lists the real product",why:"The footer advertised an employer side (Post a job, Talent search, Hiring plans) and a blog that don't exist. Columns now map to the product, the open-source repo and the company.",default:true},
 {id:"C12",area:"Bold direction",title:"The hero search is the demo",why:"Instead of a static input, the hero parses whatever you type into filter chips live (role, skill, location, salary, experience, type) — the product's core mechanic, shown in the first viewport. It types its own examples until you click in.",default:true}
];
(function(){
 const KEY="ge-review-changes";
 let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){}
 const state={};GE_CHANGES.forEach(c=>state[c.id]=c.id in saved?!!saved[c.id]:c.default);
 window.ge=id=>!!state[id];
 const apply=()=>{const html=document.documentElement;GE_CHANGES.forEach(c=>html.classList.toggle(c.id.toLowerCase(),state[c.id]));
   const n=document.getElementById("ds-v2"),o=document.getElementById("ds-v1");if(n)n.disabled=!state.C01;if(o)o.disabled=!!state.C01;};
 const set=(id,v)=>{state[id]=v;saved[id]=v;try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}apply();render();dispatchEvent(new Event("ge-changes"));};
 apply();
 let open=false,root;
 function render(){
  if(!root)return;const on=GE_CHANGES.filter(c=>state[c.id]).length;
  root.innerHTML="";
  const pill=document.createElement("button");pill.type="button";pill.setAttribute("aria-expanded",open);
  pill.style.cssText="all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:9999px;background:#16191E;border:1px solid #333941;color:#E4E7EA;font:500 13px/1 Inter,system-ui,sans-serif;align-self:flex-start";
  pill.innerHTML='<span style="width:6px;height:6px;border-radius:50%;background:#7B9BDB"></span>Review changes <span style="font-family:JetBrains Mono,monospace;color:#8B9199">'+on+"/"+GE_CHANGES.length+"</span>";
  pill.onclick=()=>{open=!open;render();};
  if(open){
   const p=document.createElement("div");
   p.style.cssText="width:380px;max-height:min(70vh,640px);overflow:auto;background:#0F1216;border:1px solid #333941;border-radius:12px;box-shadow:inset 0 1px 0 rgba(238,243,255,.07);font:13px/1.45 Inter,system-ui,sans-serif;color:#C4C8CE";
   const head=document.createElement("div");head.style.cssText="position:sticky;top:0;background:#0F1216;display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #252A30";
   head.innerHTML='<span style="flex:1;color:#E4E7EA;font-weight:500">Each change is independent</span>';
   [["All on",true],["All off",false]].forEach(([l,v])=>{const b=document.createElement("button");b.type="button";b.textContent=l;b.style.cssText="all:unset;cursor:pointer;padding:4px 8px;border-radius:6px;border:1px solid #252A30;color:#C4C8CE;font-size:12px";b.onclick=()=>{GE_CHANGES.forEach(c=>{state[c.id]=v;saved[c.id]=v;});try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}apply();render();dispatchEvent(new Event("ge-changes"));};head.appendChild(b);});
   p.appendChild(head);
   GE_CHANGES.forEach(c=>{
    const row=document.createElement("label");row.style.cssText="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:12px 14px;border-bottom:1px solid #252A30;cursor:pointer";
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=state[c.id];cb.style.cssText="margin:2px 0 0;accent-color:#7B9BDB;width:14px;height:14px";cb.onchange=()=>set(c.id,cb.checked);
    const t=document.createElement("div");t.innerHTML='<div style="display:flex;gap:8px;align-items:baseline"><span style="font-family:JetBrains Mono,monospace;font-size:11px;color:#8B9199">'+c.id+'</span><span style="color:#E4E7EA;font-weight:500">'+c.title+'</span></div><div style="font-size:11px;color:#8B9199;letter-spacing:.4px;text-transform:uppercase;margin-top:2px">'+c.area+'</div><div style="margin-top:4px;color:#8B9199">'+c.why+"</div>";
    row.appendChild(cb);row.appendChild(t);p.appendChild(row);});
   root.appendChild(p);
  }
  root.appendChild(pill);
 }
 addEventListener("DOMContentLoaded",()=>{if(/[?&]review=0/.test(location.search))return;root=document.createElement("div");root.setAttribute("aria-label","Review changes");root.style.cssText="position:fixed;left:16px;bottom:16px;z-index:200;display:flex;flex-direction:column;gap:8px";document.body.appendChild(root);render();});
})();

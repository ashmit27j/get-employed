(function(){
const USER={name:"Ashmit Jain",first:"Ashmit",email:"ashmit27j@gmail.com",college:"MPSTME, NMIMS",degree:"B.Tech Computer Engineering",grad:"2027"};
const JOBS=[
 {id:"j1",title:"Backend Engineer I",co:"Razorpay",loc:"Bengaluru",mode:"Hybrid",exp:"0–2 yrs",score:92,why:"Your Go and Kafka projects cover 4 of 5 listed requirements.",missing:["Kubernetes"],skills:["Go","Kafka","PostgreSQL","gRPC","Kubernetes"],salary:{type:"stated",min:18,max:26},posted:"2h",src:"Careers page",contact:{name:"Ananya Krishnan",role:"Engineering Manager, Payments",email:"ananya.k@razorpay.com",conf:94,status:"found"}},
 {id:"j2",title:"SDE-1, Platform",co:"Zepto",loc:"Mumbai",mode:"On-site",exp:"0–1 yrs",score:88,why:"Strong match on Node.js and Redis; the DSA emphasis suits your LeetCode history.",missing:["Terraform"],skills:["Node.js","Redis","TypeScript","AWS","Terraform"],salary:{type:"est",min:16,max:22,conf:78,n:142},posted:"5h",src:"LinkedIn",contact:{name:"Karthik Rao",role:"Senior SDE",email:"karthik@zepto.co",conf:81,status:"found"}},
 {id:"j3",title:"Frontend Engineer",co:"CRED",loc:"Bengaluru",mode:"Hybrid",exp:"0–2 yrs",score:84,why:"React and design-system work in your Synoris internship lines up well.",missing:["GraphQL","Testing Library"],skills:["React","TypeScript","GraphQL","Testing Library","CSS"],salary:{type:"est",min:20,max:28,conf:64,n:58},posted:"8h",src:"Naukri",contact:{name:"Meera Pillai",role:"Design Engineer",email:"meera.p@cred.club",conf:62,status:"found"}},
 {id:"j4",title:"Software Engineer, API",co:"Postman",loc:"Remote",mode:"Remote",exp:"0–2 yrs",score:81,why:"Matches on REST API design and Node.js. Remote-first, as your search asked.",missing:["OpenAPI"],skills:["Node.js","REST","OpenAPI","MongoDB"],salary:{type:"stated",min:22,max:30},posted:"1d",src:"Careers page",contact:{status:"searching"}},
 {id:"j5",title:"Graduate Engineer Trainee",co:"Freshworks",loc:"Chennai",mode:"On-site",exp:"Fresher",score:77,why:"Graduate programme open to the 2027 batch, with a Java and Python track.",missing:["Spring Boot"],skills:["Java","Python","SQL","Spring Boot"],salary:{type:"stated",min:12,max:14},posted:"1d",src:"Indeed",contact:{name:"Priya Menon",role:"Campus Recruiter",email:"priya.menon@freshworks.com",conf:88,status:"found"}},
 {id:"j6",title:"iOS Engineer",co:"Groww",loc:"Bengaluru",mode:"Hybrid",exp:"0–2 yrs",score:74,why:"Your SwiftUI app Nosh is relevant, but they ask for UIKit depth.",missing:["UIKit","Combine"],skills:["Swift","SwiftUI","UIKit","Combine"],salary:{type:"est",min:18,max:24,conf:71,n:96},posted:"2d",src:"Wellfound",contact:{status:"none"}},
 {id:"j7",title:"Security Engineer Intern",co:"BrowserStack",loc:"Mumbai",mode:"On-site",exp:"Internship",score:70,why:"XSS and CSRF work stands out. Six-month internship with a PPO track.",missing:["Burp Suite","OWASP ZAP"],skills:["Web security","Python","Burp Suite"],salary:{type:"stated",min:6,max:7.2},posted:"2d",src:"Internshala",contact:{name:"Rahul Desai",role:"Security Lead",email:"rahul.d@browserstack.com",conf:57,status:"found"}},
 {id:"j8",title:"Data Engineer I",co:"PhonePe",loc:"Pune",mode:"Hybrid",exp:"0–2 yrs",score:63,why:"SQL is a match, but Spark and Airflow are core to this role.",missing:["Spark","Airflow","Scala"],skills:["SQL","Spark","Airflow","Scala"],salary:{type:"est",min:15,max:21,conf:55,n:31},posted:"3d",src:"Glassdoor",contact:{status:"none"}},
];
const SEARCHES=[
 {id:"s1",q:"Backend roles in Bengaluru, 12 LPA+, Go or Node",chips:[["map-pin","Bengaluru"],["wallet","≥ ₹12 LPA"],["code","Go"],["code","Node.js"],["briefcase","Backend"]],freq:"Hourly",active:true,newCount:6,last:"12 min ago"},
 {id:"s2",q:"Remote frontend jobs for freshers, React",chips:[["globe","Remote"],["graduation-cap","0–1 yrs"],["code","React"],["briefcase","Frontend"]],freq:"Daily",active:true,newCount:3,last:"Today, 9:00"},
 {id:"s3",q:"Security internships in Mumbai or Pune",chips:[["map-pin","Mumbai"],["map-pin","Pune"],["graduation-cap","Internship"],["briefcase","Security"]],freq:"Weekly",active:false,newCount:0,last:"Mon, 9:00"},
];
const EMAILS=[
 {id:"e1",job:"j1",to:"Ananya Krishnan",role:"Engineering Manager, Payments",co:"Razorpay",email:"ananya.k@razorpay.com",conf:94,how:"Verified by SMTP handshake",status:"draft",subject:"Backend Engineer I: Go + Kafka projects",body:"Hi Ananya,\n\nI saw the Backend Engineer I opening on the Payments team. I've built a Go service that processes event streams through Kafka for a college fest app with 12k users, and I've been reading about how Razorpay handles idempotent payment retries.\n\nI've attached a resume tailored to the role. Would you be open to a 15-minute chat, or could you point me to the right person?\n\nThanks,\nAshmit"},
 {id:"e2",job:"j2",to:"Karthik Rao",role:"Senior SDE",co:"Zepto",email:"karthik@zepto.co",conf:81,how:"Pattern match (first@domain), MX verified",status:"draft",subject:"SDE-1 Platform: Node + Redis",body:"Hi Karthik,\n\nI'm a final-year Computer Engineering student at NMIMS, applying for SDE-1 on the Platform team. My recent project caches catalogue lookups in Redis and dropped p95 latency from 480ms to 90ms.\n\nWould you be up for a quick chat about the team?\n\nBest,\nAshmit"},
 {id:"e3",job:"j3",to:"Meera Pillai",role:"Design Engineer",co:"CRED",email:"meera.p@cred.club",conf:62,how:"Pattern match (first.l@domain), unverified",status:"draft",subject:"Frontend Engineer: design-system work",body:"Hi Meera,\n\nI've admired CRED's interface work for a while. During my internship at Synoris I built a small React component library with tokens and docs.\n\nI'd love to hear how the frontend team works.\n\nThanks,\nAshmit"},
 {id:"e4",job:"j5",to:"Priya Menon",role:"Campus Recruiter",co:"Freshworks",email:"priya.menon@freshworks.com",conf:88,how:"Found on company page",status:"draft",subject:"Graduate Engineer Trainee, 2027 batch",body:"Hi Priya,\n\nI'm writing about the Graduate Engineer Trainee programme for the 2027 batch. I've worked in Java and Python across three internships and projects.\n\nCould you tell me more about the selection timeline?\n\nRegards,\nAshmit"},
 {id:"e5",co:"Atlassian",to:"Vikram Shah",role:"Engineering Manager",email:"vshah@atlassian.com",conf:91,status:"replied",subject:"Graduate SWE: Jira Cloud",sent:"Sep 21",reply:"Thanks Ashmit, forwarding to our campus team. Expect a note this week."},
 {id:"e6",co:"Swiggy",to:"Neha Gupta",role:"SDE-2",email:"neha.gupta@swiggy.in",conf:84,status:"opened",subject:"SDE-1 Consumer: React Native",sent:"Sep 22"},
 {id:"e7",co:"Juspay",to:"Arjun N",role:"Hiring Manager",email:"arjun@juspay.in",conf:58,status:"bounced",subject:"Backend Engineer: Haskell curiosity",sent:"Sep 22",err:"Mailbox not found (550)"},
 {id:"e8",co:"Ola",to:"Sanjana Rao",role:"Tech Recruiter",email:"sanjana.rao@olacabs.com",conf:86,status:"sent",subject:"Graduate Engineer, Maps",sent:"Sep 23"},
];
const STAGES=[["saved","Saved"],["applied","Applied"],["interview","Interview"],["offer","Offer"],["rejected","Rejected"]];
const APPS=[
 {id:"a1",stage:"saved",title:"Backend Engineer I",co:"Razorpay",score:92,meta:"Saved 2h ago",flags:["tailored"]},
 {id:"a2",stage:"saved",title:"Software Engineer, API",co:"Postman",score:81,meta:"Saved yesterday",flags:[]},
 {id:"a3",stage:"saved",title:"iOS Engineer",co:"Groww",score:74,meta:"Saved 2d ago",flags:[]},
 {id:"a4",stage:"applied",title:"SDE-1, Platform",co:"Zepto",score:88,meta:"Applied Sep 22",flags:["tailored","emailed"]},
 {id:"a5",stage:"applied",title:"SDE-1, Consumer",co:"Swiggy",score:79,meta:"Applied Sep 21",flags:["tailored","emailed","opened"]},
 {id:"a6",stage:"applied",title:"Graduate Engineer, Maps",co:"Ola",score:72,meta:"Applied Sep 23",flags:["emailed"]},
 {id:"a7",stage:"interview",title:"Graduate SWE",co:"Atlassian",score:86,meta:"Round 1 · Sep 29, 11:00",flags:["tailored","replied"]},
 {id:"a8",stage:"interview",title:"Frontend Engineer",co:"CRED",score:84,meta:"Take-home due Sep 27",flags:["tailored"]},
 {id:"a9",stage:"offer",title:"SWE Intern → PPO",co:"Digitas India",score:80,meta:"₹1.2L/mo · respond by Oct 3",flags:["replied"]},
 {id:"a10",stage:"rejected",title:"Backend Engineer",co:"Juspay",score:66,meta:"Closed Sep 20",flags:[]},
];
const SESSIONS=[
 {id:"i5",date:"Sep 24",job:"Backend Engineer I · Razorpay",type:"Technical",dur:"15 min",score:76,r:[82,74,68,79]},
 {id:"i4",date:"Sep 17",job:"Graduate SWE · Atlassian",type:"Behavioural",dur:"15 min",score:71,r:[78,66,64,74]},
 {id:"i3",date:"Sep 10",job:"SDE-1 · Zepto",type:"Technical",dur:"15 min",score:64,r:[70,62,54,68]},
 {id:"i2",date:"Sep 03",job:"Frontend Engineer · CRED",type:"Technical",dur:"15 min",score:58,r:[62,60,51,58]},
 {id:"i1",date:"Aug 27",job:"General · SWE",type:"Behavioural",dur:"15 min",score:52,r:[60,48,46,52]},
];
const RUBRIC=["Communication","Technical accuracy","Structure","Confidence"];
const PROFILE={
 contact:{name:"Ashmit Jain",email:"ashmit27j@gmail.com",phone:"+91 98200 12345",loc:"Mumbai, IN",links:["github.com/ashmit27j","linkedin.com/in/ashmitjain"]},
 summary:"Computer engineering student building backend services and iOS apps. Shipped a Go ticketing backend for a 3-day college fest and a SwiftUI app during an internship at Digitas.",
 education:[{school:"MPSTME, NMIMS University",degree:"B.Tech in Computer Engineering",dates:"2024 – 2027",score:"CGPA 3.78 / 4.00"},{school:"MPSTME, NMIMS University",degree:"Diploma in Computer Engineering",dates:"2021 – 2024",score:"CGPA 3.85 / 4.00"}],
 experience:[{role:"iOS Development Intern",co:"Digitas India",dates:"Jun 2025 – Jul 2025",bullets:["Built Nosh, a SwiftUI meal-planning app using MVVM architecture.","Worked with the design team to ship onboarding and settings screens."]},
  {role:"Web & UI/UX Development Intern",co:"Synoris Information Systems",dates:"Jun 2024 – Jul 2024",bullets:["Designed and developed ShipEasy's responsive web interfaces and prototypes using React and Figma, improving UI consistency across the website.","Worked on backend APIs for college fest app."]}],
 projects:[{name:"FestFlow",stack:"Go, Kafka, PostgreSQL",bullets:["Event ticketing backend for a 3-day college fest.","Implemented a queue so ticket scans don't drop during peak entry."]}],
 skills:{Languages:["Go","TypeScript","Python","Swift","Java","SQL"],Frameworks:["React","Next.js","SwiftUI","Node.js"],Tools:["Kafka","PostgreSQL","Redis","Docker","Git","Figma"]},
 certifications:[{name:"AWS Certified Cloud Practitioner",issuer:"Amazon Web Services",date:"Mar 2025"},{name:"Meta Front-End Developer",issuer:"Coursera",date:"Nov 2024"}],
 achievements:["Finalist, Smart India Hackathon 2024, software track.","Top 8% in LeetCode weekly contests (rating 1,890)."],
 leadership:[{role:"Technical Lead",org:"Google Developer Student Club, MPSTME",dates:"Jul 2024 – Apr 2025",bullets:["Ran 6 hands-on workshops on Git, React and Go for 300+ students."]}],
};
const DIFFS=[
 {id:"d1",sec:"Experience · Synoris",old:"Worked on backend APIs for college fest app.",neu:"Built a Go REST API serving 12k users during a 3-day college fest, with idempotent ticket-scan endpoints.",why:"Adds scale and the ‘idempotent’ keyword from the JD."},
 {id:"d2",sec:"Experience · Synoris",old:"Designed and developed ShipEasy's responsive web interfaces and prototypes using React and Figma, improving UI consistency across the website.",neu:"Shipped 14 responsive React screens for ShipEasy and cut UI inconsistencies by consolidating 40+ one-off styles into shared tokens.",why:"Quantifies impact; the JD is backend-leaning, so this is shortened."},
 {id:"d3",sec:"Projects · FestFlow",old:"Implemented a queue so ticket scans don't drop during peak entry.",neu:"Designed a Kafka-backed queue that absorbed 900 scans/min at peak entry with zero dropped events.",why:"Matches ‘Kafka’ and ‘high-throughput’ in the JD."},
 {id:"d4",sec:"Skills",old:"Tools: Kafka, PostgreSQL, Redis, Docker, Git, Figma",neu:"Tools: Kafka, PostgreSQL, Redis, Docker, gRPC, Git",why:"Surfaces gRPC (used in FestFlow); drops Figma for a backend role."},
];

window.GEData={USER,JOBS,SEARCHES,EMAILS,STAGES,APPS,SESSIONS,RUBRIC,PROFILE,DIFFS};
})();

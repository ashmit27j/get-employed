function Changelog(){
  const { ChangelogRow } = DS;
  return (<Section style={{paddingTop:120,paddingBottom:96,maxWidth:880}}><div data-r="changelog">
    <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:32}}><Eyebrow>Changelog</Eyebrow><H2>What's new</H2></div>
    <ChangelogRow version="v2.4.0" date="Sep 18, 2026" title="Salary insights" tag="New" items={["Median pay and range on every listing","Filter search results by salary band"]} />
    <ChangelogRow version="v2.3.2" date="Sep 04, 2026" title="Tracker reminders" items={["Follow-up nudges after 7 days in Applied","Snooze a role for a week"]} />
    <ChangelogRow version="v2.3.0" date="Aug 21, 2026" title="Verified employers" items={["Listings are checked against employer careers pages","Expired roles removed daily"]} />
  </div></Section>);
}
window.Changelog=Changelog;

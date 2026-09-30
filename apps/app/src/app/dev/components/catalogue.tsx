"use client";
import { useState, type ReactNode } from "react";
import {
  Accordion,
  Avatar,
  Button,
  Card,
  ChatAction,
  ChatBubble,
  Chip,
  CoLogo,
  CodeWindow,
  Combobox,
  ConfidenceMeter,
  DiffBlock,
  DiffText,
  Dropdown,
  Dropzone,
  EmptyState,
  Eyebrow,
  Highlight,
  Icon,
  IconButton,
  InlineSelect,
  Kbd,
  MatchRing,
  MetricReadout,
  Modal,
  PageHeader,
  Panel,
  PillTabs,
  PricingCard,
  QuotaBar,
  SalaryBadge,
  ScoreBar,
  SectionHeading,
  Segmented,
  Select,
  SortSelect,
  SourceChip,
  StageCard,
  StatusBadge,
  StepList,
  Tag,
  TestimonialCard,
  TextArea,
  TextInput,
  TimePicker,
  TimeRangePicker,
  Toggle,
  ToneBadge,
  Wordmark,
  type DiffStatus,
  type DropzoneState,
  type Feedback,
} from "@ge/ui";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-hairline pt-8">
      <h2 className="m-0 text-title font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

const COLORS = [
  "canvas",
  "surface-1",
  "surface-2",
  "surface-3",
  "surface-4",
  "hairline",
  "hairline-strong",
  "primary",
  "primary-hover",
  "primary-pressed",
  "ink",
  "ink-muted",
  "ink-subtle",
  "ink-tertiary",
  "success",
  "paper",
];

export function Catalogue() {
  const [chips, setChips] = useState(["Bengaluru", "≥ ₹12 LPA", "Go", "Node.js"]);
  const [remote, setRemote] = useState(false);
  const [diff, setDiff] = useState<DiffStatus>("pending");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [modal, setModal] = useState(false);
  const [upload, setUpload] = useState<DropzoneState>("idle");

  return (
    <main className="mx-auto box-border flex max-w-[1120px] flex-col gap-10 px-8 pt-10 pb-24">
      <PageHeader
        title="Components"
        sub="Every @ge/ui component with the prototype's data. Source of truth for tokens: packages/ui/src/theme.css."
      >
        <Button variant="secondary" href="/">
          Back
        </Button>
      </PageHeader>

      <Section title="Tokens">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {COLORS.map((c) => (
            <div key={c} className="flex flex-col gap-1.5">
              <span
                className="h-12 rounded-md border border-hairline"
                style={{ background: `var(--color-${c})` }}
              />
              <span className="font-mono text-caption text-ink-subtle">{c}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-headline font-semibold">Headline 28</span>
          <span className="text-title font-medium">Title 22</span>
          <span className="text-lead">Lead 18</span>
          <span className="text-body">Body 16</span>
          <span className="text-small">Small 14</span>
          <span className="text-ui">UI 13</span>
          <span className="text-caption">Caption 12</span>
          <Eyebrow>Eyebrow</Eyebrow>
          <span className="font-mono text-ui">JetBrains Mono · ₹18–26 LPA · v2.4.0</span>
        </div>
      </Section>

      <Section title="Brand">
        <Row>
          <Wordmark />
          <Wordmark size={24} />
          <Avatar name="Ashmit Jain" />
          <CoLogo name="Razorpay" />
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </Row>
        <SectionHeading size="md">
          Built <Highlight>for engineers</Highlight>
        </SectionHeading>
      </Section>

      <Section title="Buttons">
        <Row>
          <Button>Get started</Button>
          <Button variant="secondary">Sign in</Button>
          <Button variant="tertiary">Cancel</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm" iconLeft={<Icon name="send" size={14} />}>
            Send
          </Button>
          <Button size="lg">Search jobs</Button>
          <IconButton icon="settings" title="Settings" />
          <IconButton icon="volume-2" title="Reading" active />
        </Row>
      </Section>

      <Section title="Choices">
        <Row>
          <PillTabs label="Billing period" options={["Monthly", "Yearly"]} defaultValue="Yearly" />
          <Segmented
            label="View"
            options={[
              { value: "Active", count: 9 },
              { value: "All", count: 10 },
              { value: "Closed", count: 1 },
            ]}
          />
          <Segmented
            label="Search mode"
            options={["Search", { value: "Deep Search", emphasis: true }]}
          />
          <Toggle label="Remote only" on={remote} onChange={setRemote} />
        </Row>
        <Row>
          {chips.map((c) => (
            <Chip key={c} icon="map-pin" onRemove={() => setChips(chips.filter((x) => x !== c))}>
              {c}
            </Chip>
          ))}
          <Chip icon="globe" active={remote} onClick={() => setRemote(!remote)}>
            Remote
          </Chip>
          <Chip dashed icon="plus" onClick={() => setChips([...chips, "React"])}>
            Add filter
          </Chip>
        </Row>
      </Section>

      <Section title="Fields">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <TextInput
            label="Search"
            placeholder="Backend roles in Bengaluru, 12 LPA+"
            iconLeft={<Icon name="search" size={16} />}
            hint="Plain English works"
          />
          <Select label="Experience" options={["Fresher", "0–1 yrs", "0–2 yrs"]} />
          <Dropdown
            label="Alert frequency"
            options={["Hourly", "Daily", "Weekly"]}
            placeholder="Choose"
          />
          <Combobox
            label="Location"
            options={["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Chennai", "Remote"]}
            placeholder="City or Remote"
          />
          <TextArea label="Note" placeholder="Anything the recruiter should know" rows={3} />
        </div>
        <Row>
          <SortSelect value="Match" options={["Match", "Newest", "Salary"]} />
          <InlineSelect label="Sort resumes" options={["Last edited", "ATS score", "Company"]} />
          <TimePicker label="Digest time" />
          <TimeRangePicker label="Quiet hours" allowOff />
        </Row>
      </Section>

      <Section title="Status">
        <Row>
          <StatusBadge>1,284 roles today</StatusBadge>
          <StatusBadge tone="success">Verified</StatusBadge>
          <StatusBadge tone="accent">Open source</StatusBadge>
          {(["neutral", "primary", "success", "warning", "danger", "teal", "violet"] as const).map(
            (t) => (
              <ToneBadge key={t} tone={t}>
                {t}
              </ToneBadge>
            ),
          )}
          <Tag label="Stack">Go</Tag>
        </Row>
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <QuotaBar label="Outreach emails" used={38} max={50} note="Resets Oct 1" />
          <QuotaBar label="Tailored resumes" used={20} max={20} compact />
        </div>
        <StepList
          steps={[
            { title: "Import your resume", body: "PDF or DOCX", meta: "1 min" },
            { title: "Review your profile", body: "Fix anything we misread" },
            { title: "Run your first search", meta: "Done" },
          ]}
        />
        <EmptyState
          icon="inbox"
          title="No drafts waiting"
          body="Drafts appear here when you ask for outreach on a job."
        >
          <Button variant="secondary" size="sm" href="/jobs">
            Browse jobs
          </Button>
        </EmptyState>
      </Section>

      <Section title="Scores">
        <Row>
          <MatchRing value={92} />
          <MatchRing value={74} />
          <MatchRing value={52} />
          <MatchRing value={88} size={96} caption="Strong match on Node.js and Redis" />
          <ConfidenceMeter value={94} label="SMTP verified" />
          <ConfidenceMeter value={62} />
        </Row>
        <Row>
          <SalaryBadge min={18} max={26} />
          <SalaryBadge type="est" min={16} max={22} confidence={78} samples={142} />
          <SalaryBadge type="est" min={20} max={28} confidence={64} samples={58} quiet />
        </Row>
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <ScoreBar label="ATS score" value={62} gain={17} />
          <ScoreBar label="Communication" value={82} />
        </div>
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <MetricReadout label="Average score" value={76} unit="/ 100" trend={5} bar={76} />
          <MetricReadout label="Sessions" value={5} hint="Last 5 weeks" />
          <MetricReadout label="Structure" value={68} trend={-2} bar={68} />
        </div>
      </Section>

      <Section title="Containers">
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
          <Card eyebrow="Search" title="Plain English in, filters out">
            <span className="text-small text-ink-muted">
              Type what you want. We parse it into chips.
            </span>
          </Card>
          <Card variant="featured" title="Featured">
            <span className="text-small text-ink-muted">surface-2 with the strong hairline.</span>
          </Card>
          <Card interactive title="Interactive">
            <span className="text-small text-ink-muted">Hover lifts one surface step.</span>
          </Card>
        </div>
        <Panel
          title="Contact"
          sub="Found on the company page"
          icon="user-search"
          meta="Updated 2h ago"
          status="Found"
          tone="success"
          padded
        >
          <span>Ananya Krishnan · Engineering Manager, Payments</span>
        </Panel>
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          <PricingCard
            tier="Free"
            price="₹0"
            period=""
            description="For getting started"
            cta="Start free"
            features={["5 saved searches", "20 tailored resumes a month"]}
          />
          <PricingCard
            tier="Pro"
            price="₹299"
            description="₹3,588 billed yearly · save 25%"
            featured
            cta="Upgrade to Pro"
            features={["Unlimited searches and resumes", "Career assistant chat"]}
          />
          <TestimonialCard
            quote="The tracker nudged me to follow up with Zepto. That follow-up got me the interview."
            name="Priya S."
            role="SDE-1, Bengaluru"
          />
        </div>
        <CodeWindow>
          {"$ git clone https://github.com/ashmit27j/get-employed.git\n$ docker compose up -d"}
        </CodeWindow>
        <Accordion
          items={[
            { q: "Is it free?", a: "Free to start. Pro removes the limits." },
            { q: "Can I self-host?", a: "Yes. It runs with docker compose and your own API keys." },
          ]}
        />
        <Row>
          <SourceChip name="LinkedIn" icon="si:linkedin" />
          <SourceChip name="Careers pages" icon="building-2" />
          <SourceChip name="Naukri" />
        </Row>
        <Row>
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
        </Row>
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Save search"
          sub="We'll check for new roles and tell you."
          footer={
            <>
              <Button variant="tertiary" onClick={() => setModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModal(false)}>Save</Button>
            </>
          }
        >
          <TextInput label="Name" defaultValue="Backend roles in Bengaluru" />
        </Modal>
      </Section>

      <Section title="Resume diff">
        <p className="m-0 text-small text-ink-muted">
          Built a Go REST API <DiffText kind="remove">for college fest app</DiffText>{" "}
          <DiffText>serving 12k users during a 3-day college fest</DiffText>.
        </p>
        <DiffBlock
          section="Experience · Synoris"
          before="Worked on backend APIs for college fest app."
          after="Built a Go REST API serving 12k users during a 3-day college fest, with idempotent ticket-scan endpoints."
          reason="Adds scale and the ‘idempotent’ keyword from the JD."
          status={diff}
          onAccept={() => setDiff("accepted")}
          onReject={() => setDiff("rejected")}
          onUndo={() => setDiff("pending")}
          onRegenerate={() => {}}
        />
      </Section>

      <Section title="Chat">
        <ChatBubble role="user" time="19:02" userName="Ashmit Jain">
          Draft follow-ups for stale applications
        </ChatBubble>
        <ChatBubble
          time="19:02"
          text="I drafted follow-ups for the two applications with no reply after 7 days."
          feedback={feedback}
          onFeedback={setFeedback}
        >
          <span>
            I drafted follow-ups for the two applications with no reply after 7 days: Zepto and Ola.
          </span>
          <ChatAction
            icon="send"
            title="Drafted 2 follow-up emails"
            detail="Waiting for your approval"
            href="/mailbox"
            cta="Review"
          />
          <ChatAction title="Searching jobs…" status="running" />
        </ChatBubble>
        <ChatBubble streaming>
          <span>Booked a 15-minute technical mock for</span>
        </ChatBubble>
      </Section>

      <Section title="Upload and tracker">
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <Dropzone
            state={upload}
            fileName="ashmit-resume.pdf"
            fileSize="0.4 MB"
            progress={64}
            summary={
              upload === "done"
                ? "Parsed 2 education entries, 2 roles, 1 project, 16 skills"
                : undefined
            }
            onFile={() => setUpload("uploading")}
            onRemove={() => setUpload("idle")}
          />
          <div className="flex flex-col gap-2">
            <StageCard
              title="SDE-1, Platform"
              company="Zepto"
              score={88}
              meta="Applied Sep 22"
              flags={["tailored", "emailed"]}
              href="/tracker"
            />
            <StageCard
              title="Graduate SWE"
              company="Atlassian"
              score={86}
              meta="Round 1 · Sep 29, 11:00"
              flags={["tailored", "replied"]}
            />
          </div>
        </div>
        <Row>
          <Button variant="secondary" size="sm" onClick={() => setUpload("done")}>
            Show parsed state
          </Button>
        </Row>
      </Section>
    </main>
  );
}

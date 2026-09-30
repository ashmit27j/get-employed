import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  Button,
  Chip,
  ConfidenceMeter,
  MatchRing,
  PillTabs,
  QuotaBar,
  SalaryBadge,
  Segmented,
  StageCard,
  Toggle,
  durationLabel,
  scoreTone,
} from "./index";

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("Button", () => {
  it("renders a button by default and a link with href", () => {
    expect(html(<Button>Go</Button>)).toMatch(/^<button[^>]*type="button"/);
    expect(html(<Button href="/jobs">Go</Button>)).toMatch(/^<a[^>]*href="\/jobs"/);
  });

  it("does not render a link when disabled", () => {
    const out = html(
      <Button href="/jobs" disabled>
        Go
      </Button>,
    );
    expect(out).toMatch(/^<button[^>]*disabled/);
  });
});

describe("scores", () => {
  it("colours scores by band", () => {
    expect([scoreTone(92), scoreTone(70), scoreTone(40)]).toEqual(["success", "warning", "danger"]);
  });

  it("MatchRing has an accessible label", () => {
    expect(html(<MatchRing value={88} />)).toContain('aria-label="Match 88 of 100"');
  });

  it("ConfidenceMeter lights bars by confidence", () => {
    const lit = (v: number) =>
      (
        html(<ConfidenceMeter value={v} />).match(/var\(--color-(success|warning|danger)-ink\)/g) ??
        []
      ).length - 1; // one extra for the percentage text
    expect([lit(90), lit(70), lit(40)]).toEqual([3, 2, 1]);
  });

  it("SalaryBadge marks estimates", () => {
    expect(html(<SalaryBadge min={18} max={26} />)).toContain("₹18–26 LPA");
    const est = html(<SalaryBadge type="est" min={16} max={22} confidence={78} samples={142} />);
    expect(est).toContain("~₹16–22 LPA");
    expect(est).toContain("Estimated from 142 data points");
  });
});

describe("controls", () => {
  it("Toggle is a switch", () => {
    expect(html(<Toggle label="Alerts" defaultOn />)).toContain(
      'role="switch" aria-checked="true"',
    );
  });

  it("tabs expose selection and roving tabindex", () => {
    const out = html(
      <PillTabs label="Billing period" options={["Monthly", "Yearly"]} value="Yearly" />,
    );
    expect(out).toContain('role="tablist" aria-label="Billing period"');
    expect(out.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html(<Segmented options={[{ value: "Saved", count: 3 }]} />)).toContain(">3</span>");
  });

  it("removable chips label their remove button", () => {
    expect(html(<Chip onRemove={() => {}}>Go</Chip>)).toContain('aria-label="Remove"');
  });

  it("Accordion wires buttons to regions", () => {
    const out = html(<Accordion items={[{ q: "Q", a: "A" }]} />);
    expect(out).toMatch(/aria-expanded="true" aria-controls="([^"]+)"/);
    expect(out).toContain('role="region"');
  });
});

describe("status", () => {
  it("QuotaBar reports progress", () => {
    expect(html(<QuotaBar label="Emails" used={38} max={50} />)).toContain('aria-valuenow="38"');
  });

  it("StageCard shows flags", () => {
    const out = html(<StageCard title="SDE-1" company="Zepto" flags={["tailored", "replied"]} />);
    expect(out).toContain("Tailored");
    expect(out).toContain("Replied");
  });

  it("durationLabel wraps past midnight", () => {
    expect(durationLabel("22:00", "08:00")).toBe("10h");
    expect(durationLabel("09:00", "17:30")).toBe("8h 30m");
  });
});

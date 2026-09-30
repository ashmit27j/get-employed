"use client";
import { useState } from "react";
import { Icon, PillTabs, PricingCard, Reveal, SectionHeading } from "@ge/ui";
import { REPO_URL, SIGN_UP_URL } from "@/lib/site";
import { Section } from "./Frame";

/** Copyable `git clone` command under the pricing cards. */
function CloneBox() {
  const cmd = `git clone ${REPO_URL}.git`;
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-surface-1 px-5 py-4">
      <span className="flex items-center gap-2 text-small text-ink-muted">
        <Icon name="folder-git-2" size={16} />
        Self-host from GitHub
      </span>
      <code className="min-w-[240px] flex-1 truncate rounded-md border border-hairline bg-canvas px-3 py-2 font-mono text-ui text-ink">
        <span className="text-ink-tertiary">$ </span>
        {cmd}
      </code>
      <button
        type="button"
        onClick={copy}
        className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-2 text-ui ${copied ? "text-primary" : "text-ink-subtle hover:text-ink"}`}
      >
        <Icon name={copied ? "check" : "copy"} size={14} />
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

// Plan limits here are marketing copy only; they are not enforced in code yet (docs/decisions.md D15).
export function PricingSection() {
  const [period, setPeriod] = useState("Yearly");
  const yearly = period === "Yearly";
  return (
    <Section id="pricing" bottom="none">
      <Reveal>
        <div className="mb-12 flex flex-col items-center gap-5 text-center">
          <div className="text-eyebrow font-medium text-ink-subtle uppercase">Pricing</div>
          <SectionHeading>Free to start. Pay to go unlimited.</SectionHeading>
          <PillTabs
            label="Billing period"
            options={["Monthly", "Yearly"]}
            value={period}
            onChange={setPeriod}
          />
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="grid grid-cols-3 items-stretch gap-4 max-lg:grid-cols-1">
          <PricingCard
            tier="Free"
            price="₹0"
            period=""
            description="For getting started"
            cta="Start free"
            href={SIGN_UP_URL}
            features={[
              "5 saved searches",
              "20 tailored resumes a month",
              "50 outreach emails a month",
              "1 mock interview",
            ]}
          />
          <PricingCard
            tier="Pro"
            price={yearly ? "₹299" : "₹399"}
            description={
              yearly ? "₹3,588 billed yearly · save 25%" : "Billed monthly · cancel any time"
            }
            featured
            cta="Upgrade to Pro"
            href={SIGN_UP_URL}
            features={[
              "Unlimited searches and resumes",
              "Unlimited outreach emails",
              "Unlimited mock interviews with camera feedback",
              "Salary intelligence",
              "Career assistant chat",
            ]}
          />
          <PricingCard
            tier="Self-host"
            price="₹0"
            period="+ your own API costs"
            description="Open source, your own API keys"
            cta="View on GitHub"
            href={REPO_URL}
            features={[
              "Everything in Pro",
              "No usage limits",
              "Runs with docker compose",
              "Your data stays on your machine",
            ]}
          />
        </div>
        <CloneBox />
      </Reveal>
    </Section>
  );
}

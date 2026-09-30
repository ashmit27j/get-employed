import type { Metadata } from "next";
import { SectionHeading } from "@ge/ui";
import { Section } from "@/components/site/Frame";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", robots: { index: false } };

// TODO(owner): replace with the real Privacy text before launch (docs/roadmap.md).
export default function PrivacyPage() {
  return (
    <Section bottom={96} className="max-w-[880px]!">
      <div className="flex flex-col gap-4">
        <SectionHeading as="h1" size="md">
          Privacy
        </SectionHeading>
        <p className="m-0 text-lead text-ink-subtle">
          This page is being written. Questions in the meantime go to{" "}
          <a href={`${REPO_URL}/issues`} className="text-ink underline">
            GitHub issues
          </a>
          .
        </p>
      </div>
    </Section>
  );
}

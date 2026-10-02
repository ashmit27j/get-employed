import type { Metadata } from "next";
import { SectionHeading } from "@ge/ui";
import { Section } from "@/components/site/Frame";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms" };

// TODO(owner): replace with the real Terms text before launch (docs/roadmap.md).
export default function TermsPage() {
  return (
    <Section bottom={96} className="max-w-[880px]!">
      <div className="flex flex-col gap-4">
        <SectionHeading as="h1" size="md">
          Terms
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

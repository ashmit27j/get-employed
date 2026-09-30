import { Hero } from "@/components/site/Hero";
import { Section } from "@/components/site/Frame";
import {
  FAQ,
  Features,
  FinalCTA,
  HowItWorks,
  SelfHost,
  SourceCarousel,
  Testimonials,
  TourSection,
} from "@/components/site/HomeSections";
import { PricingSection } from "@/components/site/Pricing";

export default function Home() {
  return (
    <>
      <Section rule={false}>
        <Hero />
      </Section>
      <TourSection />
      <HowItWorks />
      <SourceCarousel />
      <Features />
      <SelfHost />
      <Testimonials />
      <PricingSection />
      <FAQ />
      <FinalCTA />
    </>
  );
}

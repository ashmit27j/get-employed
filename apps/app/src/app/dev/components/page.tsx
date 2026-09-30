import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalogue } from "./catalogue";

export const metadata: Metadata = { title: "Components" };

/** Live catalogue of @ge/ui (the port of prototype/Components.dc.html). Development only. */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Catalogue />;
}

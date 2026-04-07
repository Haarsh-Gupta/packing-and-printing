import { Metadata } from "next";
import { fetchPageSEO } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return await fetchPageSEO("/services");
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { Metadata } from "next";
import { fetchPageSEO } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return await fetchPageSEO("/products");
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

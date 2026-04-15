import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Driving Packages - Seattle | Enroll Now | Discount Driving School",
  description:
    "Enroll in Kent driving programs: Adult packages ($250-$1050), Teen courses ($550-$850), Knowledge tests ($25), Driving tests ($70-$180). Book online 24/7.",
  keywords:
    "book driving lessons Seattle, enroll driving school, Seattle driving packages, teen driver education, adult driving lessons, DOL permit test",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

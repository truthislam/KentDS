import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kentdiscountdrivingschool.com/"),
  title: "Discount Driving School - Kent | Top-Rated DOL Testing Center",
  description:
    "Book driving lessons at Kent's top-rated DOL testing center. Get your driver's license with expert instructors, affordable packages, and flexible scheduling. Enroll now at 23231 Pacific Hwy S.",
  keywords:
    "Kent driving school, driving lessons Kent WA, DOL testing center Kent, book driving test, driver's license Kent",
  openGraph: {
    type: "website",
    url: "https://kentdiscountdrivingschool.com/",
    title: "Discount Driving School - Kent's Top-Rated DOL Testing Center",
    description:
      "Book your driving lessons today! Expert instructors, state-approved testing, and 4.9★ rating with 100+ reviews.",
    images: ["/images/hero_fixed.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                if (event.message && event.message.indexOf('ChunkLoadError') !== -1) {
                  // Prevent infinite reload loops by checking session storage
                  var reloadCount = parseInt(sessionStorage.getItem('chunkLoadReloadCount') || '0', 10);
                  if (reloadCount < 2) {
                    sessionStorage.setItem('chunkLoadReloadCount', String(reloadCount + 1));
                    window.location.reload();
                  }
                }
              });
              // Reset counter on successful load
              window.addEventListener('load', function() {
                setTimeout(function() {
                  sessionStorage.removeItem('chunkLoadReloadCount');
                }, 2000);
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

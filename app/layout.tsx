import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { disclaimer } from "@/lib/methodology";
export const metadata: Metadata = {
  title: "Quiet Financial Loss Calculator",
  description:
    "Estimate the hidden financial impact of poor indoor cellular coverage.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/brand/fonts.css" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="MCA — calculator home">
            <img src="/brand/logo-ink.svg" alt="MCA" width="120" height="60" />
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Calculator</Link>{" "}
            <Link href="/model">How the model works</Link>
            <Link href="/methodology">Research &amp; Methodology</Link>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <p className="eyebrow">
            Research-based estimates. Transparent assumptions.
          </p>
          <p>{disclaimer}</p>
          <p>
            Experience, reputation, service-recovery and revenue impacts are
            included only when sufficient evidence and facility-specific
            information are available. Otherwise, they are identified but not
            assigned a dollar value.
          </p>
        </footer>
      </body>
    </html>
  );
}

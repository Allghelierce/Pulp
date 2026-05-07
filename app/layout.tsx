import "./globals.css";
import { EB_Garamond } from "next/font/google";

const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", variable: "--font-eb-garamond" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={ebGaramond.variable}>
      <head>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" as="style" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <link rel="icon" href="/pulp_logo.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
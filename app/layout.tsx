import { Inter, Gochi_Hand, Caveat, Indie_Flower, Roboto_Mono, Playfair_Display, Italiana, Dancing_Script, EB_Garamond, Bilbo, Licorice, Original_Surfer } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const hand = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
const indie = Indie_Flower({ weight: "400", subsets: ["latin"], variable: "--font-marker" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const italiana = Italiana({ weight: "400", subsets: ["latin"], variable: "--font-italiana" });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", weight: ["400", "700"] });
const bilbo = Bilbo({ weight: "400", subsets: ["latin"], variable: "--font-bilbo" });
const licorice = Licorice({ weight: "400", subsets: ["latin"], variable: "--font-licorice" });
const originalSurfer = Original_Surfer({ weight: "400", subsets: ["latin"], variable: "--font-surfer" });


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" as="style" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <link rel="icon" href="/pulp_logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} ${hand.variable} ${caveat.variable} ${indie.variable} ${mono.variable} ${playfair.variable} ${italiana.variable} ${dancing.variable} ${garamond.variable} ${bilbo.variable} ${licorice.variable} ${originalSurfer.variable} antialiased`}>

        {children}
      </body>
    </html>
  );
}
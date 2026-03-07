import { Inter, Gochi_Hand, Caveat, Indie_Flower, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const hand = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
const indie = Indie_Flower({ weight: "400", subsets: ["latin"], variable: "--font-marker" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${hand.variable} ${caveat.variable} ${indie.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
import "./globals.css";
import { EB_Garamond } from "next/font/google";

const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", variable: "--font-eb-garamond", weight: ["400", "500", "700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={ebGaramond.variable} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" as="style" />
        <link id="katex-css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" media="print" />
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('katex-css').addEventListener('load',function(){this.media='all'})` }} />
        <link rel="icon" href="/pulp_logo.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: `try{var s=JSON.parse(localStorage.getItem('pulp-settings'));if(s){var d=document.documentElement;var t=s.theme||'dark';var bg=t==='dark'?'#09090b':'#F0ECEA';var fg=t==='dark'?'#FAFAFA':'#1A1A1A';d.style.backgroundColor=bg;d.style.color=fg}}catch(e){}` }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
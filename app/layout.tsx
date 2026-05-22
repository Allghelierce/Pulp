import "./globals.css";
import { EB_Garamond, Crimson_Pro } from "next/font/google";

const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", variable: "--font-eb-garamond", weight: ["400", "500", "700"] });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], display: "swap", variable: "--font-crimson-pro", weight: ["400", "500", "600", "700", "800"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${crimsonPro.variable}`} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" as="style" />
        <link id="katex-css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" media="all" />
        <link rel="icon" href="/pulp_logo.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d97706" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `try{var s=JSON.parse(localStorage.getItem('pulp-settings'));var t=(s&&s.theme)||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}` }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
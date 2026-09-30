import "./globals.css";
import type { Metadata, Viewport } from "next";
import { EB_Garamond, Crimson_Pro, Fraunces } from "next/font/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://pulp-omega.vercel.app"),
  title: {
    default: "Pulp — Focus timer & notebook that grows trees",
    template: "%s — Pulp",
  },
  description:
    "Pulp is a digital notebook with a focus timer that grows a living orchard as you write. Pomodoro sessions, inline AI, Cornell notes, encrypted vaults, and a seed shop.",
  keywords: [
    "focus timer",
    "pomodoro",
    "digital notebook",
    "note taking app",
    "study app",
    "productivity",
    "tree growing focus app",
  ],
  applicationName: "Pulp",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Pulp",
    url: "/",
    title: "Pulp — Focus timer & notebook that grows trees",
    description:
      "A focus timer that grows a living orchard as you write. Pomodoro sessions, inline AI, and a seed shop.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulp — Focus timer & notebook that grows trees",
    description:
      "A focus timer that grows a living orchard as you write. Pomodoro sessions, inline AI, and a seed shop.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/pulp_logo.svg",
    apple: "/pulp_logo.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#d97706",
};

const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", variable: "--font-eb-garamond", weight: ["400", "500", "700"] });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], display: "swap", variable: "--font-crimson-pro", weight: ["400", "500", "600", "700", "800"] });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-fraunces" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${crimsonPro.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" as="style" />
        <link id="katex-css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" media="all" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `try{var s=JSON.parse(localStorage.getItem('pulp-settings'));var t=(s&&s.theme)||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
        {process.env.NODE_ENV === 'production' ? (
          <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}` }} />
        ) : (
          // Dev: the SW's cache-first strategy serves stale /_next chunks (causing
          // ghost "module deleted in HMR" errors), so unregister it and clear caches.
          <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}}` }} />
        )}
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
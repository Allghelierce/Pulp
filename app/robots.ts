import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/auth", "/api"],
    },
    sitemap: "https://pulp-omega.vercel.app/sitemap.xml",
  };
}

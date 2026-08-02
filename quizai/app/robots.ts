import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://quizai.help";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/app + API routes out of search.
      disallow: ["/dashboard", "/summaries", "/quizzes", "/tasks", "/profile", "/login", "/reset-password", "/auth/", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

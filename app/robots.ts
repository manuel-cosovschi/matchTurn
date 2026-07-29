import type { MetadataRoute } from "next";

// Permite indexar solo la landing; bloquea páginas privadas y links con token.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/t/", "/dashboard", "/login", "/register"],
      },
    ],
    host: "https://matchturn.click",
  };
}

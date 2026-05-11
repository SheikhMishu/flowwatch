import type { MetadataRoute } from "next";
import { getAllPostMeta } from "@/lib/blog";

const BASE = "https://flowmonix.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostMeta();

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    ...blogEntries,
  ];
}

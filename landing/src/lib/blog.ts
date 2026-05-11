import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "blog");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  category: string;
  tags: string[];
}

export interface Post extends PostMeta {
  contentHtml: string;
}

function estimateReadingTime(content: string): string {
  const minutes = Math.ceil(content.split(/\s+/).length / 200);
  return `${minutes} min read`;
}

export function getAllPostMeta(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        publishedAt: data.publishedAt ?? "",
        readingTime: data.readingTime ?? estimateReadingTime(content),
        category: data.category ?? "General",
        tags: data.tags ?? [],
      } as PostMeta;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(content);
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    publishedAt: data.publishedAt ?? "",
    readingTime: data.readingTime ?? estimateReadingTime(content),
    category: data.category ?? "General",
    tags: data.tags ?? [],
    contentHtml: processed.toString(),
  };
}

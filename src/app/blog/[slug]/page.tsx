import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostMeta, getPost } from "@/lib/blog";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostMeta().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const url = `https://flowmonix.com/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "FlowMonix",
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="https://flowmonix.com" className="font-semibold text-foreground text-[17px] tracking-tight">
            Flow<span className="text-primary">Monix</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link
              href="https://app.flowmonix.com/register"
              className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md font-medium hover:opacity-90 transition-opacity text-sm"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All articles
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
          <span className="bg-muted px-2.5 py-0.5 rounded-full font-medium">{post.category}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readingTime}
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-4">
          {post.title}
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-b border-border pb-10">
          {post.description}
        </p>

        {/* Content */}
        <div
          className="prose prose-zinc max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-zinc-700
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:text-primary prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-800
            prose-blockquote:border-l-primary prose-blockquote:bg-accent/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
            prose-blockquote:text-muted-foreground
            prose-table:text-sm
            prose-th:text-foreground prose-th:font-semibold prose-th:bg-muted
            prose-td:text-zinc-700
            prose-li:text-[15px] prose-li:text-zinc-700
            prose-hr:border-border"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CTA */}
      <div className="border-t border-border bg-accent/40 mt-6">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            FlowMonix
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Stop finding out from your clients
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-[15px]">
            FlowMonix monitors every n8n execution automatically. No per-workflow setup, no gaps. Get your first incident grouped and actionable in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://app.flowmonix.com/register"
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Start Free — No Credit Card
            </Link>
            <Link
              href="/blog"
              className="border border-border text-foreground px-6 py-2.5 rounded-md font-medium hover:bg-muted transition-colors"
            >
              Read more articles
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free tier available · Setup in 2 minutes</p>
        </div>
      </div>
    </div>
  );
}

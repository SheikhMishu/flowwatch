import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostMeta, getPost } from "@/lib/blog";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { FlowMonixMark } from "@/components/brand-mark";

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
    title: `${post.title} | FlowMonix`,
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Nav */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-300/40">
              <FlowMonixMark className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold tracking-tight text-[17px]">
              <span className="text-zinc-900">Flow</span>
              <span style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>monix</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-zinc-500 hover:text-zinc-800 transition-colors">← Blog</Link>
            <Link
              href="https://app.flowmonix.com/register"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> All articles
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-5">
          <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold">{post.category}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime}</span>
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed mb-10 border-b border-zinc-200 pb-10">
          {post.description}
        </p>

        <div
          className="prose prose-zinc max-w-none
            prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-zinc-600
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-900 prose-strong:font-semibold
            prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-800
            prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-zinc-600
            prose-table:text-sm prose-th:text-zinc-900 prose-th:font-semibold prose-th:bg-zinc-50 prose-td:text-zinc-600
            prose-li:text-[15px] prose-li:text-zinc-600
            prose-hr:border-zinc-200"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </main>

      {/* CTA */}
      <div className="border-t border-zinc-200 bg-white mt-6">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
            FlowMonix
          </div>
          <h2 className="font-display font-extrabold text-2xl text-zinc-900 mb-3">
            Stop finding out from your clients
          </h2>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto text-[15px]">
            FlowMonix monitors every n8n execution automatically. No per-workflow setup, no gaps. First incident in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://app.flowmonix.com/register"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Start Free — No Credit Card
            </Link>
            <Link href="/blog" className="border border-zinc-200 text-zinc-700 px-6 py-2.5 rounded-xl font-medium hover:bg-zinc-50 transition-colors text-sm">
              Read more articles
            </Link>
          </div>
          <p className="text-xs text-zinc-400 mt-4">Free tier available · Setup in 2 minutes</p>
        </div>
      </div>
    </div>
  );
}

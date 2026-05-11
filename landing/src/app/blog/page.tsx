import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostMeta } from "@/lib/blog";
import { ArrowRight, Clock } from "lucide-react";
import { FlowMonixMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Blog — n8n Monitoring & Workflow Ops | FlowMonix",
  description:
    "Practical guides on n8n monitoring, silent failure prevention, workflow operations, and automation best practices from the FlowMonix team.",
  alternates: { canonical: "https://flowmonix.com/blog" },
  openGraph: {
    title: "FlowMonix Blog — n8n Monitoring & Workflow Ops",
    description: "Practical guides on n8n monitoring, silent failure prevention, and workflow operations.",
    url: "https://flowmonix.com/blog",
    siteName: "FlowMonix",
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = getAllPostMeta();

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
            <Link href="/#pricing" className="text-zinc-500 hover:text-zinc-800 transition-colors">Pricing</Link>
            <Link href="/blog" className="text-indigo-600 font-medium">Blog</Link>
            <Link
              href="https://app.flowmonix.com/register"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
            FlowMonix Blog
          </div>
          <h1 className="font-display font-extrabold text-4xl text-zinc-900 tracking-tight mb-4">
            n8n Monitoring & Workflow Ops
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl">
            Practical guides on keeping your n8n workflows production-ready — alerts, debugging, observability, and everything in between.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-zinc-400">No posts yet — check back soon.</p>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <article key={post.slug} className="bg-white rounded-2xl border border-zinc-200 p-8 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime}
                    </span>
                    {post.publishedAt && (
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-bold text-xl text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-zinc-500 text-[15px] leading-relaxed mb-5">
                    {post.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:gap-2.5 transition-all">
                    Read article <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* CTA */}
      <div className="border-t border-zinc-200 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-zinc-900 mb-1">Stop finding out from your clients</p>
            <p className="text-sm text-zinc-500">FlowMonix monitors every n8n execution. Setup in 2 minutes, free tier available.</p>
          </div>
          <Link
            href="https://app.flowmonix.com/register"
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Start Free →
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostMeta } from "@/lib/blog";
import { ArrowRight, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — n8n Monitoring, Workflow Ops & Automation",
  description:
    "Practical guides on n8n monitoring, silent failure prevention, workflow operations, and automation best practices from the FlowMonix team.",
  alternates: { canonical: "https://flowmonix.com/blog" },
  openGraph: {
    title: "FlowMonix Blog — n8n Monitoring & Workflow Ops",
    description:
      "Practical guides on n8n monitoring, silent failure prevention, and workflow operations.",
    url: "https://flowmonix.com/blog",
    siteName: "FlowMonix",
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = getAllPostMeta();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="https://flowmonix.com" className="font-semibold text-foreground text-[17px] tracking-tight">
            Flow<span className="text-primary">Monix</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="https://flowmonix.com/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="https://flowmonix.com/#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link
              href="https://app.flowmonix.com/register"
              className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md font-medium hover:opacity-90 transition-opacity text-sm"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            FlowMonix Blog
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            n8n Monitoring & Workflow Ops
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Practical guides on keeping your n8n workflows production-ready — alerts, debugging, observability, and everything in between.
          </p>
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <article key={post.slug} className="py-10 group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime}
                    </span>
                    {post.publishedAt && (
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-muted-foreground text-[15px] leading-relaxed mb-4 max-w-2xl">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-muted-foreground flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                      Read article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* CTA footer strip */}
      <div className="border-t border-border bg-muted/40 mt-10">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground mb-1">Stop finding out from your clients</p>
            <p className="text-sm text-muted-foreground">FlowMonix monitors every n8n execution. Setup in 2 minutes, free tier available.</p>
          </div>
          <Link
            href="https://app.flowmonix.com/register"
            className="shrink-0 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Start Free →
          </Link>
        </div>
      </div>
    </div>
  );
}

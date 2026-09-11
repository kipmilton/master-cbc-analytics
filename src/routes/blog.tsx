import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicChrome";
import { FileSpreadsheet, ListChecks, ClipboardList, BookOpen, Calendar, User, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBlogs, type BlogPost } from "@/lib/blogs.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Master CBC" },
      { name: "description", content: "Stories, guides, and updates from the Master CBC team for Kenyan educators." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const navy = "text-[#16213E]";
  const orangeBg = "bg-[#F97316]";

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);

  const { data: blogs = [] } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => getBlogs(),
  });

  const publishedBlogs = blogs.filter((b) => b.published);

  const plannedPosts = [
    {
      icon: FileSpreadsheet,
      title: "From Spreadsheets to Stream Comparisons",
    },
    {
      icon: ListChecks,
      title: "Understanding CBC Rubrics in Senior Secondary",
    },
    {
      icon: ClipboardList,
      title: "Three Things Every Deputy Principal Should Track Weekly",
    },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <h1 className={`text-4xl font-extrabold tracking-tight ${navy}`}>
            Blog
          </h1>
          <p className="mt-4 text-[17px] text-slate-600 leading-relaxed">
            Stories, guides, and updates from the Master CBC team.
          </p>

          {/* Single email capture */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 shadow-sm">
            {submitted ? (
              <p className={`text-sm font-semibold ${navy}`}>
                You&apos;re on the list — we&apos;ll email you when we publish new posts.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="sm:flex sm:items-center sm:gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${navy}`}>
                    Get notified when we publish
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    One email, no spam — just new posts as they go live.
                  </p>
                </div>
                <div className="mt-3 flex gap-2 sm:mt-0">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.ac.ke"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#F97316] sm:w-56"
                  />
                  <button
                    type="submit"
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white ${orangeBg} hover:opacity-90 transition-opacity`}
                  >
                    Notify me
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Published Articles List */}
          {publishedBlogs.length > 0 && (
            <div className="mt-12 space-y-6">
              <p className={`text-sm font-semibold uppercase tracking-wider text-slate-500`}>Published Articles</p>
              <div className="grid gap-6">
                {publishedBlogs.map((post) => (
                  <article
                    key={post.id}
                    className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#F97316] transition-all"
                    onClick={() => setReadingPost(post)}
                  >
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1 font-medium text-slate-500"><User className="h-3.5 w-3.5 text-[#F97316]" /> {post.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(post.publishedAt).toLocaleDateString("en-GB")}</span>
                    </div>
                    <h2 className={`text-xl font-bold ${navy} group-hover:text-[#F97316] transition-colors`}>
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {post.excerpt || post.content}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#F97316]">
                      Read article <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Planned posts as a list */}
          <div className="mt-12">
            <p className={`text-sm font-semibold ${navy}`}>What we&apos;re planning</p>
            <div className="mt-4 space-y-3">
              {plannedPosts.map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4"
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600">{title}</p>
                  <span className="ml-auto shrink-0 rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-400 font-medium">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Reader Modal */}
      <Dialog open={!!readingPost} onOpenChange={(open) => !open && setReadingPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-600">{readingPost?.author}</span>
              <span>•</span>
              <span>{readingPost?.publishedAt ? new Date(readingPost.publishedAt).toLocaleDateString("en-GB") : ""}</span>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-[#16213E] leading-snug">
              {readingPost?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {readingPost?.content}
          </div>
        </DialogContent>
      </Dialog>

      <PublicFooter />
    </div>
  );
}

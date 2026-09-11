import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlogs, createBlogPost, deleteBlogPost, togglePublishBlogPost, type BlogPost } from "@/lib/blogs.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Globe, FileText, CheckCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/blogs")({
  head: () => ({
    meta: [
      { title: "Manage Blog — Master CBC Admin" },
      { name: "description", content: "Publish and manage articles for the Master CBC blog." },
    ],
  }),
  component: AdminBlogsPage,
});

function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Master CBC Team");
  const [published, setPublished] = useState(true);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => getBlogs(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; excerpt?: string; content: string; author?: string; published: boolean }) =>
      createBlogPost({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog article published successfully!");
      setTitle("");
      setExcerpt("");
      setContent("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to publish blog post"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlogPost({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog post deleted.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (v: { id: string; published: boolean }) => togglePublishBlogPost({ data: v }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Publish status updated.");
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error("Title and content are required.");
    createMutation.mutate({ title, excerpt, content, author, published });
  }

  return (
    <AppShell allow={["super_admin"]}>
      <PageHeader
        title="Blog Post Publishing"
        subtitle="Write, edit, and publish articles for the Master CBC public blog."
        action={
          <Badge variant="outline" className="border-[#F97316] text-[#F97316]">
            {blogs.length} Articles Total
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Create Post Form */}
        <Card className="border-border/70 xl:col-span-2">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="text-base font-semibold text-[#16213E] flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#F97316]" /> Create New Article
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-[#16213E]">Article Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 5 Strategies for Junior Secondary Assessment"
                  className="mt-1 text-sm"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#16213E]">Author Name</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Master CBC Team"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#16213E]">Short Excerpt / Summary</Label>
                <Input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary displayed on blog cards..."
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#16213E]">Full Article Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full post text here..."
                  className="mt-1 text-sm min-h-[160px]"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch id="pub" checked={published} onCheckedChange={setPublished} />
                  <Label htmlFor="pub" className="text-xs font-medium cursor-pointer">
                    Publish immediately
                  </Label>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-[#F97316] hover:bg-[#C6511F] text-white"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="mr-1.5 h-4 w-4" />
                  )}
                  Publish Article
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Blog Posts List */}
        <Card className="border-border/70 xl:col-span-3">
          <CardContent className="p-5">
            <div className="text-base font-semibold text-[#16213E] mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#F97316]" /> Published & Draft Articles
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading articles…</div>
            ) : !blogs.length ? (
              <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                No blog posts created yet. Use the editor on the left to write your first post.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {blogs.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#16213E]">{b.title}</h4>
                        {b.published ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 text-[10px]">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{b.excerpt || b.content}</p>
                      <div className="text-[11px] text-slate-400">
                        By {b.author} · {new Date(b.publishedAt).toLocaleDateString("en-GB")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMutation.mutate({ id: b.id, published: !b.published })}
                      >
                        {b.published ? "Unpublish" : "Publish"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Delete "${b.title}"?`)) deleteMutation.mutate(b.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

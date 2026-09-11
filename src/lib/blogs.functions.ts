import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  published: boolean;
  publishedAt: string;
  createdAt: string;
}

// In-memory fallback in case DB table hasn't been migrated yet
let localBlogs: BlogPost[] = [
  {
    id: "blog-1",
    title: "From Spreadsheets to Stream Comparisons",
    slug: "from-spreadsheets-to-stream-comparisons",
    excerpt: "How transitioning from manual marksheets to automated stream analysis saves teachers hours every term.",
    content: "For decades, Kenyan teachers have spent late nights manually calculating total marks, mean scores, and grade ranks. Master CBC automates this entire sequence while respecting local grading scales.",
    author: "Master CBC Team",
    published: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-2",
    title: "Understanding CBC Rubrics in Senior Secondary",
    slug: "understanding-cbc-rubrics-in-senior-secondary",
    excerpt: "A practical guide for school principals and deputies navigating the transition to Senior Secondary CBC expectations.",
    content: "The Competency-Based Curriculum shifts focus from pure academic recall to formative assessment rubrics (EE, ME, AE, BE). Here is how schools can implement consistent rubric scoring across departments.",
    author: "Master CBC Team",
    published: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const getBlogs = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getSupabaseAdmin } = await import("./supabase-admin.server");
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("blogs")
      .select("*")
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return localBlogs;
    }

    return data.map((b: any) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt ?? "",
      content: b.content,
      author: b.author ?? "Master CBC Team",
      published: b.published ?? true,
      publishedAt: b.published_at ?? b.created_at,
      createdAt: b.created_at,
    }));
  } catch (_e) {
    return localBlogs;
  }
});

const createBlogSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  author: z.string().default("Master CBC Team"),
  published: z.boolean().default(true),
});

export const createBlogPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw: unknown) => createBlogSchema.parse(raw))
  .handler(async ({ data }) => {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newPost: BlogPost = {
      id: `blog-${Date.now()}`,
      title: data.title,
      slug,
      excerpt: data.excerpt ?? "",
      content: data.content,
      author: data.author || "Master CBC Team",
      published: data.published,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const { getSupabaseAdmin } = await import("./supabase-admin.server");
      const admin = getSupabaseAdmin();
      const { data: dbData, error } = await admin
        .from("blogs")
        .insert({
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          author: data.author,
          published: data.published,
        })
        .select("*")
        .single();

      if (!error && dbData) {
        return {
          id: dbData.id,
          title: dbData.title,
          slug: dbData.slug,
          excerpt: dbData.excerpt ?? "",
          content: dbData.content,
          author: dbData.author ?? "Master CBC Team",
          published: dbData.published ?? true,
          publishedAt: dbData.published_at ?? dbData.created_at,
          createdAt: dbData.created_at,
        };
      }
    } catch (_e) {
      // Fallback in case table doesn't exist yet
    }

    localBlogs.unshift(newPost);
    return newPost;
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const { getSupabaseAdmin } = await import("./supabase-admin.server");
      const admin = getSupabaseAdmin();
      await admin.from("blogs").delete().eq("id", data.id);
    } catch (_e) {
      // Fallback
    }
    localBlogs = localBlogs.filter((b) => b.id !== data.id);
    return { success: true };
  });

export const togglePublishBlogPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((raw: unknown) => z.object({ id: z.string(), published: z.boolean() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const { getSupabaseAdmin } = await import("./supabase-admin.server");
      const admin = getSupabaseAdmin();
      await admin.from("blogs").update({ published: data.published }).eq("id", data.id);
    } catch (_e) {
      // Fallback
    }
    localBlogs = localBlogs.map((b) => (b.id === data.id ? { ...b, published: data.published } : b));
    return { success: true };
  });

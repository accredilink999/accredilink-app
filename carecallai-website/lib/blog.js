import { supabase } from './supabase';

export async function getAllPosts() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, title, description, date, category, read_time')
      .eq('published', true)
      .order('date', { ascending: false });

    if (error) {
      console.error('Blog fetch error:', error);
      return [];
    }
    return (data || []).map(p => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: p.date,
      category: p.category,
      readTime: p.read_time,
    }));
  } catch (e) {
    console.error('Blog fetch exception:', e);
    return [];
  }
}

export async function getPostBySlug(slug) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !data) return null;
    return {
      slug: data.slug,
      title: data.title,
      description: data.description,
      date: data.date,
      category: data.category,
      readTime: data.read_time,
      content: data.content,
      seoKeywords: data.seo_keywords,
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
    };
  } catch (e) {
    console.error('Blog post fetch exception:', e);
    return null;
  }
}

export async function getAllSlugs() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('published', true);

    if (error) return [];
    return (data || []).map(p => p.slug);
  } catch (e) {
    console.error('Blog slugs fetch exception:', e);
    return [];
  }
}

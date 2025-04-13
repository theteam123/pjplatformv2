import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Content = Database['public']['Tables']['content']['Row'];
type ContentInsert = Database['public']['Tables']['content']['Insert'];
type ContentUpdate = Database['public']['Tables']['content']['Update'];

export function useContent() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function createContent(newContent: ContentInsert) {
    try {
      const { data, error } = await supabase
        .from('content')
        .insert([newContent])
        .select()
        .single();

      if (error) throw error;
      setContent(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  async function updateContent(id: string, updates: ContentUpdate) {
    try {
      const { data, error } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setContent(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  async function deleteContent(id: string) {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setContent(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  return {
    content,
    loading,
    error,
    createContent,
    updateContent,
    deleteContent,
    refreshContent: fetchContent
  };
}
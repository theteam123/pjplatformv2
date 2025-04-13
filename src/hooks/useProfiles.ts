import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      setLoading(true);
      console.log('Fetching profiles...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched profiles:', data);
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function searchProfiles(query: string, companyId?: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('search_users', {
          search_query: query,
          company_id: companyId
        });

      if (error) throw error;
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function createProfile(profile: { id: string } & Omit<Profile, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('Creating profile:', profile);
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Created profile:', data);
      setProfiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  async function updateProfile(id: string, updates: Partial<Profile>) {
    try {
      console.log('Updating profile:', { id, updates });
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('Updated profile:', data);
      setProfiles(prev => prev.map(profile => profile.id === id ? data : profile));
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  async function deleteProfile(id: string) {
    try {
      console.log('Deleting profile:', id);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('Deleted profile:', id);
      setProfiles(prev => prev.filter(profile => profile.id !== id));
    } catch (err) {
      console.error('Error deleting profile:', err);
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  return {
    profiles,
    loading,
    error,
    searchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    refreshProfiles: fetchProfiles
  };
}
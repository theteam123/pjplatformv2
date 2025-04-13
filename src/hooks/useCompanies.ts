import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { PostgrestError } from '@supabase/supabase-js';

type Company = Database['public']['Tables']['companies']['Row'];

function getDetailedErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if ((error as any).code === 'PGRST116') {
      return 'The requested company could not be found. It may have been deleted or you may not have permission to access it.';
    }
    if ((error as any).code === '23505') {
      return 'A company with this name already exists. Please choose a different name.';
    }
    if ((error as any).code === '23503') {
      return 'This company cannot be deleted because it is referenced by other records.';
    }
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgrestError;
    if (pgError.message) {
      switch (pgError.code) {
        case '23505':
          return 'A company with this name already exists. Please choose a different name.';
        case '23503':
          return 'This company cannot be deleted because it has associated users or content.';
        case 'PGRST116':
          return 'The requested company could not be found. It may have been deleted or you may not have permission to access it.';
        default:
          return pgError.message;
      }
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching companies...');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }
      
      console.log('Fetched companies:', data);
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(getDetailedErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
    try {
      if (!company.name.trim()) {
        throw new Error('Company name is required');
      }

      if (company.website && !company.website.match(/^https?:\/\/.+/)) {
        throw new Error('Website URL must start with http:// or https://');
      }

      console.log('Creating company with data:', company);
      
      const { data, error } = await supabase
        .from('companies')
        .insert([company])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      console.log('Created company:', data);
      setCompanies(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating company:', err);
      throw new Error(getDetailedErrorMessage(err));
    }
  }

  async function updateCompany(id: string, updates: Partial<Company>) {
    try {
      // Validate ID format
      if (!id || !UUID_REGEX.test(id)) {
        throw new Error('Invalid company ID format');
      }

      if (updates.name !== undefined && !updates.name.trim()) {
        throw new Error('Company name cannot be empty');
      }

      if (updates.website && !updates.website.match(/^https?:\/\/.+/)) {
        throw new Error('Website URL must start with http:// or https://');
      }

      console.log('Updating company with ID:', id);
      console.log('Update data:', updates);

      // First verify the company exists and get its current state
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select()
        .eq('id', id)
        .order('id')
        .limit(1)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }
      
      if (!existingCompany) {
        throw new Error('Company not found. It may have been deleted or you may not have permission to access it.');
      }

      // Only update if there are actual changes
      const hasChanges = Object.entries(updates).some(
        ([key, value]) => existingCompany[key as keyof Company] !== value
      );

      if (!hasChanges) {
        console.log('No changes detected, returning existing company');
        return existingCompany;
      }

      // Proceed with update using a transaction-like approach
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .order('id')
        .limit(1)
        .maybeSingle();

      if (updateError) {
        // Check if the company was deleted during our update
        const { data: checkCompany } = await supabase
          .from('companies')
          .select()
          .eq('id', id)
          .order('id')
          .limit(1)
          .maybeSingle();

        if (!checkCompany) {
          throw new Error('Company was deleted while attempting to update. Please refresh the page.');
        }
        throw updateError;
      }

      if (!updatedCompany) {
        throw new Error('Failed to update company. The record may have been modified by another user.');
      }
      
      console.log('Updated company:', updatedCompany);
      setCompanies(prev => prev.map(company => company.id === id ? updatedCompany : company));
      return updatedCompany;
    } catch (err) {
      console.error('Error in updateCompany:', err);
      throw new Error(getDetailedErrorMessage(err));
    }
  }

  async function deleteCompany(id: string) {
    try {
      // Validate ID format
      if (!id || !UUID_REGEX.test(id)) {
        throw new Error('Invalid company ID format');
      }

      // First verify the company exists
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select()
        .eq('id', id)
        .order('id')
        .limit(1)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (!existingCompany) {
        throw new Error('Company not found. It may have been already deleted.');
      }

      console.log('Deleting company with ID:', id);
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      console.log('Successfully deleted company:', id);
      setCompanies(prev => prev.filter(company => company.id !== id));
    } catch (err) {
      console.error('Error deleting company:', err);
      throw new Error(getDetailedErrorMessage(err));
    }
  }

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    refreshCompanies: fetchCompanies
  };
}
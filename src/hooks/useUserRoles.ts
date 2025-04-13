import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  role_name?: string;
  created_at: string;
  updated_at: string;
}

export function useUserRoles() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  async function fetchUserRoles() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles (
            name
          )
        `)
        .order('created_at');

      if (error) throw error;

      const rolesWithNames = data.map(role => ({
        ...role,
        role_name: role.roles?.name
      }));

      setUserRoles(rolesWithNames);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user roles';
      setError(message);
      console.error('Error fetching user roles:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function assignUserRole(userId: string, roleId: string): Promise<UserRole | null> {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role_id: roleId }])
        .select(`
          *,
          roles (
            name
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This role is already assigned to the user');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Failed to assign role - no data returned');
      }

      const roleWithName = {
        ...data,
        role_name: data.roles?.name
      };

      setUserRoles(prev => [...prev, roleWithName]);
      return roleWithName;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign role';
      setError(message);
      console.error('Error assigning role:', err);
      return null;
    }
  }

  async function removeUserRole(userId: string, roleId: string): Promise<boolean> {
    try {
      setError(null);
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .match({ user_id: userId, role_id: roleId });

      if (error) throw error;

      setUserRoles(prev => prev.filter(r => !(r.user_id === userId && r.role_id === roleId)));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove role';
      setError(message);
      console.error('Error removing role:', err);
      return false;
    }
  }

  async function getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at');

      if (error) throw error;

      return data.map(role => ({
        ...role,
        role_name: role.roles?.name
      }));
    } catch (err) {
      console.error('Error fetching user roles:', err);
      throw err;
    }
  }

  return {
    userRoles,
    loading,
    error,
    assignUserRole,
    removeUserRole,
    getUserRoles,
    refreshUserRoles: fetchUserRoles
  };
}
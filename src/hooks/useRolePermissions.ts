import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RolePermission {
  id: string;
  role_id: string;
  permission_key: string;
  created_at: string;
  updated_at: string;
}

export function useRolePermissions() {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setPermissions(data || []);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(message);
      console.error('Error fetching permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function addPermission(roleId: string, permissionKey: string): Promise<RolePermission | null> {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('role_permissions')
        .insert([{ role_id: roleId, permission_key: permissionKey }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This permission is already assigned to the role');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Failed to add permission - no data returned');
      }

      setPermissions(prev => [...prev, data]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add permission';
      setError(message);
      console.error('Error adding permission:', err);
      return null;
    }
  }

  async function removePermission(roleId: string, permissionKey: string): Promise<boolean> {
    try {
      setError(null);
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .match({ role_id: roleId, permission_key: permissionKey });

      if (error) throw error;

      setPermissions(prev => prev.filter(p => !(p.role_id === roleId && p.permission_key === permissionKey)));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove permission';
      setError(message);
      console.error('Error removing permission:', err);
      return false;
    }
  }

  return {
    permissions,
    loading,
    error,
    addPermission,
    removePermission,
    refreshPermissions: fetchPermissions
  };
}
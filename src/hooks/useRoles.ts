import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRolePermissions } from './useRolePermissions';
import type { Database } from '../lib/database.types';

type Role = Database['public']['Tables']['roles']['Row'];
type RoleInsert = Database['public']['Tables']['roles']['Insert'];
type RoleUpdate = Database['public']['Tables']['roles']['Update'];

export function useRoles() {
  const { permissions, addPermission, removePermission, refreshPermissions } = useRolePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(message);
      console.error('Error fetching roles:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function createRole(role: RoleInsert & { permissions?: Set<string> }): Promise<Role | null> {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          name: role.name,
          description: role.description
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A role with this name already exists');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create role - no data returned');
      }

      // Add permissions
      if (role.permissions) {
        const permissionPromises = Array.from(role.permissions).map(permission =>
          addPermission(data.id, permission)
        );
        await Promise.all(permissionPromises);
      }

      setRoles(prev => [...prev, data]);
      await refreshPermissions(); // Refresh permissions after creating role
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create role';
      setError(message);
      console.error('Error creating role:', err);
      return null;
    }
  }

  async function updateRole(id: string, updates: RoleUpdate & { permissions?: Set<string> }): Promise<Role | null> {
    try {
      setError(null);

      // First check if the role exists and get its current data
      const { data: existingRole, error: checkError } = await supabase
        .from('roles')
        .select()
        .eq('id', id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (!existingRole) {
        throw new Error('Role not found');
      }

      // Update role data if changed
      const hasBasicChanges = updates.name !== undefined || updates.description !== undefined;
      if (hasBasicChanges) {
        const { data, error } = await supabase
          .from('roles')
          .update({
            name: updates.name,
            description: updates.description
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('A role with this name already exists');
          }
          throw error;
        }

        if (!data) {
          throw new Error('Failed to update role - no data returned');
        }

        setRoles(prev => prev.map(role => role.id === id ? data : role));
      }

      // Update permissions if provided
      if (updates.permissions !== undefined) {
        // Get current permissions for this role
        const currentPermissions = permissions
          .filter(p => p.role_id === id)
          .map(p => p.permission_key);

        // Calculate permissions to add and remove
        const newPermissions = Array.from(updates.permissions);
        const permissionsToAdd = newPermissions.filter(p => !currentPermissions.includes(p));
        const permissionsToRemove = currentPermissions.filter(p => !updates.permissions?.has(p));

        // Add new permissions
        const addPromises = permissionsToAdd.map(permission =>
          addPermission(id, permission)
        );

        // Remove old permissions
        const removePromises = permissionsToRemove.map(permission =>
          removePermission(id, permission)
        );

        await Promise.all([...addPromises, ...removePromises]);
        await refreshPermissions(); // Refresh permissions after updating
      }

      // Return the updated role
      const { data: updatedRole } = await supabase
        .from('roles')
        .select()
        .eq('id', id)
        .single();

      return updatedRole;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      setError(message);
      console.error('Error updating role:', err);
      return null;
    }
  }

  async function deleteRole(id: string): Promise<boolean> {
    try {
      setError(null);

      // First check if the role exists
      const { data: existingRole, error: checkError } = await supabase
        .from('roles')
        .select()
        .eq('id', id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (!existingRole) {
        throw new Error('Role not found');
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRoles(prev => prev.filter(role => role.id !== id));
      await refreshPermissions(); // Refresh permissions after deleting role
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete role';
      setError(message);
      console.error('Error deleting role:', err);
      return false;
    }
  }

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refreshRoles: fetchRoles
  };
}
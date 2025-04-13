import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type RoleContentPermission = Database['public']['Tables']['role_content_permissions']['Row'];
type RoleContentPermissionInsert = Database['public']['Tables']['role_content_permissions']['Insert'];

export function useRoleContentPermissions() {
  const [permissions, setPermissions] = useState<RoleContentPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    try {
      setLoading(true);
      console.log('Fetching role content permissions...');
      
      const { data, error } = await supabase
        .from('role_content_permissions')
        .select(`
          *,
          roles (
            id,
            name
          ),
          content (
            id,
            name
          )
        `);

      if (error) throw error;
      
      console.log('Fetched permissions:', data);
      setPermissions(data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function setContentPermissions(contentId: string, rolePermissions: Record<string, { view: boolean; edit: boolean }>) {
    try {
      console.log('Setting content permissions:', { contentId, rolePermissions });

      // Get existing permissions for this content
      const { data: existingPermissions, error: fetchError } = await supabase
        .from('role_content_permissions')
        .select('*')
        .eq('content_id', contentId);

      if (fetchError) throw fetchError;

      // Create a map of existing permissions
      const existingPermissionsMap = new Map(
        existingPermissions?.map(p => [p.role_id, p]) || []
      );

      // Process each role's permissions
      for (const [roleId, permissions] of Object.entries(rolePermissions)) {
        const existing = existingPermissionsMap.get(roleId);

        if (existing) {
          // Update existing permission if changed
          if (existing.can_view !== permissions.view || existing.can_edit !== permissions.edit) {
            const { error: updateError } = await supabase
              .from('role_content_permissions')
              .update({
                can_view: permissions.view,
                can_edit: permissions.edit
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          }
        } else {
          // Insert new permission
          const { error: insertError } = await supabase
            .from('role_content_permissions')
            .insert({
              role_id: roleId,
              content_id: contentId,
              can_view: permissions.view,
              can_edit: permissions.edit
            });

          if (insertError) throw insertError;
        }
      }

      // Fetch updated permissions
      await fetchPermissions();
    } catch (err) {
      console.error('Error setting content permissions:', err);
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  async function getContentPermissions(contentId: string) {
    try {
      console.log('Getting content permissions for:', contentId);
      
      const { data, error } = await supabase
        .from('role_content_permissions')
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .eq('content_id', contentId);

      if (error) throw error;

      // Convert to the expected format
      const permissions = (data || []).reduce((acc, perm) => {
        acc[perm.role_id] = {
          view: perm.can_view,
          edit: perm.can_edit
        };
        return acc;
      }, {} as Record<string, { view: boolean; edit: boolean }>);

      console.log('Retrieved permissions:', permissions);
      return permissions;
    } catch (err) {
      console.error('Error getting content permissions:', err);
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }

  return {
    permissions,
    loading,
    error,
    setContentPermissions,
    getContentPermissions,
    refreshPermissions: fetchPermissions
  };
}
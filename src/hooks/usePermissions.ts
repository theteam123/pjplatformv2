import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useUserRoles } from './useUserRoles';
import { useRolePermissions } from './useRolePermissions';

export function usePermissions() {
  const { user } = useAuth();
  const { userRoles, loading: userRolesLoading } = useUserRoles();
  const { permissions, loading: permissionsLoading } = useRolePermissions();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(userRolesLoading || permissionsLoading);
  }, [userRolesLoading, permissionsLoading]);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!user) return false;

    // Get all roles for the current user
    const userRoleIds = userRoles
      .filter(ur => ur.user_id === user.id)
      .map(ur => ur.role_id);

    // Check if any of the user's roles have the required permission
    return permissions.some(permission => 
      userRoleIds.includes(permission.role_id) && 
      permission.permission_key === permissionKey
    );
  }, [user, userRoles, permissions]);

  const hasAnyPermission = useCallback((permissionKeys: string[]): boolean => {
    return permissionKeys.some(key => hasPermission(key));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionKeys: string[]): boolean => {
    return permissionKeys.every(key => hasPermission(key));
  }, [hasPermission]);

  return {
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
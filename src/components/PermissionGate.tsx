import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  permissions: string[];
  type?: 'all' | 'any';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  permissions, 
  type = 'any', 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { loading, hasAllPermissions, hasAnyPermission } = usePermissions();

  if (loading) {
    return null;
  }

  const hasAccess = type === 'all' 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
# pjplatformv2
This is my version of the Team App Platform.
# Team Management Application - Specification Document

## 1. Introduction
This document outlines the specifications for the team management application, a platform designed to streamline user, company, role, and content management. It serves as a comprehensive guide for developers, providing a clear understanding of the application's architecture, functionality, and implementation details.

## 2. Project Overview
The team management application aims to provide a centralized system for managing users, companies, roles, and content. It includes features for user authentication, role-based access control, and content management, ensuring that only authorized users can access specific resources.

## 3. Full-Stack Architecture
The application follows a full-stack architecture, comprising the following layers:

- **Frontend**: User interface built with React, Tailwind CSS, and Lucide React.
- **Backend**: API layer implemented using Supabase functions (if needed for complex operations beyond the scope of the existing Supabase setup).
- **Database**: PostgreSQL database managed by Supabase.

## 4. Dependencies
The application relies on the following key dependencies:

- React
- React Router DOM
- Tailwind CSS
- Lucide React
- Supabase
- @supabase/supabase-js
- Vite
- TypeScript

## 5. Components
- **AuthPage**: Handles user authentication.
- **Layout**: Provides layout structure (sidebar + header).
- **SidebarLink**: Navigation link component.
- **UsersPage**: Manage user profiles.
- **CompaniesPage**: Manage companies.
- **RolesPage**: Manage roles and permissions.
- **ContentPage**: Manage content.
- **PermissionGate**: Enforce RBAC.
- **Collapsible**: Uses @radix-ui/react-collapsible.

## 6. Languages and Technologies
- TypeScript
- JavaScript
- HTML
- CSS (Tailwind)
- SQL

## 7. Database Schema

### Tables and Fields:

#### companies
- id (UUID, PK)
- name (text, required)
- website (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

#### profiles
- id (UUID, PK, FK to auth.users.id)
- full_name (text)
- avatar_url (text)
- company_id (UUID, FK to companies.id, nullable)
- created_at (timestamp)
- updated_at (timestamp)

#### roles
- id (UUID, PK)
- name (text, unique)
- description (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

#### content
- id (UUID, PK)
- name (text)
- description (text)
- category (text)
- company_ids (UUID array)
- search_terms (text array)
- settings (JSONB)
- url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

#### role_permissions
- id (UUID, PK)
- role_id (UUID, FK to roles.id)
- permission_key (text)
- created_at (timestamp)
- updated_at (timestamp)

#### user_roles
- id (UUID, PK)
- user_id (UUID, FK to auth.users.id)
- role_id (UUID, FK to roles.id)
- created_at (timestamp)
- updated_at (timestamp)

#### role_content_permissions
- id (UUID, PK)
- role_id (UUID, FK to roles.id)
- content_id (UUID, FK to content.id)
- can_view (boolean)
- can_edit (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### Philosophy
Relational schema with foreign keys, index optimization, and extensibility.

## 8. Authentication
Uses Supabase Auth:
- Email + password sign-up/sign-in.
- Session management.
- Email confirmation.
- JWT-based auth flow.

## 9. Role-Based Access Control (RBAC)
- Roles in roles table.
- Permissions defined in role_permissions.
- Users linked to roles via user_roles.
- Content-specific rights via role_content_permissions.

### Philosophy
- Assign permissions to roles, not users.
- Use PermissionGate to conditionally render content.

## 10. API Endpoints
- Uses Supabase auto-generated REST API.
- For complex logic, use Supabase Functions.

## 11. Future Enhancements
- Advanced search
- Notifications
- Audit logging
- Custom user settings

## 12. Permissions List
- users_read
- users_write
- companies_read
- companies_write
- roles_read
- roles_write
- content_read
- content_write

## 13. Authentication Flow
1. User opens AuthPage and submits form.
2. useAuth triggers signIn or signUp.
3. Supabase handles credentials + email confirmation.
4. Session object returned and stored.
5. useAuth + useContext manages auth state.
6. usePermissions + PermissionGate checks permissions.
7. Sign-out handled via Supabase client.

## 14. Entity Relationship Diagram (Text-Based)
- companies ↔ profiles (1:M)
- auth.users ↔ profiles (1:1)
- roles ↔ role_permissions (1:M)
- roles ↔ user_roles (1:M, resolves M:M)
- auth.users ↔ user_roles (1:M)
- roles ↔ role_content_permissions (1:M)
- content ↔ role_content_permissions (1:M)
- content ↔ companies (M:M via company_ids array)

## 15. Code: PermissionGate.tsx
```tsx
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

  if (loading) return null;

  const hasAccess = type === 'all'
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

## 16. usePermissions Hook
```tsx
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
    const userRoleIds = userRoles.filter(ur => ur.user_id === user.id).map(ur => ur.role_id);
    return permissions.some(p => userRoleIds.includes(p.role_id) && p.permission_key === permissionKey);
  }, [user, userRoles, permissions]);

  const hasAnyPermission = useCallback((keys: string[]) => keys.some(hasPermission), [hasPermission]);
  const hasAllPermissions = useCallback((keys: string[]) => keys.every(hasPermission), [hasPermission]);

  return { loading, hasPermission, hasAnyPermission, hasAllPermissions };
}
```

## 17. useRolePermissions Hook
(Refer to detailed code provided earlier)

## 18. useUserRoles Hook
(Refer to detailed code provided earlier)

## 19. Interface: UserRole
```ts
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  role_name?: string;
  created_at: string;
  updated_at: string;
}
```

## 20. Sample UserRole Object
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "user_id": "f9876543-210a-bcde-f012-345678901234",
  "role_id": "cdef1234-5678-90ab-cdef-1234567890ab",
  "role_name": "Administrator",
  "created_at": "2025-04-13T12:00:00.000Z",
  "updated_at": "2025-04-13T12:00:00.000Z"
}
```

## 21. Summary
This document provides a complete and detailed reference for developers building the team management application. It covers everything from architecture and schema to authentication, RBAC, code snippets, and database interaction. All core functionalities are well-documented to support long-term maintenance and scalability.


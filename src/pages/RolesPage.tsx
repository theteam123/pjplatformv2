import React, { useState, useEffect } from 'react';
import { Shield, Pencil, Trash2, X, Check, Square } from 'lucide-react';
import { useRoles } from '../hooks/useRoles';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { PermissionGate } from '../components/PermissionGate';
import type { Database } from '../lib/database.types';

type Role = Database['public']['Tables']['roles']['Row'];

const AVAILABLE_PERMISSIONS = [
  { id: 'users_read', name: 'View Users', description: 'Can view user profiles' },
  { id: 'users_write', name: 'Manage Users', description: 'Can create and edit users' },
  { id: 'companies_read', name: 'View Companies', description: 'Can view company information' },
  { id: 'companies_write', name: 'Manage Companies', description: 'Can create and edit companies' },
  { id: 'roles_read', name: 'View Roles', description: 'Can view roles and permissions' },
  { id: 'roles_write', name: 'Manage Roles', description: 'Can create and edit roles' },
  { id: 'content_read', name: 'View Content', description: 'Can view content items' },
  { id: 'content_write', name: 'Manage Content', description: 'Can create and edit content' }
];

export default function RolesPage() {
  const { roles, loading: rolesLoading, error: rolesError, createRole, updateRole, deleteRole } = useRoles();
  const { permissions, loading: permissionsLoading } = useRolePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: new Set<string>()
  });

  // Initialize permissions when editing a role
  useEffect(() => {
    if (editingRole && !permissionsLoading) {
      const rolePermissions = new Set(
        permissions
          .filter(p => p.role_id === editingRole.id)
          .map(p => p.permission_key)
      );
      setFormData(prev => ({
        ...prev,
        name: editingRole.name,
        description: editingRole.description || '',
        permissions: rolePermissions
      }));
    }
  }, [editingRole, permissions, permissionsLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => {
      const newPermissions = new Set(prev.permissions);
      if (newPermissions.has(permissionId)) {
        newPermissions.delete(permissionId);
      } else {
        newPermissions.add(permissionId);
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      const roleData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        permissions: formData.permissions
      };

      if (!roleData.name) {
        throw new Error('Role name is required');
      }

      if (editingRole) {
        const updatedRole = await updateRole(editingRole.id, roleData);
        if (!updatedRole) {
          throw new Error('Failed to update role. The role may no longer exist.');
        }
      } else {
        const newRole = await createRole(roleData);
        if (!newRole) {
          throw new Error('Failed to create role. Please try again.');
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving role:', error);
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    const currentRole = roles.find(r => r.id === role.id);
    if (!currentRole) {
      setFormError('This role no longer exists.');
      return;
    }

    setEditingRole(currentRole);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const success = await deleteRole(id);
      if (!success) {
        throw new Error('Failed to delete role. It may no longer exist.');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: new Set()
    });
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: new Set()
    });
    setFormError(null);
    setIsSubmitting(false);
  };

  const getRolePermissions = (roleId: string): string[] => {
    return permissions
      .filter(p => p.role_id === roleId)
      .map(p => p.permission_key);
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="text-red-700">{rolesError}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Roles</h3>
          <PermissionGate permissions={['roles_write']}>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Add Role
            </button>
          </PermissionGate>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {roles.map((role) => {
              const rolePermissions = getRolePermissions(role.id);
              return (
                <li key={role.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          <div className="text-sm text-gray-500">
                            {role.description}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {rolePermissions.map((permission) => {
                              const permissionInfo = AVAILABLE_PERMISSIONS.find(p => p.id === permission);
                              return permissionInfo ? (
                                <span
                                  key={permission}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {permissionInfo.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <PermissionGate permissions={['roles_write']}>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(role)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(role.id)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </PermissionGate>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="px-4 py-5 sm:px-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
                    {formError}
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Role Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="max-h-64 overflow-y-auto border rounded-md">
                    <div className="divide-y divide-gray-200">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handlePermissionToggle(permission.id)}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            {formData.permissions.has(permission.id) ? (
                              <Check className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{permission.name}</div>
                              <div className="text-gray-500">{permission.description}</div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6 bg-gray-50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : editingRole ? 'Save Changes' : 'Add Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
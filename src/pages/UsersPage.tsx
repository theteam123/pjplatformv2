import React, { useState } from 'react';
import { UserPlus, Pencil, Trash2, X, AlertCircle, Shield } from 'lucide-react';
import { useCompanies } from '../hooks/useCompanies';
import { useRoles } from '../hooks/useRoles';
import { useUserRoles } from '../hooks/useUserRoles';
import { usePermissions } from '../hooks/usePermissions';
import { useProfiles } from '../hooks/useProfiles';
import { PermissionGate } from '../components/PermissionGate';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = {
  role_id: string;
  role_name: string;
};

export default function UsersPage() {
  const { companies, loading: companiesLoading } = useCompanies();
  const { roles, loading: rolesLoading } = useRoles();
  const { userRoles, loading: userRolesLoading, assignUserRole, removeUserRole } = useUserRoles();
  const { profiles, loading: profilesLoading, createProfile, updateProfile, deleteProfile } = useProfiles();
  const { hasPermission } = usePermissions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    selectedRoles: new Set<string>(),
    company_id: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => {
      const newSelectedRoles = new Set(prev.selectedRoles);
      if (newSelectedRoles.has(roleId)) {
        newSelectedRoles.delete(roleId);
      } else {
        newSelectedRoles.add(roleId);
      }
      return { ...prev, selectedRoles: newSelectedRoles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (!editingProfile) {
        // For new users, create auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: crypto.randomUUID(), // Generate a random password
          options: {
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Create profile
        const profileData = {
          id: authData.user.id,
          full_name: formData.full_name,
          company_id: formData.company_id || null
        };

        const newProfile = await createProfile(profileData);

        // Assign selected roles
        for (const roleId of formData.selectedRoles) {
          await assignUserRole(newProfile.id, roleId);
        }
      } else {
        // When editing, update profile data
        const updateData = {
          full_name: formData.full_name,
          company_id: formData.company_id || null
        };

        await updateProfile(editingProfile.id, updateData);

        // Update roles
        const currentUserRoles = userRoles
          .filter(ur => ur.user_id === editingProfile.id)
          .map(ur => ur.role_id);
        
        const rolesToAdd = Array.from(formData.selectedRoles)
          .filter(roleId => !currentUserRoles.includes(roleId));
        
        const rolesToRemove = currentUserRoles
          .filter(roleId => !formData.selectedRoles.has(roleId));

        // Add new roles
        for (const roleId of rolesToAdd) {
          await assignUserRole(editingProfile.id, roleId);
        }

        // Remove roles
        for (const roleId of rolesToRemove) {
          await removeUserRole(editingProfile.id, roleId);
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving profile:', error);
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    const profileRoles = userRoles
      .filter(ur => ur.user_id === profile.id)
      .map(ur => ur.role_id);

    setEditingProfile(profile);
    setFormData({
      email: '', // Email can't be edited
      full_name: profile.full_name || '',
      selectedRoles: new Set(profileRoles),
      company_id: profile.company_id || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteProfile(id);
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Failed to delete profile');
      }
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setEditingProfile(null);
    setFormData({
      email: '',
      full_name: '',
      selectedRoles: new Set(),
      company_id: ''
    });
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
    setFormData({
      email: '',
      full_name: '',
      selectedRoles: new Set(),
      company_id: ''
    });
    setFormError(null);
  };

  const getUserRoles = (userId: string): UserRole[] => {
    return userRoles
      .filter(ur => ur.user_id === userId)
      .map(ur => ({
        role_id: ur.role_id,
        role_name: ur.role_name || ''
      }));
  };

  if (profilesLoading || companiesLoading || rolesLoading || userRolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
          <PermissionGate permissions={['users_write']}>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </PermissionGate>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {profiles.map((profile) => {
              const userRolesList = getUserRoles(profile.id);
              return (
                <li key={profile.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || '')}&background=random`}
                        alt={profile.full_name || ''}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {companies.find(c => c.id === profile.company_id)?.name || 'No company'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {userRolesList.map((userRole) => (
                            <span
                              key={userRole.role_id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {userRole.role_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <PermissionGate permissions={['users_write']}>
                        <button
                          type="button"
                          onClick={() => handleEdit(profile)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(profile.id)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingProfile ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:px-6">
              {formError && (
                <div className="mb-4 p-4 bg-red-50 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {!editingProfile && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="user@example.com"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <select
                    name="company_id"
                    id="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">No company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles
                  </label>
                  <div className="space-y-2 border rounded-md p-2">
                    {roles.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleToggle(role.id)}
                        className="flex items-center w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-50"
                      >
                        <div className={`h-5 w-5 rounded border ${formData.selectedRoles.has(role.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                          {formData.selectedRoles.has(role.id) && <Shield className="h-3 w-3 text-white" />}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-gray-500 text-xs">{role.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : editingProfile ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
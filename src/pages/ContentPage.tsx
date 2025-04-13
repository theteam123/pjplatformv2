import React, { useState } from 'react';
import { FileText, Pencil, Trash2, X, Plus, Tag, Check, Square, AlertCircle, Link } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { useCompanies } from '../hooks/useCompanies';
import { useRoles } from '../hooks/useRoles';
import { useRoleContentPermissions } from '../hooks/useRoleContentPermissions';
import { PermissionGate } from '../components/PermissionGate';
import type { Database } from '../lib/database.types';

type Content = Database['public']['Tables']['content']['Row'];
type ContentInsert = Database['public']['Tables']['content']['Insert'];

const CATEGORIES = [
  'Forms',
  'Documents',
  'Reports',
  'Templates',
  'Policies',
];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ContentPage() {
  const { content, loading: contentLoading, createContent, updateContent, deleteContent } = useContent();
  const { companies, loading: companiesLoading } = useCompanies();
  const { roles, loading: rolesLoading } = useRoles();
  const { setContentPermissions, getContentPermissions } = useRoleContentPermissions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    companies: [] as string[],
    searchTerms: [] as string[],
    category: CATEGORIES[0],
    rolePermissions: {} as Record<string, { view: boolean; edit: boolean }>,
    settings: {
      allowAttachments: false,
      requireApproval: false,
      notifyOnSubmission: false
    }
  });
  const [searchTermInput, setSearchTermInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      companies: selectedOptions
    }));
    setFormError(null);
  };

  const handleAddSearchTerm = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTermInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        searchTerms: [...new Set([...prev.searchTerms, searchTermInput.trim().toLowerCase()])]
      }));
      setSearchTermInput('');
    }
  };

  const handleRemoveSearchTerm = (term: string) => {
    setFormData(prev => ({
      ...prev,
      searchTerms: prev.searchTerms.filter(t => t !== term)
    }));
  };

  const handleRolePermissionChange = (roleId: string, type: 'view' | 'edit') => {
    setFormData(prev => ({
      ...prev,
      rolePermissions: {
        ...prev.rolePermissions,
        [roleId]: {
          ...prev.rolePermissions[roleId] || { view: false, edit: false },
          [type]: !prev.rolePermissions[roleId]?.[type]
        }
      }
    }));
  };

  const handleSettingToggle = (setting: keyof typeof formData.settings) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: !prev.settings[setting]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setFormError(null);

      // Validate URL format if provided
      if (formData.url && !formData.url.match(/^https?:\/\/.+/)) {
        throw new Error('URL must start with http:// or https://');
      }

      // Filter out invalid UUIDs from company IDs
      const validCompanyIds = formData.companies.filter(id => UUID_REGEX.test(id));
      
      const contentData: ContentInsert = {
        name: formData.name,
        url: formData.url || null,
        description: formData.description || null,
        category: formData.category,
        company_ids: validCompanyIds,
        search_terms: formData.searchTerms,
        settings: formData.settings
      };

      console.log('Saving content:', contentData);
      console.log('Role permissions:', formData.rolePermissions);

      let savedContent;
      if (editingContent) {
        savedContent = await updateContent(editingContent.id, contentData);
      } else {
        savedContent = await createContent(contentData);
      }

      // Save role permissions
      await setContentPermissions(savedContent.id, formData.rolePermissions);

      handleCloseModal();
    } catch (error) {
      console.error('Error saving content:', error);
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (item: Content) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      // Get existing role permissions
      const permissions = await getContentPermissions(item.id);
      
      setEditingContent(item);
      setFormData({
        name: item.name,
        url: item.url || '',
        description: item.description || '',
        companies: item.company_ids || [],
        searchTerms: item.search_terms || [],
        category: item.category,
        rolePermissions: permissions,
        settings: item.settings as typeof formData.settings
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading content:', error);
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      try {
        await deleteContent(id);
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('Failed to delete content');
      }
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setEditingContent(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      companies: [],
      searchTerms: [],
      category: CATEGORIES[0],
      rolePermissions: {},
      settings: {
        allowAttachments: false,
        requireApproval: false,
        notifyOnSubmission: false
      }
    });
    setFormError(null);
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContent(null);
    setSearchTermInput('');
    setFormData({
      name: '',
      url: '',
      description: '',
      companies: [],
      searchTerms: [],
      category: CATEGORIES[0],
      rolePermissions: {},
      settings: {
        allowAttachments: false,
        requireApproval: false,
        notifyOnSubmission: false
      }
    });
    setFormError(null);
    setIsSubmitting(false);
  };

  if (contentLoading || companiesLoading || rolesLoading) {
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">Content Management</h3>
          <PermissionGate permissions={['content_write']}>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </button>
          </PermissionGate>
        </div>
        <div className="border-t border-gray-200">
          {content.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No content found. Click "Add Content" to create one.
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {content.map((item) => (
                <li key={item.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.url && (
                            <div className="text-sm text-gray-500">
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                              >
                                <Link className="h-4 w-4 mr-1" />
                                {item.url}
                              </a>
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {item.category}
                            </span>
                            {item.company_ids.length > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {item.company_ids.length} {item.company_ids.length === 1 ? 'company' : 'companies'}
                              </span>
                            )}
                            {item.search_terms.map(term => (
                              <span key={term} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                #{term}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <PermissionGate permissions={['content_write']}>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </PermissionGate>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingContent ? 'Edit Content' : 'Add New Content'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto">
                {formError && (
                  <div className="mb-4 p-4 bg-red-50 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <p className="text-sm text-red-700">{formError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Content Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Content Name
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

                  {/* URL */}
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                      URL
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        name="url"
                        id="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        placeholder="https://"
                        className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Companies - MultiSelect */}
                    <div>
                      <label htmlFor="companies" className="block text-sm font-medium text-gray-700">
                        Companies
                      </label>
                      <select
                        multiple
                        name="companies"
                        id="companies"
                        value={formData.companies}
                        onChange={handleCompanyChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        size={4}
                      >
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple options</p>
                    </div>
                  </div>

                  {/* Search Terms */}
                  <div>
                    <label htmlFor="searchTerms" className="block text-sm font-medium text-gray-700">
                      Search Terms
                    </label>
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.searchTerms.map(term => (
                          <span
                            key={term}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            #{term}
                            <button
                              type="button"
                              onClick={() => handleRemoveSearchTerm(term)}
                              className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-gray-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-gray-400 absolute ml-2" />
                        <input
                          type="text"
                          value={searchTermInput}
                          onChange={(e) => setSearchTermInput(e.target.value)}
                          onKeyDown={handleAddSearchTerm}
                          placeholder="Add search terms..."
                          className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Permissions
                    </label>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                              View
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                              Edit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {roles.map(role => (
                            <tr key={role.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {role.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRolePermissionChange(role.id, 'view')}
                                  className="focus:outline-none"
                                >
                                  <div className={`h-5 w-5 rounded border ${formData.rolePermissions[role.id]?.view ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center mx-auto`}>
                                    {formData.rolePermissions[role.id]?.view && <Check className="h-4 w-4 text-white" />}
                                  </div>
                                </button>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRolePermissionChange(role.id, 'edit')}
                                  className="focus:outline-none"
                                >
                                  <div className={`h-5 w-5 rounded border ${formData.rolePermissions[role.id]?.edit ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center mx-auto`}>
                                    {formData.rolePermissions[role.id]?.edit && <Check className="h-4 w-4 text-white" />}
                                  </div>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Settings
                    </label>
                    <div className="space-y-2 border rounded-md p-2">
                      <button
                        type="button"
                        onClick={() => handleSettingToggle('allowAttachments')}
                        className="flex items-center w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-50"
                      >
                        <div className={`h-5 w-5 rounded border ${formData.settings.allowAttachments ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                          {formData.settings.allowAttachments && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="ml-2">Allow Attachments</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettingToggle('requireApproval')}
                        className="flex items-center w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-50"
                      >
                        <div className={`h-5 w-5 rounded border ${formData.settings.requireApproval ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                          {formData.settings.requireApproval && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="ml-2">Require Approval</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettingToggle('notifyOnSubmission')}
                        className="flex items-center w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-50"
                      >
                        <div className={`h-5 w-5 rounded border ${formData.settings.notifyOnSubmission ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                          {formData.settings.notifyOnSubmission && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="ml-2">Notify on Submission</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : editingContent ? 'Save Changes' : 'Add Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
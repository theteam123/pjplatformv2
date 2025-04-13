import React, { useState, useEffect } from 'react';
import { Building2, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { useCompanies } from '../hooks/useCompanies';
import { PermissionGate } from '../components/PermissionGate';
import type { Database } from '../lib/database.types';

type Company = Database['public']['Tables']['companies']['Row'];

export default function CompaniesPage() {
  const { companies, loading, error, createCompany, updateCompany, deleteCompany } = useCompanies();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: ''
  });

  // Effect to handle company deletion while editing
  useEffect(() => {
    if (editingCompany && !companies.find(c => c.id === editingCompany.id)) {
      // Company was deleted while being edited
      handleCloseModal();
      alert('This company has been deleted by another user.');
    }
  }, [companies, editingCompany]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('Form input changed:', { field: name, value });
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null); // Clear any previous errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);
    
    try {
      const companyData = {
        name: formData.name.trim(),
        website: formData.website.trim() || null
      };

      console.log('Submitting company data:', {
        isEditing: !!editingCompany,
        companyId: editingCompany?.id,
        data: companyData
      });

      if (editingCompany) {
        // Verify company still exists in our local state
        const companyStillExists = companies.find(c => c.id === editingCompany.id);
        if (!companyStillExists) {
          throw new Error('This company has been deleted. Please refresh the page.');
        }

        // Validate company ID format
        if (!editingCompany.id || typeof editingCompany.id !== 'string' || !editingCompany.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          throw new Error('Invalid company ID format');
        }

        console.log('Updating existing company:', editingCompany.id);
        await updateCompany(editingCompany.id, companyData);
        console.log('Company updated successfully');
      } else {
        console.log('Creating new company');
        await createCompany(companyData);
        console.log('Company created successfully');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving company:', error);
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // If the company was deleted or not found, close the modal
      if (error instanceof Error && 
          (error.message.includes('not found') || 
           error.message.includes('been deleted'))) {
        handleCloseModal();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (company: Company) => {
    // Verify company still exists in our local state
    const currentCompany = companies.find(c => c.id === company.id);
    if (!currentCompany) {
      alert('This company has been deleted. The list will be refreshed.');
      return;
    }

    console.log('Editing company:', company);
    setEditingCompany(currentCompany); // Use the current data from our state
    setFormData({
      name: currentCompany.name,
      website: currentCompany.website || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Verify company still exists in our local state
    const companyExists = companies.find(c => c.id === id);
    if (!companyExists) {
      alert('This company has already been deleted.');
      return;
    }

    if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      try {
        console.log('Deleting company:', id);
        await deleteCompany(id);
        console.log('Company deleted successfully');
        
        // If we're currently editing this company, close the modal
        if (editingCompany?.id === id) {
          handleCloseModal();
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete company');
      }
    }
  };

  const handleOpenModal = () => {
    console.log('Opening company modal for new company');
    setIsModalOpen(true);
    setEditingCompany(null);
    setFormData({ name: '', website: '' });
    setFormError(null);
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    console.log('Closing company modal');
    setIsModalOpen(false);
    setEditingCompany(null);
    setFormData({ name: '', website: '' });
    setFormError(null);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <div className="text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Companies</h3>
          <PermissionGate permissions={['companies_write']}>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Add Company
            </button>
          </PermissionGate>
        </div>
        <div className="border-t border-gray-200">
          {companies.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No companies found. Click "Add Company" to create one.
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {companies.map((company) => (
                <li key={company.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">
                            {company.website ? (
                              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                {company.website}
                              </a>
                            ) : (
                              'No website'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <PermissionGate permissions={['companies_write']}>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(company)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(company.id)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
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
                  {isSubmitting ? 'Saving...' : editingCompany ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { mockForms } from '../../utils/mockData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const FormFillPage = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedStatus, setSavedStatus] = useState<'saved' | 'error' | null>(null);

  useEffect(() => {
    // Simulate API call to fetch form data
    const fetchForm = () => {
      setTimeout(() => {
        const foundForm = mockForms.find(f => f.id === id);
        setForm(foundForm);
        setLoading(false);
      }, 500);
    };

    fetchForm();
  }, [id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Example validation - in a real app, this would be more comprehensive
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.alienNumber?.trim()) {
      newErrors.alienNumber = 'A-Number is required';
    } else if (!/^A\d{9}$/.test(formData.alienNumber)) {
      newErrors.alienNumber = 'Invalid A-Number format (e.g., A123456789)';
    }
    if (!formData.dateOfBirth?.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSavedStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedStatus('saved');
      
      // Clear saved status after 3 seconds
      setTimeout(() => {
        setSavedStatus(null);
      }, 3000);
    } catch (error) {
      setSavedStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!form) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Form Not Found</h1>
        <p>The form you are looking for does not exist or has been removed.</p>
        <Link to="/forms" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          &larr; Back to Forms Library
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/forms" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{form.name}</h1>
            <p className="text-sm text-gray-500">Fill out this form carefully and accurately</p>
          </div>
        </div>
        <button
          onClick={() => window.open(`https://www.uscis.gov/forms/${form.name.split(',')[0].toLowerCase()}`, '_blank')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <Download size={18} className="mr-2" />
          Download PDF Version
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className={`mt-1 form-input ${errors.firstName ? 'border-error-500' : ''}`}
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-error-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className={`mt-1 form-input ${errors.lastName ? 'border-error-500' : ''}`}
                      value={formData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-error-500">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="alienNumber" className="block text-sm font-medium text-gray-700">
                      Alien Registration Number (A-Number)
                    </label>
                    <input
                      type="text"
                      id="alienNumber"
                      placeholder="A123456789"
                      className={`mt-1 form-input ${errors.alienNumber ? 'border-error-500' : ''}`}
                      value={formData.alienNumber || ''}
                      onChange={(e) => handleInputChange('alienNumber', e.target.value)}
                    />
                    {errors.alienNumber && (
                      <p className="mt-1 text-sm text-error-500">{errors.alienNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      className={`mt-1 form-input ${errors.dateOfBirth ? 'border-error-500' : ''}`}
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-error-500">{errors.dateOfBirth}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Current Physical Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      className="mt-1 form-input"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      className="mt-1 form-input"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      className="mt-1 form-input"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      className="mt-1 form-input"
                      value={formData.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="mt-1 form-input"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Form-specific fields would be dynamically generated here */}
            </div>

            <div className="mt-8 flex items-center justify-end space-x-4">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Form Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Form Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Filing Fee</p>
                <p className="font-medium">${form.fee}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Processing Time</p>
                <p className="font-medium">{form.processingTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Common Uses</p>
                <p className="font-medium">{form.commonUses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{form.lastUpdated}</p>
              </div>
            </div>
          </div>

          {/* Save Status */}
          {savedStatus && (
            <div className={`p-4 rounded-md ${
              savedStatus === 'saved' 
                ? 'bg-success-50 text-success-700' 
                : 'bg-error-50 text-error-700'
            }`}>
              <div className="flex items-center">
                {savedStatus === 'saved' ? (
                  <CheckCircle size={20} className="mr-2" />
                ) : (
                  <AlertCircle size={20} className="mr-2" />
                )}
                <p className="text-sm font-medium">
                  {savedStatus === 'saved' 
                    ? 'Progress saved successfully' 
                    : 'Failed to save progress'}
                </p>
              </div>
            </div>
          )}

          {/* Help Box */}
          <div className="bg-primary-50 rounded-lg p-6">
            <h3 className="text-primary-800 font-medium mb-2">Need Help?</h3>
            <p className="text-sm text-primary-600 mb-4">
              Our team is here to assist you with any questions about filling out this form.
            </p>
            <button className="w-full btn btn-primary">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormFillPage;
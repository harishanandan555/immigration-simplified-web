import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthControllers';
import Logo from '../../components/layout/Logo';
import { Shield, Users, Building, Check, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type UserType = 'individual' | 'company';
type SubscriptionPlan = 'starter' | 'family';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [step, setStep] = useState<'type' | 'plan' | 'form'>('type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep('plan');
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSubscriptionPlan(plan);
    setStep('form');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (userType === 'company' && !formData.companyName) {
        throw new Error('Company name is required');
      }

      // Register user
      await registerUser(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        userType === 'company' ? 'company' : 'individual',
        '', // superadminId
        '', // attorneyId
        '' // companyId
      );

      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderUserTypeSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Choose Account Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleUserTypeSelect('individual')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Individual</h3>
          <p className="text-gray-600 text-center">
            Perfect for personal immigration needs
          </p>
        </button>

        <button
          onClick={() => handleUserTypeSelect('company')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center mb-4">
            <Building className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Company</h3>
          <p className="text-gray-600 text-center">
            For businesses managing multiple cases
          </p>
        </button>
      </div>
    </div>
  );

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handlePlanSelect('starter')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Starter</h3>
          <p className="text-gray-600 text-center mb-4">
            Single user subscription
          </p>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Basic form filling
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Document upload
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Email support
            </li>
          </ul>
        </button>

        <button
          onClick={() => handlePlanSelect('family')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Family</h3>
          <p className="text-gray-600 text-center mb-4">
            Up to 5 users
          </p>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              All Starter features
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Multiple user accounts
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Priority support
            </li>
          </ul>
        </button>
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {userType === 'company' && (
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            required
            value={formData.companyName}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          value={formData.password}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Creating account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:flex-1 p-12 items-start border-r border-gray-100 overflow-y-auto h-screen [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-8 flex items-center text-gray-900">
              <Shield className="mr-3 h-8 w-8 text-primary-600" />
              Why Choose Immigration-Simplified?
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Error Prevention
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our intelligent system prevents common mistakes and ensures accuracy in your applications.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Time Savings
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Automate repetitive tasks and focus on what matters most - your immigration journey.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Smart Form Library
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Access the latest USCIS forms instantly. Our library updates automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex items-center justify-center p-8 sticky top-0 h-screen">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-block p-3 rounded-full bg-primary-50 mb-4">
                <Logo className="h-12 w-12 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Immigration-Simplified
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                by Efile legal
              </p>
            </div>

            {step === 'type' && renderUserTypeSelection()}
            {step === 'plan' && renderPlanSelection()}
            {step === 'form' && renderRegistrationForm()}

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 
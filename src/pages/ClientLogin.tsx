import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import toast from 'react-hot-toast';

const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for pre-filled email and stored credentials
  useEffect(() => {
    // Check for pre-filled email from redirect
    const prefillEmail = sessionStorage.getItem('prefill_email');
    if (prefillEmail) {
      setFormData(prev => ({ ...prev, email: prefillEmail }));
      sessionStorage.removeItem('prefill_email');
    }
    
    // Check for stored client credentials
    const checkStoredCredentials = async () => {
      try {
        const { getStoredClientCredentials } = await import('../utils/clientLoginHelper');
        const storedCredentials = getStoredClientCredentials();
        if (storedCredentials && (!prefillEmail || storedCredentials.email === prefillEmail)) {
          setFormData({
            email: storedCredentials.email,
            password: storedCredentials.password
          });
          console.log('✅ Pre-filled login form with stored client credentials');
        }
      } catch (error) {
        console.warn('Could not load stored credentials:', error);
      }
    };
    
    checkStoredCredentials();
  }, []);

  // Redirect after successful login
  useEffect(() => {
    if (user) {
      if (user.role === 'client') {
        navigate('/my-questionnaires');
        toast.success('Welcome to your client portal!');
      } else {
        navigate('/dashboard');
        toast.success('Welcome back!');
      }
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      // Navigation will be handled by the useEffect above when user state updates
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Client Portal
          </h1>
          <p className="text-gray-600">
            Access your questionnaires and case information
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Use the email and password provided by your attorney
            </p>
            <div className="text-xs text-gray-500">
              <p>First time logging in? Please change your password after signing in.</p>
            </div>
          </div>

          {/* Attorney Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Are you an attorney or paralegal?
            </p>
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Access Attorney Portal →
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your attorney or 
            <a href="mailto:support@immigration-simplified.com" className="text-blue-600 hover:text-blue-700 ml-1">
              our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;

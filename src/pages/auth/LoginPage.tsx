import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth, login } from '../../controllers/AuthControllers';
import { useAuth } from '../../controllers/AuthControllers';
import Logo from '../../components/layout/Logo';
import { Eye, EyeOff, Shield, Clock, CheckSquare, FileText, AlertCircle, Users, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// interface LoginResponse {
//   status: number;
//   data?: {
//     token?: string;
//     user?: {
//       id: string;
//       email: string;
//       firstName: string;
//       lastName: string;
//       role: string;
//     };
//   };
//   message?: string;
// }

const LoginPage: React.FC = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
        
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');

      // const response = await login(email, password) as LoginResponse;
      
      // if (response.status === 200 && response.data?.token) {
      //   // Store both token and user data
      //   localStorage.setItem('token', response.data.token);
      //   localStorage.setItem('user', JSON.stringify(response.data));        
      //   // Navigate to dashboard
      //   navigate('/dashboard');

      // } else {
      //   throw new Error(response.message || 'Login failed');
      // }

    } catch (err) {
      // const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      const errorMessage = 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setLoading(false);
    }
  };

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
                <h3 className="flex items-center text-xl font-semibold mb-4 text-gray-900">
                  <AlertCircle className="mr-2 h-6 w-6 text-primary-600" />
                  Error Prevention
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Immigration forms are complex, and small errors can lead to delays or denials. Our intelligent system prevents common mistakes and ensures accuracy in your applications.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="flex items-center text-xl font-semibold mb-4 text-gray-900">
                  <Clock className="mr-2 h-6 w-6 text-primary-600" />
                  Time Savings for Law Firms
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Automate repetitive tasks and focus on what matters most - your clients. Our platform reduces form completion time by up to 75%.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="flex items-center text-xl font-semibold mb-4 text-gray-900">
                  <Users className="mr-2 h-6 w-6 text-primary-600" />
                  Streamlined Document Review
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our advanced workflow system allows attorneys to focus on case strategy while ensuring all documentation is properly prepared and reviewed.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="flex items-center text-xl font-semibold mb-4 text-gray-900">
                  <FileText className="mr-2 h-6 w-6 text-primary-600" />
                  Smart Form Library
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Access the latest USCIS forms instantly. Our library updates automatically, ensuring you always work with current versions.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="flex items-center text-xl font-semibold mb-4 text-gray-900">
                  <CheckSquare className="mr-2 h-6 w-6 text-primary-600" />
                  Consistency Checks
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our advanced validation system cross-references all documents, catching discrepancies before they become issues with USCIS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 sticky top-0 h-screen">
        <div className="w-full max-w-md">
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

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-error-50 border border-error-200">
                  <p className="text-sm text-error-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Register now
                  </button>
                </p>
              </div>
            </form>
            
          </div>
        </div>
      </div>
    </div>
  );

};

export default LoginPage;
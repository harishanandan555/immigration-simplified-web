import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText, Users, Mail, MapPin, Loader2 } from 'lucide-react';
import { getPrivacyPolicy, PrivacyPolicy } from '../controllers/PrivacyPolicyController';

const PrivacyPolicyPage: React.FC = () => {
  const [policyData, setPolicyData] = useState<PrivacyPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentDate = policyData?.effectiveDate 
    ? new Date(policyData.effectiveDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Try to fetch Privacy Policy from API, fallback to static content if it fails
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await getPrivacyPolicy();
        setPolicyData(data);
      } catch (error) {
        console.log('Could not fetch Privacy Policy from API, using static content:', error);
        // Continue with static content if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-blue-100 mt-1">Effective Date: {currentDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Immigration Simplified ("Company," "we," "our," or "us") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and protect information when you access our website or use our services (the "Services").
            </p>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                1. Information We Collect
              </h2>
              
              <div className="ml-8 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">a. Information You Provide</h3>
                  <p className="text-gray-700 mb-2">
                    We may collect the following information when you use our Services:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Name, email address, and phone number</li>
                    <li>Mailing address and date of birth</li>
                    <li>Immigration-related information that you voluntarily provide</li>
                    <li>Payment information (processed securely by third-party payment providers)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">b. Automatically Collected Information</h3>
                  <p className="text-gray-700 mb-2">
                    When you use our Services, we may automatically collect:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>IP address and device identifiers</li>
                    <li>Browser type and operating system</li>
                    <li>Usage data, logs, and cookies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-2">
                We use your information to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Provide and manage our Services</li>
                <li>Prepare and review immigration-related documents</li>
                <li>Communicate with you about your account or requests</li>
                <li>Process payments and help prevent fraud</li>
                <li>Improve security, functionality, and user experience</li>
                <li>Comply with applicable laws and regulations</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                3. Disclosure of Information
              </h2>
              <p className="text-gray-700 mb-2">
                We do not sell your personal information. We may share information only with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Licensed immigration attorneys, with your consent</li>
                <li>Trusted service providers who are bound by confidentiality obligations</li>
                <li>Government authorities when required by law</li>
                <li>A successor entity in the event of a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-blue-600" />
                4. Data Security
              </h2>
              <p className="text-gray-700">
                We use reasonable administrative, technical, and physical safeguards to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights (Texas Residents)</h2>
              <p className="text-gray-700">
                Texas residents may request access to, correction of, or deletion of their personal data by contacting us at the email address listed below. We will respond as required by applicable law.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
              <p className="text-gray-700">
                We use cookies and similar technologies to improve functionality and analyze usage. You can disable cookies in your browser settings, but some features of the Services may not work properly.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700">
                Our Services are not intended for children under the age of 13. We do not knowingly collect personal information from children.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                9. Contact Information
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:privacy@immigrationsimplified.com" className="text-blue-600 hover:text-blue-700">privacy@immigrationsimplified.com</a>
                </p>
                <p className="text-gray-700 flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Address:</strong> [Insert Texas Business Address]</span>
                </p>
              </div>
            </section>

            {/* Important Notice */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
              <p className="text-sm text-gray-700">
                <strong>Important for Immigration / Legal Services:</strong> Since our app deals with immigration data (highly sensitive), we always require explicit consent, log consent before collecting personal data, and keep this policy public and readable without login.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;


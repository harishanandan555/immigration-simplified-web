import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Ban, XCircle, Gavel, Mail, MapPin, Loader2, FileCheck } from 'lucide-react';
import { getTermsOfService, TermsOfService } from '../controllers/TermsOfServiceController';

const TermsOfServicePage: React.FC = () => {
  const [termsData, setTermsData] = useState<TermsOfService | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentDate = termsData?.effectiveDate 
    ? new Date(termsData.effectiveDate).toLocaleDateString('en-US', { 
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

  // Try to fetch Terms of Service from API, fallback to static content if it fails
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const data = await getTermsOfService();
        setTermsData(data);
      } catch (error) {
        console.log('Could not fetch Terms of Service from API, using static content:', error);
        // Continue with static content if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  // Static Terms of Service content (fallback if API fails)
  const staticTerms: TermsOfService = {
    effectiveDate: new Date().toISOString().split('T')[0],
    version: 'v1.0',
    content: {
      title: 'Terms of Service',
      company: 'Immigration Simplified',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          text: "By accessing or using Immigration Simplified's website or services (\"Services\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree, do not use the Services."
        },
        {
          heading: '2. Nature of Services',
          text: 'Immigration Simplified provides technology-enabled immigration document preparation and support services.\n\nImportant Disclosures:\n\n• Immigration Simplified is not a law firm\n• Use of the Services does not create an attorney-client relationship\n• We do not provide legal advice unless explicitly stated'
        },
        {
          heading: '3. User Responsibilities',
          text: 'You agree to:\n\n• Provide accurate, complete, and truthful information\n• Review all documents before submission\n• Use the Services only for lawful purposes\n• Maintain confidentiality of your login credentials\n\nYou acknowledge that you are solely responsible for the accuracy of all information submitted to government agencies.'
        },
        {
          heading: '4. Fees and Payments',
          text: 'All fees are disclosed prior to purchase. Payments are non-refundable unless otherwise stated in writing. Government filing fees are separate and not included.'
        },
        {
          heading: '5. No Guarantee of Outcome',
          text: 'Immigration decisions are made solely by government authorities. We do not guarantee approvals, processing times, or outcomes.'
        },
        {
          heading: '6. Intellectual Property',
          text: 'All content, software, trademarks, and materials are owned by Immigration Simplified or its licensors and are protected by applicable intellectual property laws.'
        },
        {
          heading: '7. Prohibited Use',
          text: 'You may not:\n\n• Use the Services for fraudulent or unlawful purposes\n• Attempt unauthorized access to systems\n• Interfere with platform security or operations'
        },
        {
          heading: '8. Limitation of Liability',
          text: 'To the maximum extent permitted by Texas law, Immigration Simplified shall not be liable for indirect, incidental, special, or consequential damages, including loss of data, profits, or immigration opportunities.'
        },
        {
          heading: '9. Indemnification',
          text: 'You agree to indemnify and hold harmless Immigration Simplified from claims arising out of your misuse of the Services, violation of these Terms, or submission of false information.'
        },
        {
          heading: '10. Termination',
          text: 'We reserve the right to suspend or terminate access to the Services for violations of these Terms.'
        },
        {
          heading: '11. Governing Law and Venue',
          text: 'These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law principles. Venue shall lie exclusively in the state or federal courts located in Texas.'
        },
        {
          heading: '12. Modifications',
          text: 'We may modify these Terms at any time. Continued use of the Services constitutes acceptance of the updated Terms.'
        },
        {
          heading: '13. Contact Information',
          text: 'Email: [Insert Contact Email]\nAddress: [Insert Texas Business Address]'
        }
      ]
    }
  };

  const displayTerms = termsData || staticTerms;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Terms of Service...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-10 w-10 text-white" strokeWidth={2} />
              <span className="text-xl font-semibold text-white">Immigration Simplified</span>
            </div>
            <div className="h-10 w-px bg-blue-300"></div>
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10" />
              <div>
                <h1 className="text-3xl font-bold">Terms of Service</h1>
                <p className="text-blue-100 mt-1">Effective Date: {currentDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Immigration Simplified ("Company," "we," "our," or "us") provides technology-enabled immigration document preparation and support services. These Terms of Service ("Terms") govern your access to and use of our website and services (the "Services").
            </p>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700">
                By accessing or using Immigration Simplified's website or services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                2. Nature of Services
              </h2>
              <p className="text-gray-700 mb-2">
                Immigration Simplified provides technology-enabled immigration document preparation and support services.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">Important Disclosures:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Immigration Simplified is not a law firm</li>
                  <li>Use of the Services does not create an attorney-client relationship</li>
                  <li>We do not provide legal advice unless explicitly stated</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                3. User Responsibilities
              </h2>
              <p className="text-gray-700 mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Provide accurate, complete, and truthful information</li>
                <li>Review all documents before submission</li>
                <li>Use the Services only for lawful purposes</li>
                <li>Maintain confidentiality of your login credentials</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You acknowledge that you are solely responsible for the accuracy of all information submitted to government agencies.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Fees and Payments</h2>
              <p className="text-gray-700">
                All fees are disclosed prior to purchase. Payments are non-refundable unless otherwise stated in writing. Government filing fees are separate and not included.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
                5. No Guarantee of Outcome
              </h2>
              <p className="text-gray-700">
                Immigration decisions are made solely by government authorities. We do not guarantee approvals, processing times, or outcomes.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700">
                All content, software, trademarks, and materials are owned by Immigration Simplified or its licensors and are protected by applicable intellectual property laws.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ban className="h-6 w-6 text-blue-600" />
                7. Prohibited Use
              </h2>
              <p className="text-gray-700 mb-2">You may not:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Use the Services for fraudulent or unlawful purposes</li>
                <li>Attempt unauthorized access to systems</li>
                <li>Interfere with platform security or operations</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="h-6 w-6 text-blue-600" />
                8. Limitation of Liability
              </h2>
              <p className="text-gray-700">
                To the maximum extent permitted by Texas law, Immigration Simplified shall not be liable for indirect, incidental, special, or consequential damages, including loss of data, profits, or immigration opportunities.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                9. Indemnification
              </h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless Immigration Simplified from claims arising out of your misuse of the Services, violation of these Terms, or submission of false information.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-blue-600" />
                10. Termination
              </h2>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate access to the Services for violations of these Terms.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gavel className="h-6 w-6 text-blue-600" />
                11. Governing Law and Venue
              </h2>
              <p className="text-gray-700">
                These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law principles. Venue shall lie exclusively in the state or federal courts located in Texas.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Modifications</h2>
              <p className="text-gray-700">
                We may modify these Terms at any time. Continued use of the Services constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                13. Contact Information
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:legal@immigrationsimplified.com" className="text-blue-600 hover:text-blue-700">legal@immigrationsimplified.com</a>
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
                <strong>Important:</strong> By using Immigration Simplified's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These Terms constitute a legally binding agreement between you and Immigration Simplified.
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

export default TermsOfServicePage;


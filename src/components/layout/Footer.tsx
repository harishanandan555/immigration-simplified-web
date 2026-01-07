import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-50 border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm">© {new Date().getFullYear()} Immigration Simplified. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link
              to="/privacy-policy"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>

            <Link
              to="/terms-of-service"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
            {/* <span className="text-gray-300">|</span> */}

            {/* <a
              href="mailto:privacy@immigrationsimplified.com"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contact
            </a> */}

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


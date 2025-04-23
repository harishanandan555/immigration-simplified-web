import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
      <FileQuestion className="h-24 w-24 text-gray-400 mb-8" />
      
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
        404 - Page Not Found
      </h1>
      
      <p className="mt-4 text-lg text-gray-500 max-w-md">
        We couldn't find the page you're looking for. The page may have been moved, deleted, or never existed.
      </p>
      
      <div className="mt-10">
        <Link
          to="/"
          className="btn btn-primary"
        >
          Go back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
import { FileCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = 'h-6 w-6' }) => {
  return (
    <div className={`${className} text-primary-600`}>
      <FileCheck strokeWidth={2} />
    </div>
  );
};

export default Logo;
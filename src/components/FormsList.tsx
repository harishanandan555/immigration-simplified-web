import React from 'react';
import { DocumentIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import '../styles/FormsList.css';

interface Form {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'not-started';
  requirements: string[];
}

interface FormsCategory {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  forms: Form[];
}

interface FormsListProps {
  categories: FormsCategory[];
  onFormClick: (formId: string) => void;
  onDownloadClick: (formId: string) => void;
}

const FormsList: React.FC<FormsListProps> = ({ categories, onFormClick, onDownloadClick }) => {
  const getStatusIcon = (status: Form['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="status-icon text-emerald-500" />;
      case 'pending':
        return <ClockIcon className="status-icon text-amber-500" />;
      default:
        return <ExclamationCircleIcon className="status-icon text-gray-400" />;
    }
  };

  const getStatusText = (status: Form['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <div className="forms-list">
      <div className="forms-header">
        <h2>Required Forms</h2>
        <p>Please complete all the required forms for your immigration process</p>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="forms-category">
          <h3>
            <category.icon className="category-icon" />
            {category.name}
          </h3>
          <div className="forms-grid">
            {category.forms.map((form) => (
              <div key={form.id} className="form-card">
                <div className="form-card-header">
                  <DocumentIcon className="form-icon" />
                  <h4 className="form-title">{form.title}</h4>
                </div>
                <p className="form-description">{form.description}</p>
                
                <div className="form-requirements">
                  <h5 className="requirements-title">Requirements:</h5>
                  <ul className="requirements-list">
                    {form.requirements.map((requirement, index) => (
                      <li key={index} className="requirement-item">
                        <CheckCircleIcon className="requirement-icon" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="form-status">
                  {getStatusIcon(form.status)}
                  <span className={`status-text ${form.status}`}>
                    {getStatusText(form.status)}
                  </span>
                </div>

                <div className="form-actions">
                  <button
                    className="primary"
                    onClick={() => onFormClick(form.id)}
                  >
                    {form.status === 'not-started' ? 'Start Form' : 'Continue Form'}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => onDownloadClick(form.id)}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormsList; 
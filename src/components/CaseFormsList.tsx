import React from 'react';
import { DocumentIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import '../styles/CaseFormsList.css';

interface Form {
  id: string;
  formNumber: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'not-started';
  requirements: string[];
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

interface CaseType {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
    forms: Form[];
  }[];
}

interface CaseFormsListProps {
  caseTypes: CaseType[];
  onFormClick: (formId: string) => void;
  onDownloadClick: (formId: string) => void;
}

const CaseFormsList: React.FC<CaseFormsListProps> = ({ caseTypes, onFormClick, onDownloadClick }) => {
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

  const getPriorityBadge = (priority: Form['priority']) => {
    const styles = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };

    return (
      <span className={`priority-badge ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  return (
    <div className="case-forms-list">
      {caseTypes.map((caseType) => (
        <div key={caseType.id} className="case-type-section">
          <h2 className="case-type-title">{caseType.name}</h2>
          
          {caseType.subcategories.map((subcategory) => (
            <div key={subcategory.id} className="subcategory-section">
              <h3 className="subcategory-title">{subcategory.name}</h3>
              
              <div className="forms-table">
                <div className="forms-table-header">
                  <div className="form-number">Form Number</div>
                  <div className="form-title">Title</div>
                  <div className="form-status">Status</div>
                  <div className="form-due-date">Due Date</div>
                  <div className="form-priority">Priority</div>
                  <div className="form-actions">Actions</div>
                </div>

                {subcategory.forms.map((form) => (
                  <div key={form.id} className="form-row">
                    <div className="form-number">
                      <span className="form-number-text">{form.formNumber}</span>
                    </div>
                    
                    <div className="form-title">
                      <div className="form-title-main">{form.title}</div>
                      <div className="form-description">{form.description}</div>
                    </div>
                    
                    <div className="form-status">
                      {getStatusIcon(form.status)}
                      <span className={`status-text ${form.status}`}>
                        {getStatusText(form.status)}
                      </span>
                    </div>
                    
                    <div className="form-due-date">
                      {form.dueDate ? (
                        <span className="due-date-text">{form.dueDate}</span>
                      ) : (
                        <span className="no-due-date">No due date</span>
                      )}
                    </div>
                    
                    <div className="form-priority">
                      {getPriorityBadge(form.priority)}
                    </div>
                    
                    <div className="form-actions">
                      <button
                        className="action-button primary"
                        onClick={() => onFormClick(form.id)}
                      >
                        {form.status === 'not-started' ? 'Start' : 'Continue'}
                      </button>
                      <button
                        className="action-button secondary"
                        onClick={() => onDownloadClick(form.id)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CaseFormsList; 
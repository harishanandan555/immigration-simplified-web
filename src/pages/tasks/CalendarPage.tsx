import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckSquare,
  Clock,
  AlertCircle
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, isWithinInterval, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { mockTasks, mockCases } from '../../utils/mockData';

const CalendarPage = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Get tasks for the selected month
  const monthTasks = mockTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return isWithinInterval(taskDate, {
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth)
    });
  });

  // Get tasks for the selected date
  const selectedDateTasks = selectedDate 
    ? monthTasks.filter(task => isSameDay(new Date(task.dueDate), selectedDate))
    : [];

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Custom day content to show task indicators
  const getDayContent = (day: Date) => {
    const dayTasks = monthTasks.filter(task => 
      isSameDay(new Date(task.dueDate), day)
    );

    if (dayTasks.length === 0) return null;

    const hasOverdue = dayTasks.some(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'Completed'
    );
    const hasHighPriority = dayTasks.some(task => task.priority === 'High');

    return (
      <div className="flex flex-col items-center">
        <div className="flex gap-1 mt-1">
          {hasOverdue && (
            <div className="h-1.5 w-1.5 rounded-full bg-error-500" />
          )}
          {hasHighPriority && (
            <div className="h-1.5 w-1.5 rounded-full bg-warning-500" />
          )}
          {!hasOverdue && !hasHighPriority && (
            <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          <p className="text-gray-500 mt-1">View and manage tasks by date</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/tasks"
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            <CheckSquare size={18} />
            <span>List View</span>
          </Link>
          {/* <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            modifiers={{
              hasTasks: (day) => monthTasks.some(task => 
                isSameDay(new Date(task.dueDate), day)
              )
            }}
            modifiersStyles={{
              hasTasks: {
                fontWeight: 'bold'
              }
            }}
            components={{
              DayContent: ({ date }) => (
                <div className="relative">
                  <div>{format(date, 'd')}</div>
                  {getDayContent(date)}
                </div>
              )
            }}
            styles={{
              months: { margin: '0' },
              caption: { marginBottom: '1rem' },
              caption_label: { fontSize: '1.1rem', fontWeight: '600' },
              nav_button: { 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '0.5rem',
                color: '#4b5563'
              },
              table: { width: '100%' },
              head_cell: { 
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              },
              cell: { 
                padding: '0.75rem',
                fontSize: '0.875rem'
              },
              day: {
                margin: '0',
                width: '2.5rem',
                height: '2.5rem',
                fontSize: '0.875rem'
              }
            }}
            className="w-full"
          />
        </div>

        {/* Tasks for selected date */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
            </h2>
            {selectedDate && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Task
              </button>
            )}
          </div>

          {selectedDateTasks.length > 0 ? (
            <div className="space-y-4">
              {selectedDateTasks.map((task) => {
                const relatedCase = mockCases.find(c => c.id === task.caseId);
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                
                return (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      isOverdue 
                        ? 'border-error-200 bg-error-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {task.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <Link 
                            to={`/cases/${relatedCase?.id}`}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            {relatedCase?.caseNumber}
                          </Link>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                      {isOverdue && (
                        <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks scheduled</h3>
              {selectedDate && (
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new task for this date.
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-error-500" />
                <span className="text-sm text-gray-600">Overdue Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning-500" />
                <span className="text-sm text-gray-600">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary-500" />
                <span className="text-sm text-gray-600">Normal Tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
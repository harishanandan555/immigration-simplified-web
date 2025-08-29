# Reports Feature Documentation

## Overview

The Reports feature provides comprehensive reporting and analytics capabilities for the Immigration-Simplified application. It allows attorneys, paralegals, and super admins to generate, view, and export various types of reports related to cases, clients, documents, users, and financial data.

## Features

### 1. Report Types
- **Case Reports**: Track case status, progress, and performance metrics
- **Client Reports**: Monitor client information, case counts, and activity
- **Document Reports**: Analyze document uploads, types, and verification status
- **User Reports**: Track team member performance and activity
- **Financial Reports**: Monitor revenue, expenses, and billing information
- **Custom Reports**: Create tailored reports for specific needs

### 2. Data Visualization
- **Bar Charts**: Compare data across categories
- **Pie Charts**: Show distribution and percentages
- **Line Charts**: Track trends over time
- **Interactive Charts**: Hover for detailed information
- **Responsive Design**: Adapts to different screen sizes

### 3. Filtering & Customization
- **Date Range Selection**: Filter data by specific time periods
- **Status Filters**: Filter by case status, priority, type
- **Grouping Options**: Group data by various fields
- **Chart Type Selection**: Choose between bar, pie, and line charts
- **Real-time Updates**: Apply filters and see immediate results

### 4. Export Capabilities
- **Multiple Formats**: PDF, Excel, CSV, HTML
- **Scheduled Reports**: Automate report generation
- **Email Delivery**: Send reports to recipients
- **Download Options**: Direct download or email links

## Architecture

### Components

#### 1. ReportsPage (`src/pages/reports/ReportsPage.tsx`)
Main page component that displays:
- Quick statistics dashboard
- Interactive charts
- Data tables
- Report management interface
- Filter controls

#### 2. CreateReportModal (`src/components/reports/CreateReportModal.tsx`)
Modal component for creating new reports with:
- Report configuration form
- Type and format selection
- Parameter settings
- Validation and error handling

#### 3. ReportControllers (`src/controllers/ReportControllers.tsx`)
API controllers for:
- CRUD operations on reports
- Data retrieval for different report types
- Report generation and scheduling
- Export functionality

### Data Models

#### Report Interface
```typescript
interface Report {
  _id: string;
  name: string;
  type: 'case' | 'client' | 'document' | 'user' | 'financial' | 'custom';
  category: string;
  description: string;
  parameters: ReportParameters;
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV' | 'HTML';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

#### Report Parameters
```typescript
interface ReportParameters {
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    status?: string[];
    type?: string[];
    priority?: string[];
    assignedTo?: string[];
    clientId?: string[];
    caseId?: string[];
  };
  grouping?: string[];
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  limit?: number;
}
```

### API Endpoints

The Reports feature uses the following API endpoints:

```typescript
export const REPORT_END_POINTS = {
  GET_REPORTS: "/api/v1/reports",
  GET_REPORT_BY_ID: "/api/v1/reports/:id",
  CREATE_REPORT: "/api/v1/reports",
  UPDATE_REPORT: "/api/v1/reports/:id",
  DELETE_REPORT: "/api/v1/reports/:id",
  GENERATE_REPORT: "/api/v1/reports/generate",
  DOWNLOAD_REPORT: "/api/v1/reports/:id/download",
  SCHEDULE_REPORT: "/api/v1/reports/:id/schedule",
  GET_SCHEDULED_REPORTS: "/api/v1/reports/scheduled",
  GET_REPORT_ANALYTICS: "/api/v1/reports/:id/analytics",
  
  // Report Data Endpoints
  GET_CASE_REPORT_DATA: "/api/v1/reports/cases/data",
  GET_CLIENT_REPORT_DATA: "/api/v1/reports/clients/data",
  GET_DOCUMENT_REPORT_DATA: "/api/v1/reports/documents/data",
  GET_USER_REPORT_DATA: "/api/v1/reports/users/data",
  GET_FINANCIAL_REPORT_DATA: "/api/v1/reports/financial/data",
  
  // Report Templates
  GET_REPORT_TEMPLATES: "/api/v1/reports/templates",
  GET_REPORT_TEMPLATE_BY_ID: "/api/v1/reports/templates/:id",
  CREATE_REPORT_TEMPLATE: "/api/v1/reports/templates",
  UPDATE_REPORT_TEMPLATE: "/api/v1/reports/templates/:id",
  DELETE_REPORT_TEMPLATE: "/api/v1/reports/templates/:id",
  
  // Report Categories
  GET_REPORT_CATEGORIES: "/api/v1/reports/categories",
  GET_REPORT_TYPES: "/api/v1/reports/types"
};
```

## Usage

### Accessing Reports
1. Navigate to `/reports` in the application
2. Ensure you have appropriate permissions (attorney, paralegal, or super admin)
3. View the dashboard with quick statistics and charts

### Creating a New Report
1. Click the "New Report" button
2. Fill in the report configuration form:
   - Name and description
   - Report type and category
   - Output format
   - Active status
3. Click "Create Report" to save

### Filtering Data
1. Click the "Filters" button to expand filter options
2. Set date range for data analysis
3. Choose chart type (bar, pie, line)
4. Select grouping field
5. Click "Apply Filters" to update charts and tables

### Generating Reports
1. In the Saved Reports table, click the download icon
2. Choose your preferred format (PDF, Excel, CSV, HTML)
3. The report will be generated and downloaded

## Permissions

### Role-Based Access
- **Attorneys**: Full access to all reports and analytics
- **Paralegals**: Access to case, client, and document reports
- **Super Admins**: Full access including financial and user reports
- **Clients**: No access to reports (redirected to appropriate pages)

### Permission Modules
Reports are part of the `REPORTS` permission module with actions:
- `READ`: View reports and data
- `CREATE`: Create new reports
- `UPDATE`: Modify existing reports
- `DELETE`: Remove reports
- `EXPORT`: Generate and download reports

## Styling

### CSS Classes
The Reports feature uses custom CSS classes for consistent styling:
- `.reports-page`: Main page container
- `.reports-header`: Page header with gradient background
- `.reports-stats-grid`: Statistics dashboard grid
- `.reports-chart-container`: Chart wrapper styling
- `.reports-table`: Data table styling
- `.reports-filters`: Filter section styling

### Responsive Design
- Mobile-first approach
- Grid layouts that adapt to screen size
- Chart containers that resize appropriately
- Touch-friendly controls for mobile devices

## Dependencies

### External Libraries
- **Recharts**: Chart visualization library
- **Lucide React**: Icon library
- **React Router**: Navigation and routing

### Internal Dependencies
- **AuthControllers**: User authentication and role checking
- **API utilities**: HTTP request handling
- **Common components**: Reusable UI components

## Future Enhancements

### Planned Features
1. **Advanced Filtering**: Multi-select filters, saved filter presets
2. **Report Templates**: Pre-configured report layouts
3. **Scheduled Reports**: Automated report generation and delivery
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Data Export**: Bulk data export in various formats
6. **Report Sharing**: Collaborative report viewing and sharing
7. **Advanced Analytics**: Statistical analysis and trend detection

### Technical Improvements
1. **Caching**: Implement data caching for better performance
2. **Real-time Updates**: WebSocket integration for live data
3. **Offline Support**: Progressive Web App capabilities
4. **Performance Optimization**: Lazy loading and virtualization
5. **Accessibility**: Enhanced screen reader support

## Troubleshooting

### Common Issues

#### Charts Not Displaying
- Check if data is being loaded correctly
- Verify chart container dimensions
- Ensure Recharts library is properly imported

#### API Errors
- Check network connectivity
- Verify API endpoint configuration
- Review server logs for detailed error messages

#### Permission Issues
- Confirm user role and permissions
- Check if user is properly authenticated
- Verify route protection is working

### Debug Information
- Browser console logs for client-side errors
- Network tab for API request/response details
- React DevTools for component state inspection

## Testing

### Manual Testing
1. **Access Control**: Verify role-based access restrictions
2. **Data Loading**: Test report data retrieval
3. **Chart Rendering**: Verify different chart types display correctly
4. **Filter Functionality**: Test date range and grouping filters
5. **Export Features**: Test report generation and download

### Automated Testing
- Unit tests for controllers and utilities
- Component tests for React components
- Integration tests for API endpoints
- E2E tests for complete user workflows

## Support

For technical support or feature requests related to the Reports feature:
1. Check the application logs for error details
2. Review this documentation for usage instructions
3. Contact the development team with specific issues
4. Submit feature requests through the project management system

---

*Last updated: January 2025*
*Version: 1.0.0*

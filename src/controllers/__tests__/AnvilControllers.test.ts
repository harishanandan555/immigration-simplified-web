import { 
  fillPdfTemplate, 
  fillPdfTemplateBlob, 
  fillPdfTemplatePreview,
  getAnvilTemplatesList,
  getAnvilTemplatePayload,
  validateAnvilFormData,
  prepareAnvilFormData,
  isValidTemplateId,
  sanitizeAnvilFormData,
  filterTemplatesByCategory,
  searchTemplates,
  sortTemplates,
  getTemplateStats,
  getFieldNamesFromPayload,
  getRequiredFieldsFromPayload,
  validateFormDataAgainstPayload,
  hasTemplatePermission,
  isTemplateActive
} from '../AnvilControllers';

// Mock the api module
jest.mock('../../utils/api', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

import api from '../../utils/api';

describe('AnvilControllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fillPdfTemplate', () => {
    it('should call the correct API endpoint with proper data', async () => {
      const mockResponse = {
        data: { success: true, data: { pdfUrl: 'test-url' } },
        status: 200,
        statusText: 'OK'
      };
      
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const templateId = 'test-template-123';
      const formData = { name: 'John Doe', email: 'john@example.com' };
      const options = { filename: 'test.pdf' };

      const result = await fillPdfTemplate(templateId, formData, options);

      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/anvil/fill/test-template-123',
        {
          templateId,
          formData,
          options
        }
      );
      expect(result.data).toEqual(mockResponse.data);
      expect(result.status).toBe(200);
    });

    it('should handle API errors correctly', async () => {
      const mockError = {
        response: {
          data: { message: 'Template not found' },
          status: 404,
          statusText: 'Not Found'
        }
      };
      
      (api.post as jest.Mock).mockRejectedValue(mockError);

      const result = await fillPdfTemplate('invalid-template', {});

      expect(result.data).toEqual({ message: 'Template not found' });
      expect(result.status).toBe(404);
    });
  });

  describe('fillPdfTemplateBlob', () => {
    it('should call API with blob response type', async () => {
      const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
      const mockResponse = {
        data: mockBlob,
        status: 200,
        statusText: 'OK'
      };
      
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fillPdfTemplateBlob('test-template', { name: 'John' });

      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/anvil/fill/test-template',
        {
          templateId: 'test-template',
          formData: { name: 'John' },
          options: { download: true }
        },
        { responseType: 'blob' }
      );
      expect(result.data).toBe(mockBlob);
    });
  });

  describe('getAnvilTemplatesList', () => {
    it('should call the correct API endpoint', async () => {
      const mockResponse = {
        data: {
          templates: [
            { templateId: 'template-1', name: 'Form 1', status: 'active' },
            { templateId: 'template-2', name: 'Form 2', status: 'active' }
          ],
          total: 2
        },
        status: 200,
        statusText: 'OK'
      };
      
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAnvilTemplatesList();

      expect(api.get).toHaveBeenCalledWith('/api/v1/anvil/templates/list', { params: undefined });
      expect(result.data).toEqual(mockResponse.data);
      expect(result.status).toBe(200);
    });

    it('should call API with query parameters', async () => {
      const mockResponse = {
        data: { templates: [], total: 0 },
        status: 200,
        statusText: 'OK'
      };
      
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        page: 1,
        limit: 10,
        category: 'immigration',
        search: 'form'
      };

      await getAnvilTemplatesList(params);

      expect(api.get).toHaveBeenCalledWith('/api/v1/anvil/templates/list', { params });
    });

    it('should handle API errors correctly', async () => {
      const mockError = {
        response: {
          data: { message: 'Templates not found' },
          status: 404,
          statusText: 'Not Found'
        }
      };
      
      (api.get as jest.Mock).mockRejectedValue(mockError);

      const result = await getAnvilTemplatesList();

      expect(result.data).toEqual({ message: 'Templates not found' });
      expect(result.status).toBe(404);
    });
  });

  describe('getAnvilTemplatePayload', () => {
    it('should call the correct API endpoint', async () => {
      const mockPayload = {
        templateId: 'template-1',
        name: 'I-130 Form',
        status: 'active',
        fields: [
          { fieldId: 'field1', fieldName: 'firstName', fieldType: 'text', required: true },
          { fieldId: 'field2', fieldName: 'lastName', fieldType: 'text', required: true }
        ],
        payload: { rawData: {}, schema: {} }
      };
      
      const mockResponse = {
        data: mockPayload,
        status: 200,
        statusText: 'OK'
      };
      
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAnvilTemplatePayload('template-1');

      expect(api.get).toHaveBeenCalledWith('/api/v1/anvil/template/template-1/payload');
      expect(result.data).toEqual(mockPayload);
      expect(result.status).toBe(200);
    });

    it('should handle API errors correctly', async () => {
      const mockError = {
        response: {
          data: { message: 'Template not found' },
          status: 404,
          statusText: 'Not Found'
        }
      };
      
      (api.get as jest.Mock).mockRejectedValue(mockError);

      const result = await getAnvilTemplatePayload('invalid-template');

      expect(result.data).toEqual({ message: 'Template not found' });
      expect(result.status).toBe(404);
    });
  });

  describe('validateAnvilFormData', () => {
    it('should return valid for non-empty form data', () => {
      const formData = { name: 'John', email: 'john@example.com' };
      const result = validateAnvilFormData(formData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for empty form data', () => {
      const formData = {};
      const result = validateAnvilFormData(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form data cannot be empty');
    });

    it('should return invalid for form data with empty values', () => {
      const formData = { name: '', email: null };
      const result = validateAnvilFormData(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'name' cannot be empty");
      expect(result.errors).toContain("Field 'email' cannot be empty");
    });
  });

  describe('prepareAnvilFormData', () => {
    it('should convert null/undefined values to empty strings', () => {
      const rawData = { name: 'John', email: null, phone: undefined };
      const result = prepareAnvilFormData(rawData);
      
      expect(result).toEqual({ name: 'John', email: '', phone: '' });
    });

    it('should preserve valid values', () => {
      const rawData = { name: 'John', age: 30, active: true };
      const result = prepareAnvilFormData(rawData);
      
      expect(result).toEqual({ name: 'John', age: 30, active: true });
    });
  });

  describe('isValidTemplateId', () => {
    it('should return true for valid template ID', () => {
      expect(isValidTemplateId('template-123')).toBe(true);
      expect(isValidTemplateId('test_template')).toBe(true);
    });

    it('should return false for invalid template ID', () => {
      expect(isValidTemplateId('')).toBe(false);
      expect(isValidTemplateId('   ')).toBe(false);
      expect(isValidTemplateId(null as any)).toBe(false);
      expect(isValidTemplateId(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeAnvilFormData', () => {
    it('should sanitize field names and remove dangerous characters', () => {
      const formData = { 
        'normal-field': 'value1',
        'field<script>alert("xss")</script>': 'value2',
        'field with spaces': 'value3'
      };
      const result = sanitizeAnvilFormData(formData);
      
      expect(result).toEqual({
        'normal-field': 'value1',
        'fieldalertxss': 'value2',
        'fieldwithspaces': 'value3'
      });
    });

    it('should remove script tags from string values', () => {
      const formData = { 
        name: 'John<script>alert("xss")</script>Doe',
        email: 'john@example.com'
      };
      const result = sanitizeAnvilFormData(formData);
      
      expect(result.name).toBe('JohnDoe');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('Template List Utility Functions', () => {
    const mockTemplates = [
      {
        templateId: 'template-1',
        name: 'I-130 Form',
        description: 'Petition for Alien Relative',
        category: 'immigration',
        status: 'active' as const,
        fieldCount: 15,
        metadata: { difficulty: 'intermediate' as const }
      },
      {
        templateId: 'template-2',
        name: 'I-485 Form',
        description: 'Application to Register Permanent Residence',
        category: 'immigration',
        status: 'active' as const,
        fieldCount: 20,
        metadata: { difficulty: 'advanced' as const }
      },
      {
        templateId: 'template-3',
        name: 'Contract Template',
        description: 'Legal contract template',
        category: 'legal',
        status: 'draft' as const,
        fieldCount: 8,
        metadata: { difficulty: 'beginner' as const }
      }
    ];

    describe('filterTemplatesByCategory', () => {
      it('should filter templates by category', () => {
        const result = filterTemplatesByCategory(mockTemplates, 'immigration');
        expect(result).toHaveLength(2);
        expect(result.every(t => t.category === 'immigration')).toBe(true);
      });

      it('should return empty array for non-existent category', () => {
        const result = filterTemplatesByCategory(mockTemplates, 'non-existent');
        expect(result).toHaveLength(0);
      });
    });

    describe('searchTemplates', () => {
      it('should search templates by name', () => {
        const result = searchTemplates(mockTemplates, 'I-130');
        expect(result).toHaveLength(1);
        expect(result[0].templateId).toBe('template-1');
      });

      it('should search templates by description', () => {
        const result = searchTemplates(mockTemplates, 'contract');
        expect(result).toHaveLength(1);
        expect(result[0].templateId).toBe('template-3');
      });

      it('should search templates by template ID', () => {
        const result = searchTemplates(mockTemplates, 'template-2');
        expect(result).toHaveLength(1);
        expect(result[0].templateId).toBe('template-2');
      });
    });

    describe('sortTemplates', () => {
      it('should sort templates by name', () => {
        const result = sortTemplates(mockTemplates, 'name', 'asc');
        expect(result[0].name).toBe('Contract Template');
        expect(result[1].name).toBe('I-130 Form');
        expect(result[2].name).toBe('I-485 Form');
      });

      it('should sort templates by field count', () => {
        const result = sortTemplates(mockTemplates, 'fieldCount', 'desc');
        expect(result[0].fieldCount).toBe(20);
        expect(result[1].fieldCount).toBe(15);
        expect(result[2].fieldCount).toBe(8);
      });
    });

    describe('getTemplateStats', () => {
      it('should calculate correct statistics', () => {
        const stats = getTemplateStats(mockTemplates);
        
        expect(stats.total).toBe(3);
        expect(stats.active).toBe(2);
        expect(stats.draft).toBe(1);
        expect(stats.categories).toBe(2);
        expect(stats.averageFieldCount).toBe(14); // (15 + 20 + 8) / 3
        expect(stats.difficulty.beginner).toBe(1);
        expect(stats.difficulty.intermediate).toBe(1);
        expect(stats.difficulty.advanced).toBe(1);
      });
    });
  });

  describe('Template Payload Utility Functions', () => {
    const mockPayload = {
      templateId: 'template-1',
      name: 'I-130 Form',
      status: 'active' as const,
      fields: [
        { 
          fieldId: 'field1', 
          fieldName: 'firstName', 
          fieldType: 'text' as const, 
          required: true,
          validation: { min: 2, max: 50 }
        },
        { 
          fieldId: 'field2', 
          fieldName: 'lastName', 
          fieldType: 'text' as const, 
          required: true 
        },
        { 
          fieldId: 'field3', 
          fieldName: 'email', 
          fieldType: 'email' as const, 
          required: false,
          validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        },
        { 
          fieldId: 'field4', 
          fieldName: 'age', 
          fieldType: 'number' as const, 
          required: false,
          validation: { min: 18, max: 120 }
        }
      ],
      payload: {
        rawData: {},
        schema: {},
        dependencies: ['template-2'],
        requirements: ['valid-email']
      },
      permissions: {
        canEdit: true,
        canDelete: false,
        canShare: true,
        canDownload: true,
        canPreview: true
      },
      usage: {
        totalUses: 150,
        lastUsed: '2024-01-15T10:30:00Z',
        averageCompletionTime: 1200,
        successRate: 0.95
      }
    };

    describe('getFieldNamesFromPayload', () => {
      it('should extract field names from payload', () => {
        const fieldNames = getFieldNamesFromPayload(mockPayload);
        expect(fieldNames).toEqual(['firstName', 'lastName', 'email', 'age']);
      });
    });

    describe('getRequiredFieldsFromPayload', () => {
      it('should extract required fields from payload', () => {
        const requiredFields = getRequiredFieldsFromPayload(mockPayload);
        expect(requiredFields).toHaveLength(2);
        expect(requiredFields.map(f => f.fieldName)).toEqual(['firstName', 'lastName']);
      });
    });

    describe('validateFormDataAgainstPayload', () => {
      it('should validate form data correctly', () => {
        const validFormData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          age: 30
        };
        
        const result = validateFormDataAgainstPayload(validFormData, mockPayload);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing required fields', () => {
        const invalidFormData = {
          firstName: 'John',
          email: 'john@example.com'
        };
        
        const result = validateFormDataAgainstPayload(invalidFormData, mockPayload);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Field 'lastName' is required");
      });

      it('should validate field constraints', () => {
        const invalidFormData = {
          firstName: 'J', // Too short
          lastName: 'Doe',
          email: 'invalid-email', // Invalid format
          age: 15 // Too young
        };
        
        const result = validateFormDataAgainstPayload(invalidFormData, mockPayload);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Field 'firstName' must be at least 2");
        expect(result.errors).toContain("Field 'email' format is invalid");
        expect(result.errors).toContain("Field 'age' must be at least 18");
      });
    });

    describe('hasTemplatePermission', () => {
      it('should check template permissions correctly', () => {
        expect(hasTemplatePermission(mockPayload, 'edit')).toBe(true);
        expect(hasTemplatePermission(mockPayload, 'delete')).toBe(false);
        expect(hasTemplatePermission(mockPayload, 'share')).toBe(true);
        expect(hasTemplatePermission(mockPayload, 'download')).toBe(true);
        expect(hasTemplatePermission(mockPayload, 'preview')).toBe(true);
      });
    });

    describe('isTemplateActive', () => {
      it('should check if template is active', () => {
        expect(isTemplateActive(mockPayload)).toBe(true);
        
        const inactivePayload = { ...mockPayload, status: 'inactive' as const };
        expect(isTemplateActive(inactivePayload)).toBe(false);
      });
    });
  });
});

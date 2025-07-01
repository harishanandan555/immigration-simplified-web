import api from '../utils/api';
import { USCIS_FORMS_END_POINTS } from '../utils/constants';

// API Response Interface
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Feature flag to enable/disable USCIS forms API
const IS_USCIS_FORMS_ENABLED = true;

// Utility to convert Buffer-like object to Blob
function bufferObjToBlob(bufferObj: { type: string; data: number[] }, mime = 'application/pdf'): Blob {
  return new Blob([new Uint8Array(bufferObj.data)], { type: mime });
}

// Fetch all USCIS forms metadata (no PDF data)
export const getAllUscisForms = async (): Promise<ApiResponse<any>> => {
  if (!IS_USCIS_FORMS_ENABLED) {
    console.log('getAllUscisForms method is skipped.');
    return {
      data: [],
      status: 0,
      statusText: 'Method skipped',
    };
  }
  try {
    const response = await api.get(USCIS_FORMS_END_POINTS.GET_ALL);
    // Convert pdfdata Buffer to Blob for each form if present
    let forms = response.data.forms;
    if (Array.isArray(forms)) {
      forms = forms.map((form: any) => {
        if (
          form.pdfdata &&
          typeof form.pdfdata === 'object' &&
          Array.isArray(form.pdfdata.data)
        ) {
          return { ...form, pdfdata: bufferObjToBlob(form.pdfdata) };
        }
        return form;
      });
    }
    return {
      data: { ...response.data, forms },
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching USCIS forms metadata:', error.message);
      throw new Error(`Failed to fetch USCIS forms metadata: ${error.message}`);
    }
    throw new Error('Failed to fetch USCIS forms metadata due to an unknown error');
  }
};

// Download a specific USCIS form PDF by form number
export const getUscisFormPdf = async (formNumber: string): Promise<Blob> => {
  if (!IS_USCIS_FORMS_ENABLED) {
    console.log('getUscisFormPdf method is skipped.');
    return new Blob();
  }
  try {
    // Ensure we get a Blob for PDF download
    const response = await api.get(
      USCIS_FORMS_END_POINTS.GET_PDF.replace(':formNumber', formNumber),
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      throw new Error('Form not found');
    }
    if (error instanceof Error) {
      console.error('Error downloading USCIS form PDF:', error.message);
      throw new Error(`Failed to download USCIS form PDF: ${error.message}`);
    }
    throw new Error('Failed to download USCIS form PDF due to an unknown error');
  }
}; 
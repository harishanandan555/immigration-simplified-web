import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Download, RotateCcw } from 'lucide-react';

interface PdfEditorProps {
  pdfUrl: string;
  filename: string;
  onClose: () => void;
  onSave?: (editedPdfBlob: Blob) => void;
  onDownload?: (editedPdfBlob: Blob) => void;
}

// Nutrient SDK instance type
type NutrientViewerInstance = any;

const PdfEditor: React.FC<PdfEditorProps> = ({
  pdfUrl,
  filename,
  onClose,
  onSave,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const nutrientViewerRef = useRef<NutrientViewerInstance | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeNutrientViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!viewerRef.current) {
          throw new Error('Viewer container not found');
        }

        // Import Nutrient SDK dynamically as per documentation
        const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;

        // Clean up any existing instance first
        if (nutrientViewerRef.current && viewerRef.current) {
          try {
            NutrientViewer.unload(viewerRef.current);
          } catch (unloadError) {
            // Ignore errors if there's no instance to unload
            console.warn('Error unloading previous instance:', unloadError);
          }
          nutrientViewerRef.current = null;
        }

        // Also try to unload using the container directly (in case ref is stale)
        try {
          NutrientViewer.unload(viewerRef.current);
        } catch (unloadError) {
          // This is expected if there's no instance - ignore
        }

        // Clear the container to ensure it's clean
        if (viewerRef.current) {
          viewerRef.current.innerHTML = '';
        }

        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted || !viewerRef.current) {
          return;
        }

        // Handle blob URLs by converting them to ArrayBuffer
        let documentSource: string | ArrayBuffer = pdfUrl;
        
        if (pdfUrl.startsWith('blob:')) {
          // Fetch the blob URL and convert to ArrayBuffer
          try {
            const response = await fetch(pdfUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob URL: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            documentSource = arrayBuffer;
          } catch (fetchError) {
            console.error('Error fetching blob URL:', fetchError);
            throw new Error(`Failed to load PDF from blob URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
          }
        }

        if (!isMounted || !viewerRef.current) {
          return;
        }

        // Load Nutrient viewer with the PDF document
        const instance = await NutrientViewer.load({
          container: viewerRef.current,
          document: documentSource,
          // baseUrl: where SDK should load its assets from (copied by rollup-plugin-copy)
          baseUrl: `${window.location.protocol}//${window.location.host}/${
            import.meta.env.PUBLIC_URL ?? "" // Usually empty for Vite, but supports custom deployments
          }`,
        });

        if (isMounted) {
          nutrientViewerRef.current = instance;
          setIsLoading(false);
        }

      } catch (err) {
        if (isMounted) {
          console.error('Error initializing Nutrient viewer:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize PDF editor. Please ensure @nutrient-sdk/viewer is properly installed.');
          setIsLoading(false);
        }
      }
    };

    initializeNutrientViewer();

    // Cleanup on unmount or when pdfUrl changes
    return () => {
      isMounted = false;
      if (nutrientViewerRef.current && viewerRef.current) {
        const container = viewerRef.current;
        // Use dynamic import for cleanup as well
        import("@nutrient-sdk/viewer").then((module) => {
          const NutrientViewer = module.default;
          try {
            NutrientViewer.unload(container);
          } catch (err) {
            console.warn('Error destroying Nutrient viewer:', err);
          }
        }).catch((err) => {
          console.warn('Error importing Nutrient viewer for cleanup:', err);
        });
        nutrientViewerRef.current = null;
      }
    };
  }, [pdfUrl]);

  const handleSave = async () => {
    if (!nutrientViewerRef.current || !onSave) return;

    try {
      setIsSaving(true);
      // Use the correct Nutrient SDK method to export PDF
      const arrayBuffer = await nutrientViewerRef.current.exportPDF();
      
      // Convert ArrayBuffer to Blob
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      onSave(blob);
    } catch (err) {
      console.error('Error saving PDF:', err);
      setError('Failed to save PDF. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!nutrientViewerRef.current) return;

    try {
      setIsSaving(true);
      // Use the correct Nutrient SDK method to export PDF
      const arrayBuffer = await nutrientViewerRef.current.exportPDF();
      
      // Convert ArrayBuffer to Blob
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      if (onDownload) {
        onDownload(blob);
      } else {
        // Default download behavior
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!nutrientViewerRef.current || !viewerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // For now, we'll reload the document to reset changes
      // This is a simple approach - in a more sophisticated implementation,
      // we could track changes and revert them individually
      const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;
      
      // Unload current instance
      try {
        NutrientViewer.unload(viewerRef.current);
      } catch (unloadError) {
        console.warn('Error unloading during reset:', unloadError);
      }
      
      nutrientViewerRef.current = null;

      // Clear the container
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }

      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload the document
      if (!viewerRef.current) {
        throw new Error('Viewer container not found');
      }
      
      // Handle blob URLs by converting them to ArrayBuffer
      let documentSource: string | ArrayBuffer = pdfUrl;
      
      if (pdfUrl.startsWith('blob:')) {
        // Fetch the blob URL and convert to ArrayBuffer
        try {
          const response = await fetch(pdfUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob URL: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          documentSource = arrayBuffer;
        } catch (fetchError) {
          console.error('Error fetching blob URL:', fetchError);
          throw new Error(`Failed to load PDF from blob URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }
      }
      
      const instance = await NutrientViewer.load({
        container: viewerRef.current,
        document: documentSource,
        baseUrl: `${window.location.protocol}//${window.location.host}/${
          import.meta.env.PUBLIC_URL ?? ""
        }`,
      });

      nutrientViewerRef.current = instance;
      setIsLoading(false);
    } catch (err) {
      console.error('Error resetting PDF:', err);
      setError('Failed to reset PDF. Please close and reopen the editor.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full h-5/6 flex flex-col" style={{ position: 'relative' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit PDF: {filename}
            </h3>
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading editor...</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
                {error.includes('@nutrient-sdk/viewer') && (
                  <div className="mt-2 text-xs">
                    <p>To fix this issue:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Run: <code className="bg-gray-100 px-1 rounded">npm install @nutrient-sdk/viewer</code></li>
                      <li>Restart your development server</li>
                      <li>Try opening the editor again</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PDF Editor Container */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden nutrient-pdf-container-parent" style={{ position: 'relative' }}>
          <div 
            ref={viewerRef} 
            className="w-full h-full nutrient-pdf-container"
            style={{ 
              height: '600px', 
              width: '100%',
              minHeight: '500px',
              position: 'relative'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              disabled={isLoading || isSaving}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {onSave && (
              <button
                onClick={handleSave}
                disabled={isLoading || isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
            
            <button
              onClick={handleDownload}
              disabled={isLoading || isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>{isSaving ? 'Preparing...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfEditor;

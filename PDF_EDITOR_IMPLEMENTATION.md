# PDF Editor with Nutrient Web SDK Installation Guide

## Overview
This implementation adds PDF editing functionality to the generated forms using the Nutrient Web SDK (@nutrient-sdk/viewer). Users can now edit PDF forms manually after they are generated.

## Features Added

### 1. PDF Editor Component (`src/components/pdf/PdfEditor.tsx`)
- Full-featured PDF editor using Nutrient Web SDK
- Edit forms, add annotations, and fill fields manually
- Save and download edited PDFs
- Reset functionality to undo changes

### 2. Proper SDK Integration (Following Official Documentation)
- Dynamic import of Nutrient Web SDK as per official docs
- Vite configuration with rollup-plugin-copy for asset management
- Proper cleanup with NutrientViewer.unload()
- TypeScript support with global.d.ts declarations

### 3. Edit Button Integration
- Added "Edit" button next to "Preview" and "Download" buttons
- Available in both LegalFirmWorkflow and IndividualImmigrationProcess components
- Styled with distinctive purple color to differentiate from other actions

### 4. Enhanced PDF Preview Modals
- Integrated PDF editor modal alongside existing preview functionality
- Seamless transition between preview and edit modes
- Automatic PDF updates when changes are saved

## Installation Steps

### 1. Install Dependencies
```bash
npm install @nutrient-sdk/viewer
npm install rollup-plugin-copy --save-dev
```

### 2. Vite Configuration
The implementation includes proper Vite configuration for asset copying:

```typescript
// vite.config.ts
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          src: "node_modules/@nutrient-sdk/viewer/dist/nutrient-viewer-lib",
          dest: "public/",
        },
      ],
      hook: "buildStart",
    }),
    react(),
  ],
});
```

### 3. SDK Loading (Following Official Documentation)
The Nutrient Web SDK is loaded dynamically as per the official documentation:

```typescript
// Dynamic import as per official docs
const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;

// Ensure there's only one instance
NutrientViewer.unload(container);

// Load with proper configuration
const instance = await NutrientViewer.load({
  container: viewerRef.current,
  document: pdfUrl,
  baseUrl: `${window.location.protocol}//${window.location.host}/`,
});
```

### 4. Document Export API
The implementation uses the correct Nutrient SDK API for document export:

```typescript
// Export PDF using the correct method
const arrayBuffer = await instance.exportPDF();

// Convert ArrayBuffer to Blob for download/save
const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
```

### 5. Container Positioning Requirements
The Nutrient SDK requires containers to have non-static positioning. The implementation includes:

```css
/* CSS for proper container positioning */
.nutrient-pdf-container {
  position: relative !important;
  display: block !important;
  overflow: hidden;
}

.nutrient-pdf-container-parent {
  position: relative !important;
}
```

```typescript
// Container styling in React component
<div 
  ref={viewerRef} 
  className="nutrient-pdf-container"
  style={{ 
    height: '600px', 
    width: '100%',
    position: 'relative'
  }}
/>
```

### 6. Usage
1. Generate forms using the existing auto-fill functionality
2. Click the "Edit" button next to any generated form
3. Use the Nutrient Web SDK editor to make manual changes
4. Save changes to update the form
5. Download the edited PDF

## Technical Implementation

### State Management
- `showEditor`: Controls visibility of PDF editor modals
- `generatedForms`: Updated with edited PDF blobs when changes are saved

### Key Functions
- `handleEditForm()`: Opens PDF editor modal
- `handleSaveEditedPdf()`: Saves edited PDF and updates form state
- `handleCloseEditor()`: Closes PDF editor modal

### Error Handling
- SDK loading errors are caught and displayed to users
- PDF editing errors are logged and shown via toast notifications
- Graceful fallback if SDK fails to load

## Browser Compatibility
The Nutrient Web SDK supports modern browsers. Ensure your target browsers support:
- ES6+ features
- Blob API
- URL.createObjectURL()

## Troubleshooting

### SDK Not Loading
- Check network connectivity
- Verify CDN availability
- Consider using local SDK files

### PDF Editor Not Opening
- Ensure PDF blob URL is valid
- Check browser console for errors
- Verify Nutrient SDK is properly loaded

### Save Functionality Issues
- Check blob creation permissions
- Verify form state updates
- Ensure proper cleanup of blob URLs

## Future Enhancements
- Add form field validation
- Implement collaborative editing
- Add version history for edited PDFs
- Support for additional PDF editing features

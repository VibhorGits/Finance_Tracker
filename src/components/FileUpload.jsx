import React from 'react';
import { UploadCloud } from 'lucide-react';
import Papa from 'papaparse'; // 2. Import Papa Parse

function FileUpload({ setParsedData }) {

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true, // Tells Papa Parse to use the first row as headers
        complete: (results) => {
          console.log("Parsing complete:", results.data);
          setParsedData(results.data);
        },
      });
    }
  };

  return (
    <>
    <div className="flex items-center justify-center w-full">
      <label 
        htmlFor="csv-upload" 
        // Add `group` here for the child icon to react to the hover
        // Add `hover:border-blue-500` to change the border color
        className="group flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:border-blue-500"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {/* Add `group-hover:text-blue-500` to change the icon color on parent hover */}
          <UploadCloud className="w-10 h-10 mb-4 text-gray-400 group-hover:text-blue-500" strokeWidth={1.5} />
          
          <p className="mb-2 text-sm text-gray-500 group-hover:text-blue-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">CSV, TXT, or other statement files</p>
        </div>
        <input 
          id="csv-upload" 
          type="file" 
          accept=".csv"
          onChange={handleFileChange} 
          className="hidden" 
        />
      </label>
    </div> 
    
    </>
  );
}

export default FileUpload;
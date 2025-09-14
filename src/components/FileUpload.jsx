import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import axios from 'axios';

function FileUpload({onUploadSuccess, accounts = []}) {
  // Add state for the selected account
  const [selectedAccount, setSelectedAccount] = useState('');
  const fileInputRef = useRef(null); // Add ref for file input

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]._id);
    }
    }, [accounts, selectedAccount]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return; 
    }
    if (!selectedAccount) {
      alert("Please select an account first!");
      return;
    }

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_id', selectedAccount);

    try {
      // Send the file to the FastAPI backend endpoint
      const response = await axios.post("http://127.0.0.1:8000/uploadfile/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Log the server's response to the console to confirm success
      console.log('File uploaded successfully:', response.data);
      onUploadSuccess(selectedAccount);

      // Clear the file input to allow subsequent uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">

       <div>
        <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Account
        </label>
        <select
          id="account-select"
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="" disabled>-- Choose an account --</option>
          {accounts.map(acc => (
            <option key={acc._id} value={acc._id}>
              {acc.account_name}
            </option>
          ))}
        </select>
      </div>

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
            ref={fileInputRef}
            id="csv-upload" 
            type="file" 
            accept=".csv"
            onChange={handleFileChange} 
            className="hidden" 
          />
        </label>
      </div> 
    
    </div>
  );
}

export default FileUpload;
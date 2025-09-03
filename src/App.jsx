// We can leave this import here. If we need highly custom styles 
// that are tricky with Tailwind, we can add them to App.css later.
import './App.css'
import { useState,useEffect } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload.jsx'
import TransactionTable from './components/TransactionTable';

function App() {
  const [parsedData, setParsedData] = useState([]);
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    // We use an async function inside useEffect to handle the request
    const fetchMessage = async () => {
      try {
        // Make a GET request to our FastAPI server's root endpoint
        const response = await axios.get("http://127.0.0.1:8000/");
        // Store the received message in our state
        setBackendMessage(response.data.message);
      } catch (error) {
        console.error("Error fetching data from backend:", error);
        setBackendMessage("Could not connect to backend.");
      }
    };

    fetchMessage();
  }, []); // The empty array [] means this effect runs only once when the component mounts


  return (
    // Set a background color for the whole page and ensure it's at least the full screen height
    <div className="bg-gray-100 min-h-screen">
      
      {/* Create a centered container with a max-width and some padding */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Header with padding, shadow, and flexbox for alignment */}
        <header className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Finance Tracker</h2>
          <p className="text-sm text-green-600 font-semibold">{backendMessage}</p>
          <nav className="space-x-6">
            <span className="text-gray-600 font-medium hover:text-blue-500 cursor-pointer">Dashboard</span>
            <span className="text-gray-600 font-medium hover:text-blue-500 cursor-pointer">Transactions</span>
          </nav>
        </header>

        {/* Main content area with a grid layout for larger screens */}
        <main className="grid md:grid-cols-3 gap-6">
          
          {/* Dashboard Area - takes up 2 columns on medium screens and up */}
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">Dashboard Area</h3>
            <p className="text-gray-500 mt-2">Charts and summaries will go here.</p>
          </div>
          
          {/* Transactions Area - takes up 1 column */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">Import Data</h3>
            <FileUpload setParsedData={setParsedData}/>
          </div>

        </main>

        {parsedData.length > 0 && (
        <TransactionTable data={parsedData} />
        )}

      </div>
    </div>
  )
}

export default App
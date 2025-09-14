import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TransactionTable({accountId}) {
  // Create a state to hold the transactions
  const [transactions, setTransactions] = useState([]);

  // Use useEffect to fetch data when accountId changes
  useEffect(() => {
    if (!accountId) return

    const fetchTransactions = async () => {
      try {
        // Pass the accountId as a URL parameter to the backend
        const response = await axios.get(`http://127.0.0.1:8000/transactions/?account_id=${accountId}`);
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [accountId]); // Empty dependency array to avoid the warning

  // Helper function to get color based on confidence score
  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {/* 1. Add new table headers */}
              <th scope="col" className="px-6 py-3">Timestamp</th>
              <th scope="col" className="px-6 py-3">Description</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3">Confidence</th>
              <th scope="col" className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((row) => (
              <tr key={row._id} className="bg-white border-b hover:bg-gray-50">
                {/* 2. Add new table cells for the data */}
                <td className="px-6 py-4">{row.Date || row.Timestamp || 'N/A'}</td>
                <td className="px-6 py-4">{row['Transaction details'] || row.Description || 'No Description'}</td>
                <td className="px-6 py-4">{row.category || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(row.confidence)}`}>
                    {row.confidence || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{row.Amount || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionTable;
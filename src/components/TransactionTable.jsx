import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TransactionTable() {
  // Create a state to hold the transactions
  const [transactions, setTransactions] = useState([]);

  // Use useEffect to fetch data when the component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/transactions/");
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, []); // The empty array ensures this runs only once on load

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          {/* ... thead is the same ... */}
          <tbody>
            {/* Map over the `transactions` state variable */}
            {transactions.map((row) => (
              <tr key={row._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{row.Timestamp || 'N/A'}</td>
                <td className="px-6 py-4">{row.Description || 'No Description'}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{row.RF_Input_Power_dBm || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionTable;
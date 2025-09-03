import React from 'react';

function TransactionTable({ data }) {
  if (data.length === 0) return null; // Don't render anything if there's no data

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Timestamp</th>
              <th scope="col" className="px-6 py-3">Description</th>
              <th scope="col" className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              // We add a unique 'key' for each row, which is important for React
              <tr key={index} className="bg-white border-b hover:bg-gray-50">
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
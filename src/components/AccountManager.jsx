import React, { useState } from 'react';
import axios from 'axios';

function AccountManager({accounts = [], onAccountCreated}) {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('');

  // Function to handle the form submission
  const handleCreateAccount = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    if (!accountName || !accountType) {
      alert("Please provide both an account name and type.");
      return;
    }
    try {
      await axios.post("http://127.0.0.1:8000/accounts/", {
        account_name: accountName,
        account_type: accountType,
      });
      // Clear the form fields and refresh the account list
      setAccountName('');
      setAccountType('');
      onAccountCreated(); 
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Manage Accounts</h3>

      {/* Form to create a new account */}
      <form onSubmit={handleCreateAccount} className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g., HDFC Savings"
          className="flex-grow p-2 border border-gray-300 rounded-md"
        />
        <input
          type="text"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          placeholder="e.g., Bank Account"
          className="flex-grow p-2 border border-gray-300 rounded-md"
        />
        <button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600">
          Add Account
        </button>
      </form>

      {/* List of existing accounts */}
      <div>
        <h4 className="font-semibold text-gray-600 mb-2">Existing Accounts:</h4>
        <ul className="list-disc list-inside">
          {accounts.map(acc => (
            <li key={acc._id} className="text-gray-700">
              {acc.account_name} ({acc.account_type})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AccountManager;
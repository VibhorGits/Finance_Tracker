// src/components/NeedsReview.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CATEGORY_OPTIONS = ["Food", "Groceries", "Shopping", "Transport", "Travel", "Bills & Subscriptions", "Miscellaneous"];

function NeedsReview({ accountId }) {
  const [reviewItems, setReviewItems] = useState([]);

  // Fetch data when the component loads or the accountId changes
  useEffect(() => {
    const fetchReviewItems = async () => {
      if (!accountId) return;
      try {
        const response = await axios.get(`http://127.0.0.1:8000/transactions/review/?account_id=${accountId}`);
        // Add a temporary state to each item for handling custom input
        const itemsWithCustomState = response.data.map(item => ({
          ...item,
          showCustomInput: false,
          customCategory: ''
        }));
        setReviewItems(itemsWithCustomState);
      } catch (error) {
        console.error("Error fetching items for review:", error);
      }
    };
    fetchReviewItems();
  }, [accountId]);

  // Function to handle the category update
  const handleCategoryUpdate = async (transactionId, newCategory) => {
    if (!newCategory) return; // Don't do anything if the new category is empty
    try {
      await axios.patch(`http://127.0.0.1:8000/transactions/${transactionId}`, {
        category: newCategory,
      });
      // After a successful update, remove the item from the list
      setReviewItems(prevItems => prevItems.filter(item => item._id !== transactionId));
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };
  
  // Function to handle changes from the dropdown
  const handleSelectChange = (transactionId, selectedValue) => {
    if (selectedValue === "add_new") {
      // If user selects "Add New", show the custom input field
      setReviewItems(prevItems => prevItems.map(item =>
        item._id === transactionId ? { ...item, showCustomInput: true } : item
      ));
    } else {
      // Otherwise, update the category immediately
      handleCategoryUpdate(transactionId, selectedValue);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Transactions to Review</h3>
      {reviewItems.length === 0 ? (
        <p className="text-gray-500">No transactions are currently pending review.</p>
      ) : (
        <ul className="space-y-4">
          {reviewItems.map(item => (
            <li key={item._id} className="p-4 border rounded-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p className="font-medium text-gray-800">{item['Transaction details'] || item.Description}</p>
                  <p className="text-sm text-gray-500">Current Category: {item.category} ({item.confidence})</p>
                </div>
                <select
                  onChange={(e) => handleSelectChange(item._id, e.target.value)}
                  value="" // Keep dropdown selection empty
                  className="mt-2 sm:mt-0 sm:ml-4 p-2 border border-gray-300 rounded-md"
                >
                  <option value="" disabled>Re-categorize...</option>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="add_new">-- Add New Category --</option>
                </select>
              </div>
              {/* Conditionally render the custom category input field */}
              {item.showCustomInput && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    className="flex-grow p-2 border border-gray-300 rounded-md"
                    onChange={(e) => setReviewItems(prevItems => prevItems.map(i =>
                      i._id === item._id ? { ...i, customCategory: e.target.value } : i
                    ))}
                  />
                  <button
                    onClick={() => handleCategoryUpdate(item._id, item.customCategory)}
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NeedsReview;
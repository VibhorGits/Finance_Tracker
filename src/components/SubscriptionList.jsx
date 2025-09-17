import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SubscriptionList({ accountId }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;

    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://127.0.0.1:8000/analytics/subscriptions/${accountId}`);
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        setSubscriptions([]);
      }
      setLoading(false);
    };

    fetchSubscriptions();
  }, [accountId]);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading subscriptions...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Recurring Subscriptions</h3>
      {subscriptions.length === 0 ? (
        <p className="text-gray-500">No recurring subscriptions detected for this account.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Merchant</th>
                <th scope="col" className="px-6 py-3">Transaction Count</th>
                <th scope="col" className="px-6 py-3 text-right">Average Amount</th>
                <th scope="col" className="px-6 py-3">Last Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{sub.merchant}</td>
                  <td className="px-6 py-4">{sub.transaction_count}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">₹{Math.abs(sub.avg_amount).toFixed(2)}</td>
                  <td className="px-6 py-4">{new Date(sub.last_payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SubscriptionList;
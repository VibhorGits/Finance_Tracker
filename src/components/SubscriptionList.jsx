"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Repeat } from "lucide-react" // Fixed import to use lucide-react

function SubscriptionList({ accountId }) {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) return

    const fetchSubscriptions = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/analytics/subscriptions/${accountId}`)
        setSubscriptions(response.data)
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
        setSubscriptions([])
      }
      setLoading(false)
    }

    fetchSubscriptions()
  }, [accountId])

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Recurring Subscriptions</h3>
      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Repeat className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h4>
          <p className="text-gray-600">No recurring subscriptions detected for this account.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Transaction Count
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Average Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Payment Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {subscriptions.map((sub, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{sub.merchant}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{sub.transaction_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-red-600">₹{Math.abs(sub.avg_amount).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {new Date(sub.last_payment_date).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SubscriptionList

"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertCircle, Check, X, Clock, DollarSign } from "lucide-react"

const CATEGORY_OPTIONS = [
  "Food",
  "Groceries",
  "Shopping",
  "Transport",
  "Travel",
  "Bills & Subscriptions",
  "Miscellaneous",
]

function NeedsReview({ accountId }) {
  const [reviewItems, setReviewItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingItems, setProcessingItems] = useState(new Set())

  useEffect(() => {
    const fetchReviewItems = async () => {
      if (!accountId) return
      setLoading(true)
      try {
        const response = await axios.get(`http://127.0.0.1:8000/transactions/review/?account_id=${accountId}`)
        const itemsWithCustomState = response.data.map((item) => ({
          ...item,
          showCustomInput: false,
          customCategory: "",
        }))
        setReviewItems(itemsWithCustomState)
      } catch (error) {
        console.error("Error fetching items for review:", error)
      }
      setLoading(false)
    }
    fetchReviewItems()
  }, [accountId])

  const handleCategoryUpdate = async (transactionId, newCategory) => {
    if (!newCategory) return

    setProcessingItems((prev) => new Set(prev).add(transactionId))
    try {
      await axios.patch(`http://127.0.0.1:8000/transactions/${transactionId}`, {
        category: newCategory,
      })
      setReviewItems((prevItems) => prevItems.filter((item) => item._id !== transactionId))
    } catch (error) {
      console.error("Error updating transaction:", error)
      alert("Failed to update transaction. Please try again.")
    }
    setProcessingItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(transactionId)
      return newSet
    })
  }

  const handleSelectChange = (transactionId, selectedValue) => {
    if (selectedValue === "add_new") {
      setReviewItems((prevItems) =>
        prevItems.map((item) => (item._id === transactionId ? { ...item, showCustomInput: true } : item)),
      )
    } else {
      handleCategoryUpdate(transactionId, selectedValue)
    }
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case "high":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatAmount = (amount) => {
    const num = Number.parseFloat(amount) || 0
    return num < 0 ? `-₹${Math.abs(num).toFixed(2)}` : `₹${num.toFixed(2)}`
  }

  const getAmountColor = (amount) => {
    const num = Number.parseFloat(amount) || 0
    return num < 0 ? "text-red-600" : "text-green-600"
  }

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Transactions to Review</h3>
          <p className="text-gray-600 text-sm">{reviewItems.length} transactions need categorization</p>
        </div>
      </div>

      {reviewItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h4>
          <p className="text-gray-600">No transactions are currently pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewItems.map((item) => {
            const isProcessing = processingItems.has(item._id)

            return (
              <div
                key={item._id}
                className={`bg-gradient-to-r from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/50 transition-all duration-200 ${
                  isProcessing ? "opacity-50" : "hover-lift"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Transaction Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {item["Transaction details"] || item.Description || "No Description"}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{item.Date || item.Timestamp || "N/A"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <span className={`text-sm font-semibold ${getAmountColor(item.Amount)}`}>
                              {formatAmount(item.Amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">Current:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getConfidenceColor(
                          item.confidence,
                        )}`}
                      >
                        {item.category} ({item.confidence})
                      </span>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="lg:w-80">
                    {item.showCustomInput ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Enter custom category"
                          value={item.customCategory}
                          onChange={(e) =>
                            setReviewItems((prevItems) =>
                              prevItems.map((i) => (i._id === item._id ? { ...i, customCategory: e.target.value } : i)),
                            )
                          }
                          className="w-full p-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                          disabled={isProcessing}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCategoryUpdate(item._id, item.customCategory)}
                            disabled={isProcessing || !item.customCategory}
                            className="flex-1 bg-green-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() =>
                              setReviewItems((prevItems) =>
                                prevItems.map((i) =>
                                  i._id === item._id ? { ...i, showCustomInput: false, customCategory: "" } : i,
                                ),
                              )
                            }
                            disabled={isProcessing}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select
                          onChange={(e) => handleSelectChange(item._id, e.target.value)}
                          value=""
                          disabled={isProcessing}
                          className="w-full p-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 disabled:opacity-50"
                        >
                          <option value="" disabled>
                            {isProcessing ? "Processing..." : "Re-categorize..."}
                          </option>
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="add_new">-- Add New Category --</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NeedsReview

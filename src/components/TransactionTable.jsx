"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Search,
  ArrowUp,
  ArrowDown,
  Calendar,
  Tag,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react"

function TransactionTable({ accountId }) {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [filterCategory, setFilterCategory] = useState("")
  const [filterConfidence, setFilterConfidence] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (!accountId) return

    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/transactions/?account_id=${accountId}`)
        setTransactions(response.data)
        setFilteredTransactions(response.data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
      setLoading(false)
    }

    fetchTransactions()
  }, [accountId])

  // Filter and search logic
  useEffect(() => {
    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        (transaction["Transaction details"] || transaction.Description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.category || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !filterCategory || transaction.category === filterCategory
      const matchesConfidence = !filterConfidence || transaction.confidence === filterConfidence

      return matchesSearch && matchesCategory && matchesConfidence
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] || ""
        let bValue = b[sortConfig.key] || ""

        if (sortConfig.key === "Amount") {
          aValue = Number.parseFloat(aValue) || 0
          bValue = Number.parseFloat(bValue) || 0
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }, [transactions, searchTerm, filterCategory, filterConfidence, sortConfig])

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    })
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

  const getCategoryIcon = (category) => {
    const icons = {
      Food: "🍽️",
      Groceries: "🛒",
      Shopping: "🛍️",
      Transport: "🚗",
      Travel: "✈️",
      "Bills & Subscriptions": "📄",
      Miscellaneous: "📦",
    }
    return icons[category] || "💰"
  }

  const formatAmount = (amount) => {
    const num = Number.parseFloat(amount) || 0
    return num < 0 ? `-₹${Math.abs(num).toFixed(2)}` : `₹${num.toFixed(2)}`
  }

  const getAmountColor = (amount) => {
    const num = Number.parseFloat(amount) || 0
    return num < 0 ? "text-red-600" : "text-green-600"
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const uniqueCategories = [...new Set(transactions.map((t) => t.category).filter(Boolean))]
  const uniqueConfidences = [...new Set(transactions.map((t) => t.confidence).filter(Boolean))]

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 text-balance">Transaction History</h3>
            <p className="text-gray-600 text-sm mt-1">
              {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Confidence Filter */}
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
          >
            <option value="">All Confidence</option>
            {uniqueConfidences.map((confidence) => (
              <option key={confidence} value={confidence}>
                {confidence}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm("")
              setFilterCategory("")
              setFilterConfidence("")
              setSortConfig({ key: null, direction: "asc" })
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("Date")}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                  {sortConfig.key === "Date" &&
                    (sortConfig.direction === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("Transaction details")}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  <span>Description</span>
                  {sortConfig.key === "Transaction details" &&
                    (sortConfig.direction === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("category")}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  <span>Category</span>
                  {sortConfig.key === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <span>Confidence</span>
                </span>
              </th>
              <th className="px-6 py-4 text-right">
                <button
                  onClick={() => handleSort("Amount")}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors ml-auto"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Amount</span>
                  {sortConfig.key === "Amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {currentTransactions.map((row, index) => (
              <tr key={row._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 font-medium">{row.Date || row.Timestamp || "N/A"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium max-w-xs truncate">
                    {row["Transaction details"] || row.Description || "No Description"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon(row.category)}</span>
                    <span className="text-sm text-gray-900 font-medium">{row.category || "N/A"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getConfidenceColor(
                      row.confidence,
                    )}`}
                  >
                    {row.confidence || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`text-sm font-bold ${getAmountColor(row.Amount)}`}>{formatAmount(row.Amount)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of{" "}
              {filteredTransactions.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTransactions.length === 0 && !loading && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default TransactionTable

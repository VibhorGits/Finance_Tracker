"use client"

// We can leave this import here. If we need highly custom styles
// that are tricky with Tailwind, we can add them to App.css later.
import "./App.css"
import { useState, useEffect } from "react"
import axios from "axios"
import Dashboard from "./components/Dashboard"
import FileUpload from "./components/FileUpload.jsx"
import AccountManager from "./components/AccountManager"
import TransactionTable from "./components/TransactionTable"
import NeedsReview from "./components/NeedsReview"
import SubscriptionList from "./components/SubscriptionList"
import Modal from "./components/Modal"
import AskAI from "./components/AskAI"
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  AlertCircle,
  Repeat,
  MessageSquare,
  Plus,
  Wallet,
  AlertTriangle,
} from "lucide-react"

function App() {
  const [fileUploadCount, setFileUploadCount] = useState(0)
  const [backendMessage, setBackendMessage] = useState("")
  const [accounts, setAccounts] = useState([])
  const [viewingAccount, setViewingAccount] = useState("")
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [backendAvailable, setBackendAvailable] = useState(false)

  // Use environment variable for API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/`)
      setAccounts(response.data)
      setBackendAvailable(true)
    } catch (error) {
      console.error("Error fetching accounts:", error)
      setBackendAvailable(false)
    }
  }

  const handleUploadSuccess = (uploadedAccountId) => {
    setFileUploadCount((prevCount) => prevCount + 1)
    if (uploadedAccountId) {
      setViewingAccount(uploadedAccountId) // Switch view to uploaded account
    }
  }

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/`)
        setBackendMessage(response.data.message)
        setBackendAvailable(true)
      } catch (error) {
        console.error("Error fetching data from backend:", error)
        setBackendMessage("Backend Offline")
        setBackendAvailable(false)
      }
    }

    fetchMessage()
  }, [])

  // Fetch accounts effect
  useEffect(() => {
    const fetchAndSetAccounts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/accounts/`)
        setAccounts(response.data)
        setBackendAvailable(true)
        if (response.data.length > 0 && viewingAccount === "") {
          setViewingAccount(response.data[0]._id)
        }
      } catch (error) {
        console.error("Error fetching accounts:", error)
        setBackendAvailable(false)
      }
    }
    fetchAndSetAccounts()
  }, [fileUploadCount, viewingAccount])

  const BackendStatusBanner = () => {
    if (backendAvailable) return null

    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              <strong>Backend Offline:</strong> The FastAPI backend at <code>http://127.0.0.1:8000</code> is not
              running. Start your backend server to enable full functionality.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
      <div className="max-w-7xl mx-auto">
        <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Brand Section */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 text-balance">Finance Tracker</h1>
                  <p className={`text-sm font-medium ${backendAvailable ? "text-green-600" : "text-amber-600"}`}>
                    {backendMessage || "Loading..."}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "accounts", label: "Accounts", icon: CreditCard },
                  { id: "transactions", label: "Transactions", icon: Receipt },
                  { id: "review", label: "Review", icon: AlertCircle },
                  { id: "subscriptions", label: "Subscriptions", icon: Repeat },
                  { id: "ask_ai", label: "Ask AI", icon: MessageSquare },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === id
                        ? "bg-green-100 text-green-700 shadow-sm"
                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile menu button - simplified for now */}
              <div className="md:hidden">
                <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <BackendStatusBanner />

          <div className="animate-fade-in">
            {/* Dashboard View */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 text-balance">Financial Dashboard</h2>
                    <p className="text-gray-600 mt-1">
                      Comprehensive insights into your spending patterns and financial health.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    disabled={!backendAvailable}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl hover-lift transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Import Data</span>
                  </button>
                </div>
                <Dashboard accountId={viewingAccount} />
              </div>
            )}

            {/* Accounts View */}
            {activeTab === "accounts" && (
              <div className="animate-slide-in">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 text-balance">Account Management</h2>
                  <p className="text-gray-600 mt-1">Manage your financial accounts and view account details.</p>
                </div>
                <AccountManager onAccountCreated={fetchAccounts} accounts={accounts} />
              </div>
            )}

            {/* Transactions View */}
            {activeTab === "transactions" && (
              <div className="animate-slide-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 text-balance">Transactions</h2>
                    <p className="text-gray-600 mt-1">View and analyze your transaction history.</p>
                  </div>
                </div>

                {accounts.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm">
                    <label htmlFor="view-account-select" className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Account
                    </label>
                    <select
                      id="view-account-select"
                      value={viewingAccount}
                      onChange={(e) => setViewingAccount(e.target.value)}
                      className="block w-full p-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                    >
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <TransactionTable key={`${viewingAccount}-${fileUploadCount}`} accountId={viewingAccount} />
              </div>
            )}

            {/* Needs Review View */}
            {activeTab === "review" && (
              <div className="animate-slide-in">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 text-balance">Needs Review</h2>
                  <p className="text-gray-600 mt-1">Review and categorize transactions that need attention.</p>
                </div>
                <NeedsReview accountId={viewingAccount} />
              </div>
            )}

            {/* Subscriptions View */}
            {activeTab === "subscriptions" && (
              <div className="animate-slide-in space-y-6">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 text-balance">Subscriptions</h2>
                  <p className="text-gray-600 mt-1">Track your recurring subscriptions and payments.</p>
                </div>

                {accounts.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm">
                    <label
                      htmlFor="subscriptions-account-select"
                      className="block text-sm font-semibold text-gray-700 mb-3"
                    >
                      Select Account
                    </label>
                    <select
                      id="subscriptions-account-select"
                      value={viewingAccount}
                      onChange={(e) => setViewingAccount(e.target.value)}
                      className="block w-full p-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                    >
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <SubscriptionList key={`${viewingAccount}-subscriptions`} accountId={viewingAccount} />
              </div>
            )}

            {/* Ask AI View */}
            {activeTab === "ask_ai" && (
              <div className="animate-slide-in">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 text-balance">AI Assistant</h2>
                  <p className="text-gray-600 mt-1">Get insights and answers about your financial data.</p>
                </div>
                <AskAI accountId={viewingAccount} />
              </div>
            )}
          </div>
        </main>

        {/* Enhanced Modal */}
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Transaction File">
          <FileUpload
            onUploadSuccess={() => {
              handleUploadSuccess()
              setIsImportModalOpen(false)
            }}
            accounts={accounts}
          />
        </Modal>
      </div>
    </div>
  )
}

export default App

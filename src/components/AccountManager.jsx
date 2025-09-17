"use client"

import { useState } from "react"
import axios from "axios"
import { Plus, CreditCard, Building, Wallet, PiggyBank, Trash2, Edit3, Check, X } from "lucide-react"

function AccountManager({ accounts = [], onAccountCreated }) {
  const [accountName, setAccountName] = useState("")
  const [accountType, setAccountType] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("")

  const accountTypes = [
    { value: "Bank Account", icon: Building, color: "bg-blue-100 text-blue-600" },
    { value: "Credit Card", icon: CreditCard, color: "bg-purple-100 text-purple-600" },
    { value: "Savings", icon: PiggyBank, color: "bg-green-100 text-green-600" },
    { value: "Wallet", icon: Wallet, color: "bg-orange-100 text-orange-600" },
  ]

  const getAccountIcon = (type) => {
    const accountType = accountTypes.find((t) => t.value === type)
    return accountType ? accountType.icon : Wallet
  }

  const getAccountColor = (type) => {
    const accountType = accountTypes.find((t) => t.value === type)
    return accountType ? accountType.color : "bg-gray-100 text-gray-600"
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!accountName || !accountType) {
      alert("Please provide both an account name and type.")
      return
    }

    setIsCreating(true)
    try {
      await axios.post("http://127.0.0.1:8000/accounts/", {
        account_name: accountName,
        account_type: accountType,
      })
      setAccountName("")
      setAccountType("")
      onAccountCreated()
    } catch (error) {
      console.error("Error creating account:", error)
      alert("Failed to create account. Please try again.")
    }
    setIsCreating(false)
  }

  const handleEditAccount = (account) => {
    setEditingAccount(account._id)
    setEditName(account.account_name)
    setEditType(account.account_type)
  }

  const handleSaveEdit = async (accountId) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/accounts/${accountId}`, {
        account_name: editName,
        account_type: editType,
      })
      setEditingAccount(null)
      onAccountCreated()
    } catch (error) {
      console.error("Error updating account:", error)
      alert("Failed to update account. Please try again.")
    }
  }

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/accounts/${accountId}`)
        onAccountCreated()
      } catch (error) {
        console.error("Error deleting account:", error)
        alert("Failed to delete account. Please try again.")
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Account Form */}
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Account</h3>
            <p className="text-gray-600 text-sm">Create a new financial account to track</p>
          </div>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="account-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Account Name
              </label>
              <input
                id="account-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., HDFC Savings"
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                disabled={isCreating}
              />
            </div>
            <div>
              <label htmlFor="account-type" className="block text-sm font-semibold text-gray-700 mb-2">
                Account Type
              </label>
              <select
                id="account-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                disabled={isCreating}
              >
                <option value="">Select account type</option>
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating || !accountName || !accountType}
            className="w-full md:w-auto gradient-primary text-white font-semibold px-8 py-3 rounded-xl hover-lift transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isCreating ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>

      {/* Accounts List */}
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Your Accounts</h3>
            <p className="text-gray-600 text-sm">{accounts.length} accounts configured</p>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h4>
            <p className="text-gray-600">Create your first account to start tracking your finances.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => {
              const IconComponent = getAccountIcon(acc.account_type)
              const isEditing = editingAccount === acc._id

              return (
                <div
                  key={acc._id}
                  className="bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/50 hover-lift transition-all duration-200"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Account name"
                      />
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      >
                        {accountTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.value}
                          </option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(acc._id)}
                          className="flex-1 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => setEditingAccount(null)}
                          className="flex-1 bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAccountColor(acc.account_type)}`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditAccount(acc)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(acc._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{acc.account_name}</h4>
                        <p className="text-gray-600 text-sm">{acc.account_type}</p>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountManager

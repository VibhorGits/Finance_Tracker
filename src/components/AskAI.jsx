"use client"

// src/components/AskAI.jsx
import { useState } from "react"
import axios from "axios"
import { Sparkles, Loader2 } from "lucide-react"

function AskAI({ accountId }) {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleQuerySubmit = async (e) => {
    e.preventDefault()
    if (!query || !accountId) return

    setLoading(true)
    setResponse("")
    try {
      const result = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/analytics/query/${accountId}`, {
        query: query,
      })
      setResponse(result.data.answer)
    } catch (error) {
      console.error("Error fetching AI response:", error)
      setResponse("Sorry, something went wrong. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI Assistant</h3>
          <p className="text-gray-600 text-sm">Ask questions about your financial data</p>
        </div>
      </div>

      <form onSubmit={handleQuerySubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., How much did I spend on food this month?"
            className="w-full p-4 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/50">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-2">AI Response</h4>
              <p className="text-purple-800 whitespace-pre-wrap leading-relaxed">{response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AskAI

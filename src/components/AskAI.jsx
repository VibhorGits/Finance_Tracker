// src/components/AskAI.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles } from 'lucide-react';

function AskAI({ accountId }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query || !accountId) return;

    setLoading(true);
    setResponse('');
    try {
      const result = await axios.post(`http://127.0.0.1:8000/analytics/query/${accountId}`, {
        query: query,
      });
      setResponse(result.data.answer);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setResponse("Sorry, something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <Sparkles className="w-6 h-6 mr-2 text-blue-500" />
        Ask a Question
      </h3>
      <form onSubmit={handleQuerySubmit} className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., How much did I spend on food?"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md border">
          <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}

export default AskAI;
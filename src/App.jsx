// We can leave this import here. If we need highly custom styles
// that are tricky with Tailwind, we can add them to App.css later.
import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import FileUpload from "./components/FileUpload.jsx";
import AccountManager from "./components/AccountManager";
import TransactionTable from "./components/TransactionTable";
import NeedsReview from "./components/NeedsReview";
import Modal from "./components/Modal";

function App() {
  const [fileUploadCount, setFileUploadCount] = useState(0);
  const [backendMessage, setBackendMessage] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [viewingAccount, setViewingAccount] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/accounts/");
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleUploadSuccess = (uploadedAccountId) => {
    setFileUploadCount((prevCount) => prevCount + 1);
    if (uploadedAccountId) {
      setViewingAccount(uploadedAccountId); // Switch view to uploaded account
    }
  };

  useEffect(() => {
    // We use an async function inside useEffect to handle the request
    const fetchMessage = async () => {
      try {
        // Make a GET request to our FastAPI server's root endpoint
        const response = await axios.get("http://127.0.0.1:8000/");
        // Store the received message in our state
        setBackendMessage(response.data.message);
      } catch (error) {
        console.error("Error fetching data from backend:", error);
        setBackendMessage("Could not connect to backend.");
      }
    };

    fetchMessage();
  }, []); // The empty array [] means this effect runs only once when the component mounts

  // In the useEffect that fetches accounts, set a default viewing account
  useEffect(() => {
    const fetchAndSetAccounts = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/accounts/");
        setAccounts(response.data);
        // If we don't have a viewing account set yet, default to the first one
        if (response.data.length > 0 && viewingAccount === "") {
          setViewingAccount(response.data[0]._id);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };
    fetchAndSetAccounts();
  }, [fileUploadCount]); // We can also make this re-run on upload

  return (
    // Set a background color for the whole page and ensure it's at least the full screen height
    <div className="bg-gray-100 min-h-screen">
      {/* Create a centered container with a max-width and some padding */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with padding, shadow, and flexbox for alignment */}
        <header className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Finance Tracker</h2>
          <p className="text-sm text-green-600 font-semibold">
            {backendMessage}
          </p>
          <nav className="space-x-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`font-medium ${
                activeTab === "dashboard"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={`font-medium ${
                activeTab === "accounts"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`font-medium ${
                activeTab === "transactions"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Transactions
            </button>

            <button
              onClick={() => setActiveTab("review")}
              className={`font-medium ${
                activeTab === "review"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Needs Review
            </button>
          </nav>
        </header>

        <div className="space-y-6">
          {/* Dashboard View */}
          {activeTab === "dashboard" && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Financial Dashboard
                  </h2>
                  <p className="text-gray-500">
                    Comprehensive insights into your spending patterns.
                  </p>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  Import More Data
                </button>
              </div>
              <Dashboard accountId={viewingAccount} />
            </>
          )}

          {/* Accounts View */}
          {activeTab === "accounts" && (
            <AccountManager
              onAccountCreated={fetchAccounts}
              accounts={accounts}
            />
          )}

          {/* Transactions View */}
          {activeTab === "transactions" && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <label
                  htmlFor="view-account-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Viewing Transactions for Account:
                </label>
                <select
                  id="view-account-select"
                  value={viewingAccount}
                  onChange={(e) => setViewingAccount(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <TransactionTable
                key={`${viewingAccount}-${fileUploadCount}`}
                accountId={viewingAccount}
              />
            </>
          )}

          {/* Needs Review View */}
          {activeTab === "review" && <NeedsReview accountId={viewingAccount} />}
        </div>

        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Transaction File"
        >
          <FileUpload
            onUploadSuccess={() => {
              handleUploadSuccess();
              setIsImportModalOpen(false); // Also close the modal on success
            }}
            accounts={accounts}
          />
        </Modal>
      </div>
    </div>
  );
}

export default App;

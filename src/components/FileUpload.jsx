"use client"

import { useState, useEffect, useRef } from "react"
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, CreditCard } from "lucide-react"
import axios from "axios"

function FileUpload({ onUploadSuccess, accounts = [] }) {
  const [selectedAccount, setSelectedAccount] = useState("")
  const [uploadStatus, setUploadStatus] = useState("idle") // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]._id)
    }
  }, [accounts, selectedAccount])

  const handleFileChange = async (file) => {
    if (!file) return

    if (!selectedAccount) {
      setErrorMessage("Please select an account first!")
      setUploadStatus("error")
      return
    }

    // Validate file type
    const allowedTypes = [".csv", ".txt", ".xlsx", ".xls"]
    const fileExtension = "." + file.name.split(".").pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      setErrorMessage("Please upload a valid file format (CSV, TXT, or Excel)")
      setUploadStatus("error")
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size must be less than 10MB")
      setUploadStatus("error")
      return
    }

    setUploadStatus("uploading")
    setUploadProgress(0)
    setErrorMessage("")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("account_id", selectedAccount)

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/uploadfile/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      console.log("File uploaded successfully:", response.data)
      setUploadStatus("success")

      // Auto-close after success
      setTimeout(() => {
        onUploadSuccess(selectedAccount)
      }, 1500)

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadStatus("error")
      setErrorMessage(error.response?.data?.detail || "Failed to upload file. Please try again.")

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleInputChange = (event) => {
    const file = event.target.files[0]
    handleFileChange(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const resetUpload = () => {
    setUploadStatus("idle")
    setUploadProgress(0)
    setErrorMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getAccountIcon = (accountType) => {
    return <CreditCard className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="space-y-3">
        <label htmlFor="account-select" className="block text-sm font-semibold text-gray-700">
          Select Account
        </label>
        <div className="relative">
          <select
            id="account-select"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            disabled={uploadStatus === "uploading"}
            className="w-full p-3 pl-10 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 disabled:opacity-50"
          >
            <option value="" disabled>
              Choose an account
            </option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.account_name} ({acc.account_type})
              </option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{getAccountIcon()}</div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700">Upload Transaction File</label>

        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
            dragActive
              ? "border-green-400 bg-green-50"
              : uploadStatus === "success"
                ? "border-green-300 bg-green-50"
                : uploadStatus === "error"
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-64 cursor-pointer ${
              uploadStatus === "uploading" ? "cursor-not-allowed" : ""
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploadStatus === "idle" && (
                <>
                  <UploadCloud
                    className={`w-12 h-12 mb-4 transition-colors ${dragActive ? "text-green-500" : "text-gray-400"}`}
                    strokeWidth={1.5}
                  />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV, TXT, Excel files (Max 10MB)</p>
                </>
              )}

              {uploadStatus === "uploading" && (
                <>
                  <Loader2 className="w-12 h-12 mb-4 text-green-500 animate-spin" strokeWidth={1.5} />
                  <p className="mb-2 text-sm text-gray-700 font-semibold">Uploading...</p>
                  <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
                </>
              )}

              {uploadStatus === "success" && (
                <>
                  <CheckCircle className="w-12 h-12 mb-4 text-green-500" strokeWidth={1.5} />
                  <p className="mb-2 text-sm text-green-700 font-semibold">Upload successful!</p>
                  <p className="text-xs text-green-600">Processing your transactions...</p>
                </>
              )}

              {uploadStatus === "error" && (
                <>
                  <AlertCircle className="w-12 h-12 mb-4 text-red-500" strokeWidth={1.5} />
                  <p className="mb-2 text-sm text-red-700 font-semibold">Upload failed</p>
                  <p className="text-xs text-red-600 mb-4 text-center max-w-xs">{errorMessage}</p>
                  <button
                    onClick={resetUpload}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              onChange={handleInputChange}
              disabled={uploadStatus === "uploading"}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* File Format Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Supported File Formats</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• CSV files from your bank or financial institution</li>
              <li>• TXT files with transaction data</li>
              <li>• Excel files (.xlsx, .xls) with transaction records</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUpload

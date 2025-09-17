"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import StatCard from "./StatCard"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Hash,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
} from "lucide-react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

// Register the necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend)

function Dashboard({ accountId }) {
  const [summary, setSummary] = useState(null)
  const [categoryData, setCategoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!accountId) return

    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      try {
        const summaryRes = axios.get(`http://127.0.0.1:8000/analytics/summary/${accountId}`)
        const categoryRes = axios.get(`http://127.0.0.1:8000/analytics/spending_by_category/${accountId}`)

        const [summaryData, categoryChartData] = await Promise.all([summaryRes, categoryRes])

        setSummary(summaryData.data)

        const labels = categoryChartData.data.map((item) => item.category)
        const data = categoryChartData.data.map((item) => item.total)
        setCategoryData({
          labels: labels,
          datasets: [
            {
              label: "Spending",
              data: data,
              backgroundColor: [
                "#15803d", // Primary green
                "#84cc16", // Secondary lime
                "#dc2626", // Red
                "#ea580c", // Orange
                "#f59e0b", // Amber
                "#8b5cf6", // Purple
                "#06b6d4", // Cyan
                "#ec4899", // Pink
              ],
              borderWidth: 0,
              hoverBorderWidth: 2,
              hoverBorderColor: "#ffffff",
            },
          ],
        })
        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Unable to load dashboard data. Please ensure the backend is running.")
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [accountId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Start your FastAPI backend server to view dashboard data.</p>
        </div>
      </div>
    )
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: "Inter, system-ui, sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#374151",
        bodyColor: "#374151",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${context.label}: ₹${value.toFixed(2)} (${percentage}%)`
          },
        },
      },
    },
    cutout: "60%", // For doughnut chart
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summary && (
          <>
            <StatCard
              title="Total Spending"
              value={`₹${summary.total_spending.toFixed(2)}`}
              icon={<ArrowDownCircle />}
              colorClass="text-red-500"
              trend={-5.2}
              trendLabel="vs last month"
            />
            <StatCard
              title="Total Income"
              value={`₹${summary.total_income.toFixed(2)}`}
              icon={<ArrowUpCircle />}
              colorClass="text-green-500"
              trend={8.1}
              trendLabel="vs last month"
            />
            <StatCard
              title="Net Cash Flow"
              value={`₹${summary.net_cash_flow.toFixed(2)}`}
              icon={summary.net_cash_flow >= 0 ? <TrendingUp /> : <TrendingDown />}
              colorClass={summary.net_cash_flow >= 0 ? "text-green-500" : "text-red-500"}
              trend={summary.net_cash_flow >= 0 ? 12.3 : -3.7}
              trendLabel="vs last month"
            />
            <StatCard
              title="Transactions"
              value={summary.transaction_count}
              icon={<Hash />}
              colorClass="text-blue-500"
              trend={15.8}
              trendLabel="vs last month"
            />
          </>
        )}
      </div>

      {/* Enhanced Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending Breakdown Chart */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-sm hover-lift">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 text-balance">Spending by Category</h3>
              <p className="text-gray-600 text-sm mt-1">Breakdown of your expenses</p>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="relative h-80">{categoryData && <Doughnut data={categoryData} options={chartOptions} />}</div>
        </div>

        {/* Quick Insights Panel */}
        <div className="space-y-6">
          {/* Top Category Card */}
          <div className="bg-gradient-to-br from-green-50 to-lime-50 p-6 rounded-2xl border border-green-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Top Category</h4>
                <p className="text-sm text-green-700">Highest spending</p>
              </div>
            </div>
            {categoryData && categoryData.datasets[0].data.length > 0 && (
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {
                    categoryData.labels[
                      categoryData.datasets[0].data.indexOf(Math.max(...categoryData.datasets[0].data))
                    ]
                  }
                </p>
                <p className="text-green-700 font-medium">₹{Math.max(...categoryData.datasets[0].data).toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Financial Health Score */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Health Score</h4>
                <p className="text-sm text-blue-700">Financial wellness</p>
              </div>
            </div>
            {summary && (
              <div>
                <div className="flex items-end space-x-2 mb-2">
                  <span className="text-3xl font-bold text-blue-900">{summary.net_cash_flow >= 0 ? "85" : "65"}</span>
                  <span className="text-blue-700 font-medium">/100</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summary.net_cash_flow >= 0 ? "85%" : "65%"}` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  {summary.net_cash_flow >= 0 ? "Excellent financial health!" : "Room for improvement"}
                </p>
              </div>
            )}
          </div>

          {/* Monthly Summary */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">This Month</h4>
                <p className="text-sm text-amber-700">Summary overview</p>
              </div>
            </div>
            {summary && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-amber-800 text-sm">Avg. per day</span>
                  <span className="font-semibold text-amber-900">₹{(summary.total_spending / 30).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800 text-sm">Transactions</span>
                  <span className="font-semibold text-amber-900">{summary.transaction_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800 text-sm">Avg. amount</span>
                  <span className="font-semibold text-amber-900">
                    ₹
                    {summary.transaction_count > 0
                      ? (summary.total_spending / summary.transaction_count).toFixed(0)
                      : "0"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

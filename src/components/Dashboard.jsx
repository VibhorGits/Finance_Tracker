import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './StatCard';
import { ArrowDownCircle, ArrowUpCircle, Hash, TrendingUp } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register the necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard({ accountId }) {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch both sets of data concurrently
        const summaryRes = axios.get(`http://127.0.0.1:8000/analytics/summary/${accountId}`);
        const categoryRes = axios.get(`http://127.0.0.1:8000/analytics/spending_by_category/${accountId}`);

        const [summaryData, categoryChartData] = await Promise.all([summaryRes, categoryRes]);

        setSummary(summaryData.data);

        // Prepare data for the pie chart
        const labels = categoryChartData.data.map(item => item.category);
        const data = categoryChartData.data.map(item => item.total);
        setCategoryData({
          labels: labels,
          datasets: [{
            label: 'Spending',
            data: data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          }]
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [accountId]);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading Dashboard...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary && <>
            <StatCard title="Total Spending" value={`₹${summary.total_spending.toFixed(2)}`} icon={<ArrowDownCircle />} colorClass="text-red-500" />
            <StatCard title="Total Income" value={`₹${summary.total_income.toFixed(2)}`} icon={<ArrowUpCircle />} colorClass="text-green-500" />
            <StatCard title="Net Cash Flow" value={`₹${summary.net_cash_flow.toFixed(2)}`} icon={<TrendingUp />} colorClass={summary.net_cash_flow >= 0 ? 'text-green-500' : 'text-red-500'} />
            <StatCard title="Transactions" value={summary.transaction_count} icon={<Hash />} />
          </>}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Spending by Category</h3>
        <div className="max-w-md mx-auto">
          {categoryData && <Pie data={categoryData} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
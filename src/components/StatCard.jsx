import React from 'react';

function StatCard({ title, value, icon, colorClass = 'text-gray-800' }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow flex items-center">
      <div className={`text-3xl p-3 bg-white rounded-full mr-4 ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default StatCard;
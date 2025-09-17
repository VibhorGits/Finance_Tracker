import { TrendingUp, TrendingDown } from "lucide-react"

function StatCard({ title, value, icon, colorClass = "text-gray-800", trend, trendLabel }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm hover-lift transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-3">{value}</p>

          {trend !== undefined && (
            <div className="flex items-center space-x-1">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
              {trendLabel && <span className="text-xs text-gray-500">{trendLabel}</span>}
            </div>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass.includes("red") ? "bg-red-50" : colorClass.includes("green") ? "bg-green-50" : colorClass.includes("blue") ? "bg-blue-50" : "bg-gray-50"}`}
        >
          <div className={`text-xl ${colorClass}`}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

export default StatCard

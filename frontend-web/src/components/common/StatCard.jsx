export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'indigo' }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-200/80' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-200/80' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-200/80' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'ring-rose-200/80' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-200/80' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600', ring: 'ring-sky-200/80' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', ring: 'ring-orange-200/80' },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 hover:border-stone-300 shadow-xs hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-stone-900 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-stone-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600 shadow-xs">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
            {badge && <span>{badge}</span>}
          </div>
          {subtitle && (
            <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

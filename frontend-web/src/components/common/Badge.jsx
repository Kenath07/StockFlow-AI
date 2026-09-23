import { STATUS_COLORS } from '../../utils/constants';

export default function Badge({ status, children, className = '' }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', dot: 'bg-stone-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border || 'border-stone-200'} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {children || status}
    </span>
  );
}

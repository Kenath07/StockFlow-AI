import { Smartphone, Bot, Clock, UserCheck, Zap, ShieldCheck } from 'lucide-react';

export default function TriggerBadge({ source, className = '' }) {
  const raw = String(source || 'System').trim();
  const lower = raw.toLowerCase();

  let config = {
    label: raw,
    icon: Zap,
    containerClass: 'bg-stone-100 text-stone-700 border-stone-200/80',
    iconClass: 'text-stone-500',
    dotClass: 'bg-stone-400',
  };

  if (lower.includes('flutter') || lower.includes('mobile') || lower.includes('field')) {
    config = {
      label: 'Field App (Flutter)',
      icon: Smartphone,
      containerClass: 'bg-sky-50 text-sky-800 border-sky-200 shadow-2xs',
      iconClass: 'text-sky-600',
      dotClass: 'bg-sky-500',
    };
  } else if (lower.includes('agentdirectory') || lower.includes('directoryui') || lower.includes('agent')) {
    config = {
      label: 'Agent Directory UI',
      icon: Bot,
      containerClass: 'bg-violet-50 text-violet-800 border-violet-200 shadow-2xs',
      iconClass: 'text-violet-600',
      dotClass: 'bg-violet-500',
    };
  } else if (lower.includes('scheduler') || lower.includes('cron') || lower.includes('automated')) {
    config = {
      label: 'Automated Scheduler',
      icon: Clock,
      containerClass: 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs',
      iconClass: 'text-amber-600',
      dotClass: 'bg-amber-500',
    };
  } else if (lower.includes('manager')) {
    config = {
      label: 'Manager Portal',
      icon: UserCheck,
      containerClass: 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-2xs',
      iconClass: 'text-indigo-600',
      dotClass: 'bg-indigo-500',
    };
  } else if (lower.includes('admin')) {
    config = {
      label: 'Admin Console',
      icon: ShieldCheck,
      containerClass: 'bg-purple-50 text-purple-800 border-purple-200 shadow-2xs',
      iconClass: 'text-purple-600',
      dotClass: 'bg-purple-500',
    };
  }

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.containerClass} ${className}`}
      title={`Trigger Source: ${raw}`}
    >
      <IconComponent className={`w-3.5 h-3.5 shrink-0 ${config.iconClass}`} />
      <span>{config.label}</span>
    </span>
  );
}

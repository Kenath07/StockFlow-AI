export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className={`${sizes[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} />
      {text && <p className="text-stone-600 text-sm font-medium">{text}</p>}
    </div>
  );
}

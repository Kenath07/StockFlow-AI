export default function BrandLogo({ 
  size = 'md', 
  theme = 'dark', // 'dark' (for light bg, dark text) or 'light' (for dark bg, white text)
  showSubtitle = true,
  showIcon = false,
  className = '' 
}) {
  const sizeConfig = {
    sm: {
      title: 'text-base',
      subtitle: 'text-[8px]',
      icon: 'w-7 h-7',
      gap: 'gap-0.5',
    },
    md: {
      title: 'text-[19px]',
      subtitle: 'text-[9.5px]',
      icon: 'w-9 h-9',
      gap: 'gap-0.5',
    },
    lg: {
      title: 'text-2xl',
      subtitle: 'text-[11px]',
      icon: 'w-11 h-11',
      gap: 'gap-1',
    },
    xl: {
      title: 'text-4xl sm:text-5xl',
      subtitle: 'text-xs sm:text-sm',
      icon: 'w-16 h-16',
      gap: 'gap-1.5',
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;
  const isLightText = theme === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className={`${currentSize.icon} shrink-0 drop-shadow-sm flex items-center justify-center`}>
          <img 
            src="/logo.png" 
            alt="StockFlow AI Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div className={`flex flex-col ${currentSize.gap}`}>
        <h1 className={`${currentSize.title} font-extrabold tracking-tight leading-none select-none flex items-center`}>
          <span className={isLightText ? 'text-white' : 'text-slate-800'}>Stock</span>
          <span className="text-[#FF6600]">Flow</span>
          <span className={`${isLightText ? 'text-white' : 'text-slate-800'} ml-0.5`}>AI</span>
        </h1>
        {showSubtitle && (
          <p className={`${currentSize.subtitle} ${isLightText ? 'text-stone-300' : 'text-slate-500'} font-medium tracking-[0.16em] uppercase leading-tight select-none mt-0.5`}>
            Intelligent Supply Chain SaaS
          </p>
        )}
      </div>
    </div>
  );
}

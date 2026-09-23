import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LOGIN_PRESETS } from '../../../utils/constants';
import { 
  Eye, EyeOff, LogIn, AlertCircle, 
  Bot, ShieldCheck, Radio, CheckCircle2, ArrowRight, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../../../components/common/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@stockflow.ai');
  const [password, setPassword] = useState('Admin@123');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'Admin') navigate('/dashboard');
      else if (user.role === 'Manager') navigate('/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setSelectedRole(preset.role);
    setError('');
  };

  const features = [
    {
      icon: Bot,
      title: 'AI Multi-Agent Pipeline',
      desc: '5 specialized agents analyze inventory deficits & demand',
      badge: 'Autonomous',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      icon: ShieldCheck,
      title: 'Human-in-the-Loop Gate',
      desc: 'Zero mutations without explicit manager authorization',
      badge: 'Strict Policy',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      icon: Radio,
      title: 'Real-time Field Operations',
      desc: 'GPS tracking, QR scans & offline-first cloud sync',
      badge: 'Live Telemetry',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
  ];

  return (
    <div className="min-h-screen flex font-sans selection:bg-orange-500 selection:text-white">
      {/* Left - Hero / Dynamic Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#121110] relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-stone-800">
        {/* Dynamic ambient gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-orange-600/10 via-stone-900 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Technical dot grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.12] pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} 
        />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent border border-orange-500/30 flex items-center justify-center shadow-lg p-2 backdrop-blur-md">
              <img src="/logo.png" alt="StockFlow AI Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <BrandLogo size="lg" theme="light" showSubtitle={true} />
          </div>
        </div>

        {/* Middle Value Proposition & Interactive Feature Cards */}
        <div className="relative z-10 my-auto py-8">
          {/* Live Engine Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span>Multi-Agent Engine Active • 5/5 Agents Ready</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Next-Gen Inventory with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">Autonomous AI</span>
          </h2>
          <p className="text-sm text-stone-400 leading-relaxed max-w-lg mb-8">
            Coordinating inventory replenishment, field officer telemetry, and managerial approvals seamlessly in one unified platform.
          </p>

          {/* Feature Highlight Cards */}
          <div className="space-y-3.5 max-w-lg">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i} 
                  className="group flex items-start gap-4 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 backdrop-blur-md shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 group-hover:border-orange-500/50 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-bold text-white group-hover:text-orange-200 transition-colors">{f.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${f.badgeColor}`}>
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 leading-normal">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Micro-Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-stone-500 pt-4 border-t border-stone-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>AI-Driven Supply Chain Logistics</span>
          </div>
          <span className="font-mono text-[11px] text-stone-600">v2.4 Enterprise</span>
        </div>
      </div>

      {/* Right - Login Form with High-Visibility Warm Grid Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-[#f7f6f0] overflow-hidden">
        {/* High-definition Warm Microgrid Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(28, 25, 23, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(28, 25, 23, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Warm Ambient Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Sign In Glass Card */}
        <div className="relative z-10 w-full max-w-[430px] bg-white/95 backdrop-blur-xl p-7 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-900/5">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 flex items-center justify-center shadow-xs overflow-hidden p-1.5">
              <img src="/logo.png" alt="StockFlow AI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <BrandLogo size="lg" theme="dark" showSubtitle={true} />
            </div>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Sign in to your account</h1>
            <p className="text-xs text-stone-500 mt-1">Enter your credentials to access the workspace</p>
          </div>

          {/* Quick Login Presets (Interactive Roles Selector) */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Quick Preset Access</p>
              <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">Examiner Ready</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LOGIN_PRESETS.map((preset) => {
                const isSelected = selectedRole === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleQuickLogin(preset)}
                    className={`relative px-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 text-center flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-orange-50/90 border-2 border-orange-500 text-orange-950 shadow-xs ring-2 ring-orange-400/20'
                        : 'bg-stone-50/80 hover:bg-stone-100 border border-stone-200/90 text-stone-700 hover:border-stone-300 shadow-2xs'
                    }`}
                  >
                    <span className="text-base mb-0.5">{preset.label.split(' ')[0]}</span>
                    <span className="text-[10px] font-semibold truncate w-full">{preset.role}</span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[11px] font-medium text-stone-400">or sign in with credentials</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@stockflow.ai"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50/80 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50/80 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs sm:text-sm font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

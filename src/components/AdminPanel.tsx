import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Upload,
  Laptop,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Layers,
  Image as ImageIcon,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { WallpaperItem } from '../utils/wallpaper-filters';
import { SlideToUnlock } from './SlideToUnlock';

interface AdminPanelProps {
  onBackToWebsite: () => void;
  wallpapers: WallpaperItem[];
  onRefreshWallpapers: () => Promise<void>;
  onAddCustomWallpaper?: (item: WallpaperItem) => void;
  onDeleteWallpaper?: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToWebsite,
  wallpapers,
  onRefreshWallpapers,
  onAddCustomWallpaper,
  onDeleteWallpaper,
}) => {
  // Authentication state - check both localStorage and sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem('gp_admin_auth') === 'true' ||
      sessionStorage.getItem('gp_admin_auth') === 'true'
    );
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);

  // 5-Minute (300 seconds) Auto-Logout Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(300);

  // Upload state
  const [activeTab, setActiveTab] = useState<'pc' | 'mobile'>('pc');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto logout when 5 minutes expire
          setIsAuthenticated(false);
          localStorage.removeItem('gp_admin_auth');
          sessionStorage.removeItem('gp_admin_auth');
          setLoginError('Security Session Expired: Automatically logged out after 5 minutes. Please sign in again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const performLogin = (inputUser: string, inputPass: string) => {
    const cleanUser = inputUser.trim().toLowerCase();
    const cleanPass = inputPass.trim();

    // Flexible authentication allowing standard variations of admin username & password
    const isUserValid =
      cleanUser === 'gpailab' ||
      cleanUser === 'gp_ai_lab' ||
      cleanUser === 'gpailab@gmail.com' ||
      cleanUser === 'admin';

    const isPassValid =
      cleanPass === '111984GP' ||
      cleanPass === '111984gp' ||
      cleanPass === '111984' ||
      cleanPass.toLowerCase() === '111984gp';

    if (isUserValid && isPassValid) {
      setIsAuthenticated(true);
      setTimeLeft(300); // Reset timer to 5 minutes on fresh login
      localStorage.setItem('gp_admin_auth', 'true');
      sessionStorage.setItem('gp_admin_auth', 'true');
      setLoginError(null);
      setLoginSuccessNotice('Welcome back, Administrator!');
      return true;
    } else {
      setLoginError('Invalid admin username or password. Please try again.');
      return false;
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gp_admin_auth');
    sessionStorage.removeItem('gp_admin_auth');
    setUsername('');
    setPassword('');
    setTimeLeft(300);
  };

  const handleBatchUpload = async (files: FileList | null, category: 'pc' | 'mobile') => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadStatus(null);
    setTimeLeft(300); // Reset auto-logout timer on activity

    const formData = new FormData();
    formData.append('category', category);
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      // 1. Try primary multipart upload with category query param
      const res = await fetch(`/api/wallpapers/upload?category=${category}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadStatus(
          `Successfully uploaded and permanently saved ${data.count || files.length} wallpaper(s) to ${category.toUpperCase()}!`
        );
        await onRefreshWallpapers();
      } else {
        // 2. Direct JSON Base64 Backup Upload: reads files and writes permanent files to disk
        const imagePayload: Array<{ name: string; dataUrl: string }> = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          imagePayload.push({ name: file.name, dataUrl });
        }

        const jsonRes = await fetch('/api/wallpapers/upload-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imagePayload, category }),
        });

        if (jsonRes.ok) {
          setUploadStatus(
            `Permanently saved ${imagePayload.length} wallpaper(s) to ${category.toUpperCase()} folder on server!`
          );
          await onRefreshWallpapers();
        } else {
          setUploadStatus('Upload failed. Please check file format and try again.');
        }
      }
    } catch {
      setUploadStatus('Upload encountered an error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: WallpaperItem) => {
    if (confirm(`Delete wallpaper "${item.title}"?`)) {
      try {
        await fetch(`/api/wallpapers/${item.id}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
      if (onDeleteWallpaper) {
        onDeleteWallpaper(item.id);
      }
      await onRefreshWallpapers();
    }
  };

  const pcWallpapers = wallpapers.filter((w) => w.deviceType === 'pc' || w.category.toLowerCase().includes('laptop') || w.category.toLowerCase().includes('pc'));
  const mobileWallpapers = wallpapers.filter((w) => w.deviceType === 'mobile' || w.category.toLowerCase().includes('mobile'));

  // 1. LOCKED LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#081520]/95 backdrop-blur-2xl text-slate-100 z-50">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
          <button
            onClick={onBackToWebsite}
            className="absolute top-6 left-6 text-xs font-mono text-slate-400 hover:text-teal-300 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pond</span>
          </button>

          <div className="text-center pt-6 pb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-bubbly text-3xl font-bold text-white tracking-wide">
              Studio Pond Admin
            </h2>
            <p className="font-mono text-xs text-teal-200 mt-1">
              Authorized Management Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-black/50 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[10px]">
                Slide to Authorize
              </label>
              <SlideToUnlock
                label="slide to sign in"
                onUnlock={() => {
                  if (!username.trim() || !password.trim()) {
                    setLoginError('Please enter admin username and password before sliding.');
                    return false;
                  }
                  return performLogin(username, password);
                }}
              />
            </div>

            <button
              type="button"
              onClick={onBackToWebsite}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Studio Pond Gallery</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#07121b]/98 text-slate-100 flex flex-col p-4 sm:p-8 z-50">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToWebsite}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Studio Pond</span>
          </button>
          <div>
            <h1 className="font-bubbly text-2xl sm:text-3xl font-bold text-white flex items-center space-x-2">
              <span>Gallery Management</span>
              <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
            </h1>
            <p className="font-mono text-xs text-teal-300">
              Active Management Session • Total Wallpapers: {wallpapers.length}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* 5-Minute Auto-Logout Countdown Timer Badge */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-colors ${
              timeLeft <= 60
                ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
                : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
            }`}
            title="Session automatically logs out after 5 minutes of inactivity for security"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">
              Auto Logout: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={onRefreshWallpapers}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 border border-white/15 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Re-scan</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-6xl w-full mx-auto flex-1 py-8 flex flex-col space-y-8">
        {/* Status notice */}
        {uploadStatus && (
          <div className="p-4 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {/* Category Tabs: Laptop / PC vs Mobile */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bubbly text-base sm:text-lg font-semibold flex items-center justify-center space-x-2.5 transition-all cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30 scale-102'
                : 'bg-white/10 hover:bg-white/15 text-slate-300'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span>Laptop / PC Wallpapers ({pcWallpapers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bubbly text-base sm:text-lg font-semibold flex items-center justify-center space-x-2.5 transition-all cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30 scale-102'
                : 'bg-white/10 hover:bg-white/15 text-slate-300'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>Mobile Wallpapers ({mobileWallpapers.length})</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/15 shadow-2xl">
          <h2 className="font-bubbly text-xl text-white mb-2 flex items-center space-x-2">
            <Upload className="w-5 h-5 text-teal-400" />
            <span>Upload {activeTab === 'pc' ? 'Laptop / PC (16:9 / 21:9)' : 'Mobile (9:16)'} Wallpapers</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mb-6">
            Upload single photos or a whole batch at once. Files automatically save to{' '}
            <code className="text-teal-300">/public/wallpapers/{activeTab}/</code> and immediately appear on the homepage.
          </p>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleBatchUpload(e.dataTransfer.files, activeTab);
            }}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                : 'border-white/20 hover:border-teal-400/50 bg-black/30 hover:bg-black/40'
            }`}
          >
            <Upload className="w-10 h-10 text-teal-400 mb-3 animate-bounce" />
            <div className="font-bubbly text-lg sm:text-xl font-bold text-white mb-1">
              {isUploading ? 'Compressing and uploading batch...' : `Drag & Drop ${activeTab === 'pc' ? 'PC' : 'Mobile'} Wallpapers Here`}
            </div>
            <p className="text-xs font-mono text-slate-400 mb-4">
              Supports .webp, .jpg, .png, .avif (Upload one or batch of 50+ images at once)
            </p>
            <span className="px-5 py-2 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-mono">
              Or Click to Browse Files
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={isUploading}
              onChange={(e) => handleBatchUpload(e.target.files, activeTab)}
              className="hidden"
            />
          </label>
        </div>

        {/* Existing Wallpapers List for active tab */}
        <div>
          <h3 className="font-bubbly text-xl text-white mb-4 flex items-center justify-between">
            <span>Currently Active {activeTab === 'pc' ? 'Laptop / PC' : 'Mobile'} Wallpapers</span>
            <span className="text-xs font-mono text-slate-400">
              {activeTab === 'pc' ? pcWallpapers.length : mobileWallpapers.length} items
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(activeTab === 'pc' ? pcWallpapers : mobileWallpapers).map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 hover:border-teal-400/40 transition-all shadow-lg"
              >
                <div className={`w-full overflow-hidden ${activeTab === 'mobile' ? 'aspect-[9/16]' : 'aspect-[16/9]'}`}>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-2.5 flex items-center justify-between bg-slate-900/90 text-xs font-mono">
                  <span className="text-white truncate max-w-[110px] text-[11px]">{item.title}</span>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="Delete wallpaper"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

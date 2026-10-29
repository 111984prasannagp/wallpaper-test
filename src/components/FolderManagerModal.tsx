import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Upload,
  RefreshCw,
  CheckCircle2,
  Folder,
  FileImage,
  AlertCircle,
  HardDrive,
  Radio,
} from 'lucide-react';

interface FolderManagerModalProps {
  folders: string[];
  totalWallpapers: number;
  onClose: () => void;
  onRescan: () => Promise<void>;
  isLiveConnected: boolean;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  folders,
  totalWallpapers,
  onClose,
  onRescan,
  isLiveConnected,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>(folders[0] || 'studio-pond');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/wallpapers/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Folder "${data.folder}" created successfully!`);
        setNewFolderName('');
        await onRescan();
        setSelectedFolder(data.folder);
      } else {
        setStatusMessage(`Error: ${data.error || 'Failed to create folder'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error creating folder: ${err.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleUploadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setStatusMessage(null);

    try {
      let count = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', selectedFolder);

        const res = await fetch('/api/wallpapers/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          count++;
        }
      }
      setStatusMessage(`Successfully uploaded ${count} image(s) to "${selectedFolder}"! The homepage has automatically updated.`);
      await onRescan();
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualRescan = async () => {
    setIsRescanning(true);
    await onRescan();
    setIsRescanning(false);
    setStatusMessage('Folder re-scanned! All wallpapers are up to date.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
      data-testid="folder-manager-modal"
    >
      <div
        className="relative w-full max-w-2xl bg-[#0a1826]/95 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl sm:text-2xl text-white font-medium">
                Wallpaper Folder Manager
              </h2>
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                <span>Directory: <code className="text-teal-300">/public/wallpapers/</code></span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>{isLiveConnected ? 'Auto-Sync Live' : 'Polling Sync'}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close folder manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className="mb-4 p-3 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-300" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Automatic detection instructions card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 leading-relaxed font-mono">
            <div className="text-teal-300 font-bold mb-1 flex items-center space-x-1.5">
              <FileImage className="w-4 h-4" />
              <span>How Auto-Detection Works:</span>
            </div>
            <p>
              Drop any <code className="text-white">.webp</code>, <code className="text-white">.jpg</code>, or <code className="text-white">.png</code> into any folder inside <code className="text-teal-300">/public/wallpapers/</code>. The backend immediately detects new files, generates lightweight compressed thumbnails on-the-fly, and expands the gallery in real time without touching any code!
            </p>
          </div>

          {/* Current detected folders list */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Detected Wallpaper Subfolders ({folders.length})</span>
              <button
                onClick={handleManualRescan}
                disabled={isRescanning}
                className="text-teal-300 hover:text-teal-200 flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRescanning ? 'animate-spin' : ''}`} />
                <span>Re-scan Now</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`p-2.5 rounded-xl border text-left font-mono text-xs flex items-center space-x-2 transition-all cursor-pointer ${
                    selectedFolder === f
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Folder className="w-4 h-4 shrink-0 text-teal-400" />
                  <span className="truncate">{f}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Create new collection folder form */}
          <form onSubmit={handleCreateFolder} className="flex items-center space-x-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Create new folder (e.g. synthwave, amoled-space)..."
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
            <button
              type="submit"
              disabled={isCreatingFolder || !newFolderName.trim()}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono flex items-center space-x-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-teal-300" />
              <span>Create</span>
            </button>
          </form>

          {/* Direct File Drag & Drop / Upload area */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Upload Wallpapers to <span className="text-teal-300">"{selectedFolder}"</span>
            </div>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleUploadFile(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-teal-400 bg-teal-500/10'
                  : 'border-white/20 hover:border-white/40 bg-black/20 hover:bg-black/30'
              }`}
            >
              <Upload className="w-8 h-8 text-teal-300 mb-2 animate-bounce" />
              <div className="text-sm font-medium text-white mb-1">
                {isUploading ? 'Compressing & uploading...' : 'Drop high-res wallpapers here'}
              </div>
              <div className="text-xs font-mono text-slate-400">
                Supports .webp, .jpg, .png, .avif (Up to 100MB 4K/8K master files)
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleUploadFile(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

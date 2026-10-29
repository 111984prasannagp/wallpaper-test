import React from 'react';
import { X, BookOpen, HardDrive, Cpu, Download, Sparkles, FolderTree, Code2 } from 'lucide-react';

interface DocumentationModalProps {
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
      data-testid="documentation-modal"
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-[#0a1826]/95 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif-title text-2xl text-white font-medium">
                Studio Pond Documentation & System Architecture
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Guide for autonomous directory ingestion, image compression & future updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close documentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          {/* Section 1: Folder Auto-Detection */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center space-x-2 text-teal-300 font-mono font-semibold mb-2">
              <FolderTree className="w-4 h-4" />
              <span>1. Zero-Config Automatic Directory Detection</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-3">
              You do <strong>not</strong> need to edit any code or rebuild the application when adding new wallpapers. The Express backend recursively indexes <code className="text-teal-200">/public/wallpapers/</code> in real time.
            </p>
            <div className="bg-black/60 rounded-xl p-3 font-mono text-xs text-slate-200 overflow-x-auto border border-white/10">
              <pre>{`/public/wallpapers/
├── studio-pond/         -> Automatically categorized as "Studio Pond"
│   ├── pond-dawn-4k.webp
│   └── lotus-night-4k.jpg
├── cyberpunk/           -> Categorized as "Cyberpunk"
│   └── neo-tokyo-4k.png
├── my-new-collection/   -> Creating ANY folder creates a new filter pill!
│   └── artwork.webp
└── featured-root.jpg    -> Files in root categorized under "Featured"`}</pre>
            </div>
          </div>

          {/* Section 2: On-The-Fly Compression vs Pristine Downloads */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center space-x-2 text-teal-300 font-mono font-semibold mb-2">
              <Cpu className="w-4 h-4" />
              <span>2. High-Performance Compression & Pristine Downloads</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-2">
              To guarantee instantaneous page load speeds with zero layout shifting:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm space-y-1.5 text-slate-300">
              <li>
                <strong>Web Gallery Previews:</strong> Generated on-the-fly by the backend using <code className="text-teal-300">Sharp</code> as lightweight 720p/80% WebP thumbnails and cached to <code className="text-teal-300">.cache/thumbs</code>.
              </li>
              <li>
                <strong>One-Click Download:</strong> When a user clicks <em>Download</em>, the backend directly streams the <strong>original uncompressed pristine file</strong> (or resizes precisely to selected 2K/1080p/Mobile dimensions without quality loss).
              </li>
            </ul>
          </div>

          {/* Section 3: Real-Time SSE (Server-Sent Events) */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center space-x-2 text-teal-300 font-mono font-semibold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>3. Live Automatic Refresh (No Manual Reload)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              The backend listens for file system modifications using native <code className="text-teal-300">fs.watch</code>. Whenever you drop, paste, or upload files into the wallpapers directory, an SSE event triggers and the frontend updates its state seamlessly with zero flickers.
            </p>
          </div>

          {/* Section 4: Interactive Pond Physics Engine */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center space-x-2 text-teal-300 font-mono font-semibold mb-2">
              <Code2 className="w-4 h-4" />
              <span>4. Pond Physics & Kinematics Engine</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-2">
              The background canvas runs an autonomous Koi flocking simulation decoupled in <code className="text-teal-300">src/utils/pond-physics.ts</code> with unit test coverage:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 text-slate-300">
              <li>Inverse kinematics segmented body undulation via sine wave propagation</li>
              <li>Mouse gesture tracking & ripple decay dynamics</li>
              <li>Soft boundary deflection preventing fish from getting stuck at screen borders</li>
              <li>Bioluminescent shader color palette toggle for Dark/Light mode</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

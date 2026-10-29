import React, { useState } from 'react';
import { Send, CheckCircle2, Sparkles, Feather, Compass, Mail, Globe, MapPin } from 'lucide-react';

export const AboutView: React.FC<{ onExploreWorks: () => void }> = ({ onExploreWorks }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 text-slate-100 animate-fadeIn select-none">
      <div className="text-center mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-teal-300 px-3 py-1 rounded-full bg-white/10 border border-teal-400/20">
          Philosophy & Origins
        </span>
        <h2 className="font-serif-title text-5xl sm:text-7xl font-normal text-white mt-4 drop-shadow">
          Studio Pond
        </h2>
        <p className="font-serif-sub italic text-xl sm:text-2xl text-teal-200 mt-2">
          An exploration in tranquil visual architecture and living digital habitats.
        </p>
      </div>

      <div className="space-y-8 text-base leading-relaxed text-slate-300 font-sans">
        <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl">
          <h3 className="font-serif-title text-2xl text-white mb-3">Living Serenity</h3>
          <p className="mb-4">
            Studio Pond was conceived as an antidote to frantic digital noise. Drawing inspiration from classical Japanese koi sanctuaries and modern architectural minimalism, this portal pairs high-precision 4K wallpaper curation with a real-time, interactive aquatic ecosystem.
          </p>
          <p>
            Every fish swimming beneath your viewport moves under authentic biomechanical sine wave kinematics. Ripples expand and dissipate through realistic wave propagation, allowing your display to breathe with the quiet rhythm of water.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-300 mb-3 border border-teal-400/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-serif-title text-xl text-white mb-2">Pristine 4K Mastery</h4>
            <p className="text-sm text-slate-300">
              Every wallpaper is curated in uncompromised 3840×2160 or 8K resolution, with zero compression artifacts on download.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-300 mb-3 border border-teal-400/20">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-serif-title text-xl text-white mb-2">Autonomous Ingestion</h4>
            <p className="text-sm text-slate-300">
              Drop wallpapers into any category folder and watch the system instantly index, optimize, and expand the gallery automatically.
            </p>
          </div>
        </div>

        <div className="text-center pt-6">
          <button
            onClick={onExploreWorks}
            className="px-8 py-3.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-teal-500/30 cursor-pointer hover:scale-105"
          >
            Explore All Works
          </button>
        </div>
      </div>
    </div>
  );
};

export const JournalView: React.FC<{ onReadArticle: (title: string) => void }> = () => {
  const articles = [
    {
      date: 'OCTOBER 2026',
      tag: 'Curation',
      title: 'The Architecture of Tranquility: Why Water Calms Modern Minds',
      excerpt: 'Exploring how subtle fluid motion and natural aquatic palettes enhance deep focus and cognitive decompression in desktop workspaces.',
      readTime: '4 min read',
    },
    {
      date: 'SEPTEMBER 2026',
      tag: 'Engineering',
      title: 'Procedural Kinematics: Crafting Segmented Koi Locomotion on Canvas',
      excerpt: 'A deep dive into sinusoidal wave propagation, soft boundary avoidance, and 60fps mobile GPU-friendly rendering in pure TypeScript.',
      readTime: '6 min read',
    },
    {
      date: 'AUGUST 2026',
      tag: 'Display Tech',
      title: 'Mastering True Black: Curating Wallpapers for Next-Gen OLED Displays',
      excerpt: 'How quantum dots and self-emissive organic diodes redefine spatial depth when paired with 100% true black contrast ratios.',
      readTime: '5 min read',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 text-slate-100 animate-fadeIn">
      <div className="text-center mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-teal-300 px-3 py-1 rounded-full bg-white/10 border border-teal-400/20">
          Dispatches & Essays
        </span>
        <h2 className="font-serif-title text-5xl sm:text-6xl font-normal text-white mt-4">
          The Pond Journal
        </h2>
      </div>

      <div className="space-y-6">
        {articles.map((art, idx) => (
          <article
            key={idx}
            className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 hover:border-teal-400/40 transition-all duration-300 shadow-xl group"
          >
            <div className="flex items-center space-x-3 text-xs font-mono text-teal-300 mb-2">
              <span>{art.date}</span>
              <span>•</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-white">{art.tag}</span>
              <span>•</span>
              <span className="text-slate-400">{art.readTime}</span>
            </div>
            <h3 className="font-serif-title text-2xl sm:text-3xl text-white font-medium mb-3 group-hover:text-teal-200 transition-colors">
              {art.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              {art.excerpt}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', series: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '', series: '' });
    }, 4000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 text-slate-100 animate-fadeIn">
      <div className="text-center mb-10">
        <span className="font-mono text-xs uppercase tracking-widest text-teal-300 px-3 py-1 rounded-full bg-white/10 border border-teal-400/20">
          Inquiries & Submissions
        </span>
        <h2 className="font-serif-title text-5xl font-normal text-white mt-4">
          Connect with Studio Pond
        </h2>
        <p className="text-sm font-sans text-slate-300 mt-2">
          Submit high-resolution artwork collections or reach the curators.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl">
        {submitted ? (
          <div className="text-center py-8 space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-teal-300 mx-auto animate-bounce" />
            <h3 className="font-serif-title text-2xl text-white">Message Transmitted</h3>
            <p className="text-xs font-mono text-slate-300">
              Thank you for reaching out to Studio Pond. Our curators will review your transmission.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Your Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Aiden Vance"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aiden@example.com"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Wallpaper Collection Subject</label>
              <input
                type="text"
                value={formData.series}
                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                placeholder="E.g., Kyoto Zen Dawn in 8K"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your thoughts or portfolio link..."
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/25"
            >
              <Send className="w-4 h-4" />
              <span>Send Transmission</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

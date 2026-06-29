"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface UploadFormProps {
  onSubmit: (data: { image: string; location: string; situation: string }) => void;
  loading: boolean;
}

const SAMPLE_SCENARIOS = [
  { label: "Flash Flood — Houston", location: "Downtown Houston, TX", situation: "Flash flooding after heavy rainfall. Multiple streets submerged, vehicles stranded. Reports of 30+ people trapped in a shopping center basement.", image: "/assets/flood.jpg" },
  { label: "Wildfire — California", location: "San Bernardino, CA", situation: "Fast-moving wildfire approaching residential areas. Wind speeds 40mph. Multiple structures threatened. Visibility near zero from smoke.", image: "/assets/wildfire.jpg" },
  { label: "Earthquake — Turkey", location: "Hatay, Turkey", situation: "7.2 magnitude earthquake. Multiple building collapses reported. Gas leaks detected. Hospital partially collapsed with patients inside.", image: "/assets/earthquake.jpg" },
];

export default function UploadForm({ onSubmit, loading }: UploadFormProps) {
  const [image, setImage] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [location, setLocation] = useState("");
  const [situation, setSituation] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const original = e.target?.result as string;
      setPreview(original);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1024;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        setImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const loadSample = (scenario: typeof SAMPLE_SCENARIOS[0]) => {
    setLocation(scenario.location);
    setSituation(scenario.situation);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !location) return;
    onSubmit({ image, location, situation });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Quick Demo Scenarios</label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SCENARIOS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => loadSample(s)}
              className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-zinc-300"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-red-500 bg-red-500/10"
            : preview
            ? "border-zinc-600 bg-zinc-800/50"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Disaster scene" className="max-h-48 mx-auto rounded-lg object-cover" />
            <p className="text-sm text-zinc-400">Click or drop to replace</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <div className="text-4xl">📷</div>
            <p className="text-zinc-300 font-medium">Upload Disaster Image</p>
            <p className="text-sm text-zinc-500">Drag & drop or click to browse</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Downtown Houston, TX"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Situation Report</label>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="Describe what's happening..."
          rows={3}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
        />
      </div>

      <motion.button
        type="submit"
        disabled={!image || !location || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          !image || !location || loading
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-900/30"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Agents Analyzing...
          </span>
        ) : (
          "🚨 Deploy AI Agents"
        )}
      </motion.button>
    </motion.form>
  );
}

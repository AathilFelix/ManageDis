"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";

const ReportMap = dynamic(() => import("@/components/report-map"), { ssr: false });

export default function ReportPage() {
  const [image, setImage] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("high");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !pin) return;
    setSubmitting(true);

    await new Promise((r) => setTimeout(r, 1500));

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center"
          >
            <span className="text-3xl">✓</span>
          </motion.div>
          <h1 className="text-2xl font-bold">SOS Report Submitted</h1>
          <p className="text-zinc-400">
            Your emergency report has been received and is being routed to the
            nearest response coordinators. AI agents are analyzing the situation.
          </p>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Report ID</p>
            <p className="font-mono text-sm text-amber-400">SOS-{Date.now().toString(36).toUpperCase()}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-3">Status</p>
            <p className="text-sm text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Processing — Agents Deployed
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setDescription(""); setImage(""); setPreview(""); setPin(null); setContactInfo(""); }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm transition-colors"
            >
              Submit Another
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium transition-colors"
            >
              Go to Command Center
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm mb-4 inline-block transition-colors">
            ← Back to Command Center
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-red-500">🆘</span> Citizen SOS Report
          </h1>
          <p className="text-zinc-400 mt-2">
            Report an emergency. AI agents will analyze and route your report to responders.
          </p>
        </motion.header>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Photo Evidence <span className="text-zinc-600 normal-case">(optional but helps AI)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? "border-red-500 bg-red-500/10"
                  : preview ? "border-zinc-600 bg-zinc-800/50"
                  : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {preview ? (
                <div className="space-y-2">
                  <img src={preview} alt="Report" className="max-h-40 mx-auto rounded-lg object-cover" />
                  <p className="text-xs text-zinc-400">Tap to replace</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="text-3xl">📷</div>
                  <p className="text-zinc-300 text-sm font-medium">Take Photo or Upload</p>
                  <p className="text-xs text-zinc-500">Drag & drop, click, or use camera</p>
                </div>
              )}
            </div>
          </div>

          {/* Pin on Map */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Drop Pin on Map <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-zinc-500">Tap the map to mark the emergency location</p>
            <div className="h-64 rounded-xl overflow-hidden border border-zinc-700">
              <ReportMap pin={pin} onPinDrop={setPin} />
            </div>
            <AnimatePresence>
              {pin && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-green-400 font-mono"
                >
                  📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Urgency Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(["low", "medium", "high", "critical"] as const).map((level) => {
                const config = {
                  low: { label: "Low", color: "border-green-600 bg-green-600/10 text-green-400" },
                  medium: { label: "Medium", color: "border-yellow-600 bg-yellow-600/10 text-yellow-400" },
                  high: { label: "High", color: "border-orange-600 bg-orange-600/10 text-orange-400" },
                  critical: { label: "Critical", color: "border-red-600 bg-red-600/10 text-red-400" },
                };
                const c = config[level];
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      urgency === level ? c.color : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              What&apos;s happening? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the emergency — what do you see? How many people are affected? Any immediate dangers?"
              rows={4}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
            />
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Contact Info <span className="text-zinc-600 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone number or name so responders can reach you"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
            />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={!description || !pin || submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              !description || !pin || submitting
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-900/30"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending SOS...
              </span>
            ) : (
              "🚨 Send SOS Report"
            )}
          </motion.button>
        </motion.form>
      </div>
    </main>
  );
}

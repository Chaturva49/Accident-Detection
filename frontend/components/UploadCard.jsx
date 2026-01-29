import { useState } from "react";
import { motion } from "framer-motion";

export default function UploadCard({
  backendUrl,
  onUploadStart,
  onUploadComplete,
  loading,
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.type.startsWith("video/")) {
      setError("Please select a valid video file (MP4, MOV, AVI, etc.).");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a video file first.");
      return;
    }

    setError("");
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch(`${backendUrl}/upload-video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to process video.");
      }

      const data = await response.json();
      onUploadComplete?.(file, data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error while uploading.");
      onUploadComplete?.(file, {
        accident: false,
        confidence: 0,
        boxes: [],
      });
    }
  };

  return (
    <motion.div
      className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-xl p-5 md:p-6 space-y-4"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
    >
      <p className="text-sm font-semibold mb-1">Upload Video</p>
      <p className="text-xs text-slate-300 mb-2">
        Drag &amp; drop your dashcam footage or browse your files. Supported formats: MP4,
        MOV, AVI.
      </p>

      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-2xl py-6 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 transition">
        <span className="text-xs text-slate-300">
          {file ? `Selected: ${file.name}` : "Click to choose a video file"}
        </span>
        <span className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary-light border border-primary/40">
          Browse Files
        </span>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary hover:bg-primary-dark text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>Run Detection</>
          )}
        </button>

        <button
          type="button"
          className="px-4 py-2 text-xs font-medium rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 transition"
          onClick={() => alert("Live detection endpoint is exposed at /stream-detect.")}
        >
          Live Detection
        </button>
      </div>
    </motion.div>
  );
}



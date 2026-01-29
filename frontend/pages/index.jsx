import Head from "next/head";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import UploadCard from "@/components/UploadCard";
import DetectionPlayer from "@/components/DetectionPlayer";
import AlertModal from "@/components/AlertModal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [detections, setDetections] = useState([]);
  const [accident, setAccident] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accidentTime, setAccidentTime] = useState(null);
  const [accidentType, setAccidentType] = useState("");
  const [objectsInvolved, setObjectsInvolved] = useState([]);
  const [severity, setSeverity] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [timelineMarkers, setTimelineMarkers] = useState([]);

  // UI-level accident flag:
  // For your UI, always show Accident: YES / Status: Not Safe
  // (backend `accident` is still used for header and alert)
  const displayAccident = true;

  const handleUploadComplete = (file, result) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
    setDetections(result?.boxes || []);
    setAccident(Boolean(result?.accident));
    setConfidence(result?.confidence || 0);
    setAccidentTime(result?.accident_time ?? null);
    setAccidentType(result?.accident_type || "");
    setObjectsInvolved(result?.objects_involved || []);
    setSeverity(result?.severity || "");
    setVideoDuration(result?.video_duration || 0);
    setTimelineMarkers(result?.timeline_markers || []);
    setLoading(false);
  };

  const handleUploadStart = () => {
    setLoading(true);
    setAccident(false);
    setConfidence(0);
    setDetections([]);
    setAccidentTime(null);
    setAccidentType("");
    setObjectsInvolved([]);
    setSeverity("");
    setVideoDuration(0);
    setTimelineMarkers([]);
  };

  return (
    <>
      <Head>
        <title>Accident Detection Dashboard</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
        <Navbar />

        <main className="px-4 md:px-10 lg:px-20 py-8 md:py-12">
          <section className="grid lg:grid-cols-2 gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-white/10 border border-white/10 backdrop-blur-xl shadow-xl rounded-2xl p-6 md:p-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Real-time <span className="text-primary-light">Accident Detection</span>
                </h1>
                <p className="text-slate-300 mb-6">
                  Upload dashcam footage or connect a live feed to automatically detect
                  potential road accidents using AI-powered YOLOv8.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary-light border border-primary/40">
                    YOLOv8 · Ultralytics
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/40">
                    Flask · Next.js
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/40">
                    Tailwind · Framer Motion
                  </span>
                </div>
              </div>

              <UploadCard
                backendUrl={BACKEND_URL}
                onUploadStart={handleUploadStart}
                onUploadComplete={handleUploadComplete}
                loading={loading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-2xl p-4 md:p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Detection Status
                  </p>
                  <p className="text-lg font-semibold">
                    {accident ? "Accident Detected" : "Monitoring"}
                  </p>
                  {typeof accidentTime === "number" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Timestamp:{" "}
                      <span className="text-slate-200 font-medium">
                        {accidentTime.toFixed(2)}s
                      </span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Confidence</p>
                  <p className="text-xl font-semibold text-primary-light">
                    {(confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Accident</p>
                  <p>{displayAccident ? "YES" : "NO"}</p>
                  <p>
                    Status:{" "}
                    <span className={displayAccident ? "text-red-400" : "text-emerald-400"}>
                      {displayAccident ? "Not Safe" : "Safe"}
                    </span>
                  </p>
                  {severity && (
                    <p>
                      Severity: <span className="font-medium">{severity}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Details</p>
                  {accidentType && accidentType !== "None" && (
                    <p>Type: {accidentType}</p>
                  )}
                  {objectsInvolved?.length > 0 && (
                    <p>
                      Objects:{" "}
                      <span className="text-slate-100">
                        {objectsInvolved.join(", ")}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <DetectionPlayer
                videoSrc={videoUrl}
                detections={detections}
                timelineMarkers={timelineMarkers}
                videoDuration={videoDuration}
              />

              {detections.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const report = {
                        accident: displayAccident,
                        confidence,
                        accident_time: accidentTime,
                        accident_type: accidentType,
                        objects_involved: objectsInvolved,
                        severity,
                        video_duration: videoDuration,
                        timeline_markers: timelineMarkers,
                      };
                      const blob = new Blob([JSON.stringify(report, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "accident_report.json";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/15 hover:bg-white/15 transition"
                  >
                    📄 Download Report
                  </button>
                </div>
              )}
            </motion.div>
          </section>

          <section className="mt-10 grid md:grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="font-semibold mb-1">Upload</p>
              <p>Drop in dashcam footage in MP4 format and run detection with a single click.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="font-semibold mb-1">Analyze</p>
              <p>YOLOv8 scans frames for collisions and hazardous events in near real-time.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="font-semibold mb-1">Alert</p>
              <p>Visual alerts highlight high-risk incidents for rapid response.</p>
            </div>
          </section>
        </main>

        <AlertModal
          show={accident}
          confidence={confidence}
          accidentTime={accidentTime}
          accidentType={accidentType}
          severity={severity}
          onClose={() => setAccident(false)}
        />
      </div>
    </>
  );
}



import { useEffect, useRef } from "react";

export default function DetectionPlayer({
  videoSrc,
  detections,
  timelineMarkers = [],
  videoDuration = 0,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = video.clientWidth || video.videoWidth || 640;
      canvas.height = video.clientHeight || video.videoHeight || 360;
      drawBoxes(video.currentTime || 0);
    };

    const drawBoxes = (currentTime) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const visibleBoxes = detections.filter((box) => {
        if (typeof box.timestamp !== "number") return true;
        return Math.abs(box.timestamp - currentTime) < 0.25;
      });

      visibleBoxes.forEach((box) => {
        const { x1, y1, x2, y2, confidence } = box;
        ctx.strokeStyle = "rgba(239,68,68,0.95)";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(248,113,113,0.9)";

        const width = x2 - x1;
        const height = y2 - y1;
        ctx.strokeRect(x1, y1, width, height);

        const label = `Accident ${(confidence * 100).toFixed(1)}%`;
        const textWidth = ctx.measureText(label).width + 10;
        const textHeight = 18;

        ctx.fillStyle = "rgba(248,113,113,0.95)";
        ctx.fillRect(x1, Math.max(0, y1 - textHeight), textWidth, textHeight);

        ctx.fillStyle = "white";
        ctx.font = "10px system-ui";
        ctx.fillText(label, x1 + 5, Math.max(10, y1 - 6));
      });
    };

    const handleTimeUpdate = () => {
      drawBoxes(video.currentTime || 0);
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    video.addEventListener("loadedmetadata", resizeCanvas);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      video.removeEventListener("loadedmetadata", resizeCanvas);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [detections]);

  const duration = videoDuration || 0;

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
        {videoSrc ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              controls
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 w-full h-full"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Video preview will appear here after upload.
          </div>
        )}
      </div>

      {duration > 0 && timelineMarkers.length > 0 && (
        <div className="mt-1">
          <div className="h-1.5 w-full rounded-full bg-slate-700 relative overflow-hidden">
            {timelineMarkers.map((t) => {
              const clamped = Math.max(0, Math.min(duration, t));
              const left = (clamped / duration) * 100;
              return (
                <div
                  key={t}
                  className="absolute top-0 -mt-[1px] h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(248,113,113,0.9)]"
                  style={{ left: `${left}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0s</span>
            <span>{duration.toFixed(1)}s</span>
          </div>
        </div>
      )}
    </div>
  );
}


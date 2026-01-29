import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 px-4 md:px-10 lg:px-20 py-4 backdrop-blur-xl bg-slate-950/60 border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">AD</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">
              Accident Detection
            </p>
            <p className="text-[11px] text-slate-400">
              Computer Vision Safety Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
            Python 3.13 · Flask
          </span>
          <span className="hidden sm:inline px-3 py-1 rounded-full bg-primary/10 border border-primary/40 text-primary-light">
            YOLOv8 · Ultralytics
          </span>
        </div>
      </div>
    </motion.header>
  );
}



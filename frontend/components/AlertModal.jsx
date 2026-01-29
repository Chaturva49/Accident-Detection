import { motion, AnimatePresence } from "framer-motion";

export default function AlertModal({
  show,
  confidence,
  accidentTime,
  accidentType,
  severity,
  onClose,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="relative w-[90%] max-w-md rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-rose-500 shadow-2xl border border-white/20 p-6"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center animate-pulse">
              <span className="h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xl font-bold">
                !
              </span>
            </div>

            <div className="mt-4 text-center text-white">
              <h2 className="text-xl font-bold mb-2">🚨 Accident Detected</h2>
              <p className="text-sm mb-1">
                The AI model has detected a potential road accident in the current footage.
              </p>
              {typeof accidentTime === "number" && (
                <p className="text-xs text-red-100 mb-1">
                  Time: <span className="font-semibold">{accidentTime.toFixed(2)}s</span>
                </p>
              )}
              {accidentType && accidentType !== "None" && (
                <p className="text-xs text-red-100 mb-1">
                  Type: <span className="font-semibold">{accidentType}</span>
                </p>
              )}
              {severity && severity !== "None" && (
                <p className="text-xs text-red-100 mb-1">
                  Severity: <span className="font-semibold">{severity}</span>
                </p>
              )}
              <p className="text-xs font-medium uppercase tracking-wide text-red-100 mt-1">
                Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-white/90 text-red-600 hover:bg-white transition shadow-md"
              >
                Dismiss Alert
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



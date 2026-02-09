import { useState, type FormEvent } from "react";
import { X, Car } from "lucide-react";
import api from "@/lib/api";

interface TrafficFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TrafficForm({ open, onClose, onSuccess }: TrafficFormProps) {
  const [congestion, setCongestion] = useState("");
  const [speed, setSpeed] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/traffic", {
        congestion_level: parseFloat(congestion),
        speed: parseFloat(speed),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axErr = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        axErr.response?.data?.error?.message || "Failed to create record"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-950 border border-brand/10 p-6 shadow-[0_0_30px_rgba(0,255,65,0.05)] corner-borders">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-400"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex items-center gap-2 text-xs font-mono text-brand tracking-wider mb-4">
          <Car className="h-3.5 w-3.5" />
          {">"} ADD_TRAFFIC_DATA
        </h2>
        {error && (
          <div
            className="mb-4 border border-danger/20 bg-danger/5 p-3 text-[10px] font-mono text-danger tracking-wider"
            role="alert"
          >
            [ERROR] {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="congestion" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
              CONGESTION_LEVEL (0-100%)
            </label>
            <input
              id="congestion"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={congestion}
              onChange={(e) => setCongestion(e.target.value)}
              required
              className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="speed" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
              SPEED (KM/H)
            </label>
            <input
              id="speed"
              type="number"
              min="0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              required
              className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-brand/10 bg-gray-950 px-4 py-2 text-[10px] font-mono text-gray-400 hover:text-brand hover:border-brand/30 tracking-wider transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 disabled:opacity-50 tracking-wider transition-colors"
            >
              {loading ? "PROCESSING..." : "CREATE_RECORD"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

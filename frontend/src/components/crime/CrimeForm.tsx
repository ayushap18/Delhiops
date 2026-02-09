import { useState, type FormEvent } from "react";
import { X, ShieldAlert } from "lucide-react";
import api from "@/lib/api";

interface CrimeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CrimeForm({ open, onClose, onSuccess }: CrimeFormProps) {
  const [form, setForm] = useState({
    type: "",
    lat: "28.6139",
    lng: "77.2090",
    severity: "medium",
    status: "reported",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/crime", {
        type: form.type,
        location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        severity: form.severity,
        status: form.status,
        timestamp: new Date().toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axErr = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        axErr.response?.data?.error?.message || "Failed to create report"
      );
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-950 border border-danger/10 p-6 shadow-[0_0_30px_rgba(255,0,60,0.05)] corner-borders">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-400"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex items-center gap-2 text-xs font-mono text-danger tracking-wider mb-4">
          <ShieldAlert className="h-3.5 w-3.5" />
          {">"} REPORT_CRIME
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
            <label htmlFor="crime-type" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
              CRIME_TYPE
            </label>
            <input
              id="crime-type"
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              required
              maxLength={100}
              className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              placeholder="e.g., Theft, Assault"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="crime-lat" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                LATITUDE
              </label>
              <input
                id="crime-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => update("lat", e.target.value)}
                required
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="crime-lng" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                LONGITUDE
              </label>
              <input
                id="crime-lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => update("lng", e.target.value)}
                required
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="crime-severity" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                SEVERITY
              </label>
              <select
                id="crime-severity"
                value={form.severity}
                onChange={(e) => update("severity", e.target.value)}
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:outline-none transition-all"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
                <option value="critical">CRITICAL</option>
              </select>
            </div>
            <div>
              <label htmlFor="crime-status" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                STATUS
              </label>
              <select
                id="crime-status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:outline-none transition-all"
              >
                <option value="reported">REPORTED</option>
                <option value="investigating">INVESTIGATING</option>
                <option value="resolved">RESOLVED</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>
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
              className="border border-danger/20 bg-danger/5 px-4 py-2 text-[10px] font-mono text-danger hover:bg-danger/10 disabled:opacity-50 tracking-wider transition-colors"
            >
              {loading ? "PROCESSING..." : "FILE_REPORT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

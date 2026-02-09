import { useState, type FormEvent } from "react";
import { X, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

interface IncidentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IncidentForm({ open, onClose, onSuccess }: IncidentFormProps) {
  const [form, setForm] = useState({
    type: "",
    lat: "28.6139",
    lng: "77.2090",
    severity: "medium",
    description: "",
    status: "open",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/incidents", {
        type: form.type,
        location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        severity: form.severity,
        description: form.description,
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
        axErr.response?.data?.error?.message || "Failed to create incident"
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
      <div className="relative z-10 w-full max-w-lg bg-gray-950 border border-warning/10 p-6 shadow-[0_0_30px_rgba(255,184,0,0.05)] corner-borders max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-400"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex items-center gap-2 text-xs font-mono text-warning tracking-wider mb-4">
          <AlertTriangle className="h-3.5 w-3.5" />
          {">"} CREATE_INCIDENT
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
            <label htmlFor="inc-type" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
              INCIDENT_TYPE
            </label>
            <input
              id="inc-type"
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              required
              maxLength={100}
              className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              placeholder="e.g., Fire, Flood, Accident"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inc-lat" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                LATITUDE
              </label>
              <input
                id="inc-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => update("lat", e.target.value)}
                required
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="inc-lng" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                LONGITUDE
              </label>
              <input
                id="inc-lng"
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
              <label htmlFor="inc-severity" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                SEVERITY
              </label>
              <select
                id="inc-severity"
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
              <label htmlFor="inc-status" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                STATUS
              </label>
              <select
                id="inc-status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:outline-none transition-all"
              >
                <option value="open">OPEN</option>
                <option value="in_progress">IN_PROGRESS</option>
                <option value="resolved">RESOLVED</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="inc-desc" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
              DESCRIPTION
            </label>
            <textarea
              id="inc-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={5000}
              rows={3}
              className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              placeholder="Describe the incident..."
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
              className="border border-warning/20 bg-warning/5 px-4 py-2 text-[10px] font-mono text-warning hover:bg-warning/10 disabled:opacity-50 tracking-wider transition-colors"
            >
              {loading ? "PROCESSING..." : "LOG_INCIDENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { X, Wind } from "lucide-react";
import api from "@/lib/api";

interface AqiFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AqiForm({ open, onClose, onSuccess }: AqiFormProps) {
  const [form, setForm] = useState({
    lat: "28.6139",
    lng: "77.2090",
    aqi: "",
    pm2_5: "",
    pm10: "",
    o3: "",
    no2: "",
    so2: "",
    co: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/aqi", {
        location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        aqi: parseInt(form.aqi),
        pm2_5: form.pm2_5 ? parseFloat(form.pm2_5) : undefined,
        pm10: form.pm10 ? parseFloat(form.pm10) : undefined,
        o3: form.o3 ? parseFloat(form.o3) : undefined,
        no2: form.no2 ? parseFloat(form.no2) : undefined,
        so2: form.so2 ? parseFloat(form.so2) : undefined,
        co: form.co ? parseFloat(form.co) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axErr = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        axErr.response?.data?.error?.message || "Failed to create reading"
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
      aria-label="Add AQI Reading"
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-gray-950 border border-brand/10 p-6 shadow-[0_0_30px_rgba(0,255,65,0.05)] corner-borders max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-400"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex items-center gap-2 text-xs font-mono text-brand tracking-wider mb-4">
          <Wind className="h-3.5 w-3.5" />
          {">"} ADD_AQI_READING
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lat" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                LATITUDE
              </label>
              <input
                id="lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => update("lat", e.target.value)}
                required
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="lng" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                LONGITUDE
              </label>
              <input
                id="lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => update("lng", e.target.value)}
                required
                className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label htmlFor="aqi" className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
              AQI_VALUE (0-999)
            </label>
            <input
              id="aqi"
              type="number"
              min="0"
              max="999"
              value={form.aqi}
              onChange={(e) => update("aqi", e.target.value)}
              required
              className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(["pm2_5", "pm10", "o3", "no2", "so2", "co"] as const).map(
              (key) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-[9px] font-mono text-gray-600 mb-1 tracking-[0.2em]">
                    {key.toUpperCase().replace("_", ".")}
                  </label>
                  <input
                    id={key}
                    type="number"
                    step="any"
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-full bg-gray-950 border border-brand/10 px-3 py-2 text-xs font-mono text-gray-300 focus:border-brand/30 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] focus:outline-none transition-all"
                    placeholder="--"
                  />
                </div>
              )
            )}
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
              {loading ? "PROCESSING..." : "CREATE_READING"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

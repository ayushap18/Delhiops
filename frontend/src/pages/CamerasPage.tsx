import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Camera } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutContext } from "@/components/layout/AppLayout";
import type { Camera as CameraType } from "@/lib/api";
import { CameraCard } from "@/components/cameras/CameraCard";
import { CameraForm } from "@/components/cameras/CameraForm";
import { Pagination } from "@/components/shared/Pagination";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CamerasPage() {
  const { openDetailPanel } = useOutletContext<LayoutContext>();
  const { canWrite } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data, loading, pagination, refetch } = useApi<CameraType>("/cameras", {
    page,
    limit: 50,
    params: { status: statusFilter || undefined },
  });

  return (
    <div className={mounted ? "animate-fade-up" : "opacity-0"}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="h-5 w-5 text-brand drop-shadow-[0_0_6px_rgba(0,255,65,0.5)]" />
            <h1 className="text-lg font-bold text-brand font-[Orbitron] tracking-widest text-glow">
              SURVEILLANCE GRID
            </h1>
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} CAMERA_NETWORK // CCTV MONITORING SYSTEM
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-950 border border-brand/10 px-3 py-2 text-[10px] font-mono text-gray-400 tracking-wider"
            aria-label="Filter by status"
          >
            <option value="">ALL STATUS</option>
            <option value="online">ONLINE</option>
            <option value="offline">OFFLINE</option>
            <option value="maintenance">MAINTENANCE</option>
          </select>
          {canWrite && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 tracking-wider transition-colors"
            >
              <Plus className="h-3 w-3" /> ADD_CAMERA
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.length === 0 ? (
        <EmptyState
          title="NO CAMERAS FOUND"
          description="No cameras match the current filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((camera) => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      )}

      {pagination && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}
      <CameraForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
      />
    </div>
  );
}

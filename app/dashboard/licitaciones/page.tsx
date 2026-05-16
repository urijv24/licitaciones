"use client";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  activa: "bg-green-100 text-green-700",
  por_cobrar: "bg-amber-100 text-amber-700",
  finalizada: "bg-gray-100 text-gray-600",
  perdida: "bg-red-100 text-red-700",
};

export default function LicitacionesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [licitaciones, setLicitaciones] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", maxBudget: "", clientId: "", deadline: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchLicitaciones() {
    const url = filtro ? `/api/tenders?status=${filtro}` : "/api/tenders";
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLicitaciones(data.data ?? []);
  }

  async function fetchClientes() {
    const res = await fetch("/api/clients", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setClientes(data.data ?? []);
  }

  useEffect(() => { if (token) { fetchLicitaciones(); fetchClientes(); } }, [token, filtro]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, maxBudget: parseFloat(form.maxBudget), clientId: parseInt(form.clientId) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setForm({ title: "", description: "", maxBudget: "", clientId: "", deadline: "" });
      setShowForm(false);
      fetchLicitaciones();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Licitaciones</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">
          + Nueva licitación
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="font-medium text-gray-900">Nueva licitación</h3>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Título *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Cliente *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
                <option value="">Seleccionar...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Presupuesto máximo ($) *</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.maxBudget} onChange={(e) => setForm({ ...form, maxBudget: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Fecha límite</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Descripción</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {loading ? "Guardando..." : "Crear licitación"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-sm px-4 py-2 rounded-lg">Cancelar</button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {["", "activa", "por_cobrar", "finalizada", "perdida"].map((s) => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filtro === s ? "bg-green-50 border-green-400 text-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            {s === "" ? "Todas" : s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Título</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Presupuesto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {licitaciones.map((l) => (
              <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.title}</td>
                <td className="px-4 py-3 text-gray-600">{l.client?.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">${Number(l.maxBudget).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">${Number(l.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => router.push(`/dashboard/licitaciones/${l.id}`)} className="text-green-600 hover:text-green-800 text-xs font-medium">
                    Ver detalle →
                  </button>
                </td>
              </tr>
            ))}
            {licitaciones.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No hay licitaciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
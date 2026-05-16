"use client";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function ProductosPage() {
  const { token, user } = useAuth();
  const [productos, setProductos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", unitPrice: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchProductos() {
    const res = await fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setProductos(data.data ?? []);
  }

  useEffect(() => { if (token) fetchProductos(); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, unitPrice: parseFloat(form.unitPrice) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setForm({ name: "", sku: "", unitPrice: "", description: "" });
      setShowForm(false);
      fetchProductos();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
        {user?.role === "admin" && (
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">
            + Nuevo producto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="font-medium text-gray-900">Nuevo producto</h3>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Nombre *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">SKU *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Precio unitario *</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Descripción</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-sm px-4 py-2 rounded-lg">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Precio unitario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                <td className="px-4 py-3 text-gray-600">${Number(p.unitPrice).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{p.description ?? "—"}</td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No hay productos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
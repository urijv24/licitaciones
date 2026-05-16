"use client";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  activa: "bg-green-100 text-green-700",
  por_cobrar: "bg-amber-100 text-amber-700",
  finalizada: "bg-gray-100 text-gray-600",
  perdida: "bg-red-100 text-red-700",
};

const TRANSITIONS: Record<string, string[]> = {
  activa: ["por_cobrar", "perdida"],
  por_cobrar: ["finalizada"],
  finalizada: [],
  perdida: [],
};

export default function DetalleLicitacionPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [tender, setTender] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({ productId: "", quantity: "1" });
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchTender() {
    const res = await fetch(`/api/tenders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTender(data);
    setProductos(data.tenderProducts ?? []);
  }

  async function fetchProductos() {
    const res = await fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAllProducts(data.data ?? []);
  }

  useEffect(() => { if (token) { fetchTender(); fetchProductos(); } }, [token]);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tenders/${id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: parseInt(productForm.productId), quantity: parseInt(productForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setProductForm({ productId: "", quantity: "1" });
      setShowAddProduct(false);
      fetchTender();
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveProduct(productId: number) {
    if (!confirm("¿Eliminar este producto de la licitación?")) return;
    const res = await fetch(`/api/tenders/${id}/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchTender();
  }

  async function handleChangeStatus(newStatus: string) {
    const res = await fetch(`/api/tenders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchTender();
  }

  if (!tender) return <div className="text-gray-500 text-sm">Cargando...</div>;

  const porcentaje = Math.min((Number(tender.totalAmount) / Number(tender.maxBudget)) * 100, 100);
  const disponible = Number(tender.maxBudget) - Number(tender.totalAmount);
  const transiciones = TRANSITIONS[tender.status] ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/dashboard/licitaciones")} className="text-gray-500 hover:text-gray-700 text-sm">← Volver</button>
        <h2 className="text-xl font-semibold text-gray-900">{tender.title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tender.status]}`}>{tender.status}</span>
      </div>

      {/* Info general */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Cliente</p>
          <p className="font-medium text-gray-900 mt-1">{tender.client?.name}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Presupuesto máximo</p>
          <p className="font-medium text-gray-900 mt-1">${Number(tender.maxBudget).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Fecha límite</p>
          <p className="font-medium text-gray-900 mt-1">{tender.deadline ? new Date(tender.deadline).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* Barra de presupuesto */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Uso de presupuesto</span>
          <span className="font-medium">${Number(tender.totalAmount).toLocaleString()} de ${Number(tender.maxBudget).toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${porcentaje >= 90 ? "bg-red-500" : porcentaje >= 70 ? "bg-amber-500" : "bg-green-500"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{porcentaje.toFixed(1)}% utilizado · ${disponible.toLocaleString()} disponibles</p>
      </div>

      {/* Cambio de estado */}
      {transiciones.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-2">Cambiar estado a:</p>
          <div className="flex gap-2">
            {transiciones.map((s) => (
              <button key={s} onClick={() => handleChangeStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${STATUS_COLORS[s]} border-current`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Productos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 text-sm">Productos en la licitación</h3>
          {tender.status === "activa" && (
            <button onClick={() => setShowAddProduct(!showAddProduct)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">
              + Agregar producto
            </button>
          )}
        </div>

        {showAddProduct && (
          <form onSubmit={handleAddProduct} className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-600 mb-1 block">Producto *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={productForm.productId} onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {allProducts.map((p) => <option key={p.id} value={p.id}>{p.name} — ${Number(p.unitPrice).toLocaleString()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Cantidad *</label>
                <input type="number" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })} required />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg disabled:opacity-50">
                {loading ? "Agregando..." : "Agregar"}
              </button>
              <button type="button" onClick={() => { setShowAddProduct(false); setError(""); }} className="border border-gray-300 text-xs px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </form>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Producto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Precio unit.</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cantidad</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Subtotal</th>
              {tender.status === "activa" && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {productos.map((tp) => (
              <tr key={tp.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{tp.product.name}</td>
                <td className="px-4 py-3 text-gray-500">{tp.product.sku}</td>
                <td className="px-4 py-3 text-gray-600">${Number(tp.unitPrice).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{tp.quantity}</td>
                <td className="px-4 py-3 font-medium text-gray-900">${(Number(tp.unitPrice) * tp.quantity).toLocaleString()}</td>
                {tender.status === "activa" && (
                  <td className="px-4 py-3">
                    <button onClick={() => handleRemoveProduct(tp.product.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No hay productos agregados</td></tr>
            )}
            {productos.length > 0 && (
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total acumulado:</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${Number(tender.totalAmount).toLocaleString()}</td>
                {tender.status === "activa" && <td></td>}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UsuariosPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/dashboard");
  }, [user]);

  async function fetchUsuarios() {
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsuarios(data ?? []);
  }

  useEffect(() => { if (token) fetchUsuarios(); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setForm({ name: "", email: "", password: "", role: "user" });
      fetchUsuarios();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Usuarios</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 h-fit">
          <h3 className="font-medium text-gray-900">Crear usuario</h3>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Nombre *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Email *</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Contraseña *</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Rol *</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white text-sm py-2 rounded-lg disabled:opacity-50">
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}
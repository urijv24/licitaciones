"use client";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ total: 0, activas: 0, por_cobrar: 0 });

  useEffect(() => {
    if (!token) return;
    fetch("/api/tenders?limit=100", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const tenders = data.data ?? [];
        setStats({
          total: data.total,
          activas: tenders.filter((t: any) => t.status === "activa").length,
          por_cobrar: tenders.filter((t: any) => t.status === "por_cobrar").length,
        });
      });
  }, [token]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total licitaciones</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Activas</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{stats.activas}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Por cobrar</p>
          <p className="text-3xl font-semibold text-amber-600 mt-1">{stats.por_cobrar}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500">Bienvenido al sistema de gestión de licitaciones.</p>
        <p className="text-sm text-gray-500 mt-1">Usa el menú lateral para navegar.</p>
      </div>
    </div>
  );
}
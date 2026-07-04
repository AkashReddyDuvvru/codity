import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Server } from 'lucide-react';

export default function Analytics() {
  const [orgId, setOrgId] = useState<string | null>(null);

  // For simplicity, just grab the first organization the user has access to
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await api.get('/api/organizations');
        if (res.data.length > 0) {
          setOrgId(res.data[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch orgs for analytics", e);
      }
    };
    fetchOrg();
  }, []);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics', orgId],
    queryFn: async () => {
      const res = await api.get(`/api/metrics/${orgId}`);
      return res.data;
    },
    enabled: !!orgId,
    refetchInterval: 5000, // refresh stats every 5 seconds
  });

  if (!orgId) return <div className="text-[var(--color-text-secondary)]">Please create an organization to view analytics.</div>;
  if (isLoading) return <div className="text-[var(--color-text-secondary)]">Loading analytics...</div>;

  // Transform data for the chart
  const chartData = metrics?.jobStats?.map((stat: any) => ({
    name: stat.status,
    count: stat._count,
  })) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Activity className="h-8 w-8 text-[var(--color-brand-500)]" />
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">Real-time metrics and job execution throughput.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 flex flex-col justify-center items-center">
          <Server className="h-12 w-12 text-emerald-400 mb-4" />
          <p className="text-[var(--color-text-secondary)] uppercase tracking-wider text-sm font-medium">Active Workers</p>
          <h2 className="text-4xl font-bold text-white mt-2">{metrics?.activeWorkers || 0}</h2>
        </div>

        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6">
          <h3 className="text-lg font-medium text-white mb-6">Job Status Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} 
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  _count: { projects: number };
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [newOrgName, setNewOrgName] = useState('');

  const { data: orgs, isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await api.get('/api/organizations');
      return res.data;
    }
  });

  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/api/organizations', { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setNewOrgName('');
    }
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrgName.trim()) {
      createOrgMutation.mutate(newOrgName);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Organizations</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">Select an organization to view its projects and queues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create New Org Card */}
        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 flex flex-col justify-center border-dashed hover:border-[var(--color-brand-500)] transition duration-200">
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-[var(--color-brand-500)]" />
              New Organization
            </h3>
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-4 py-2 bg-[var(--color-bg-elevated)] rounded-xl border-transparent focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-opacity-50 text-white transition duration-200"
              required
            />
            <button
              type="submit"
              disabled={createOrgMutation.isPending}
              className="w-full py-2 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded-xl text-white font-medium transition duration-200 disabled:opacity-50"
            >
              {createOrgMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* List Orgs */}
        {isLoading ? (
          <div className="col-span-2 text-[var(--color-text-secondary)]">Loading organizations...</div>
        ) : (
          orgs?.map((org) => (
            <Link
              to={`/projects?orgId=${org.id}`}
              key={org.id}
              className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 hover:border-[var(--color-brand-500)] hover:shadow-lg hover:shadow-blue-900/10 transition duration-200 group cursor-pointer flex flex-col"
            >
              <div className="flex-1">
                <div className="w-10 h-10 bg-[var(--color-brand-600)]/20 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="h-5 w-5 text-[var(--color-brand-500)]" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[var(--color-brand-500)] transition">
                  {org.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {org._count.projects} {org._count.projects === 1 ? 'Project' : 'Projects'}
                </p>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-[var(--color-brand-500)] opacity-0 group-hover:opacity-100 transition-opacity">
                View Projects <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Briefcase, Plus, ArrowRight, Layers } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  _count: { queues: number };
}

export default function Projects() {
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('orgId');
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState('');

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects', orgId],
    queryFn: async () => {
      const res = await api.get(`/api/projects/${orgId}`);
      return res.data;
    },
    enabled: !!orgId,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post(`/api/projects/${orgId}`, { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
      setNewProjectName('');
    }
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim() && orgId) {
      createProjectMutation.mutate(newProjectName);
    }
  };

  if (!orgId) {
    return <div className="text-[var(--color-text-secondary)]">Please select an organization from the dashboard first.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-[var(--color-brand-500)]" />
          Projects
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">Manage projects and their associated job queues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create New Project Card */}
        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 flex flex-col justify-center border-dashed hover:border-[var(--color-brand-500)] transition duration-200">
          <form onSubmit={handleCreateProject} className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-[var(--color-brand-500)]" />
              New Project
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Email Service"
              className="w-full px-4 py-2 bg-[var(--color-bg-elevated)] rounded-xl border-transparent focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-opacity-50 text-white transition duration-200"
              required
            />
            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="w-full py-2 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded-xl text-white font-medium transition duration-200 disabled:opacity-50"
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* List Projects */}
        {isLoading ? (
          <div className="col-span-2 text-[var(--color-text-secondary)]">Loading projects...</div>
        ) : (
          projects?.map((project) => (
            <Link
              to={`/queues?projectId=${project.id}`}
              key={project.id}
              className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 hover:border-[var(--color-brand-500)] hover:shadow-lg hover:shadow-blue-900/10 transition duration-200 group cursor-pointer flex flex-col"
            >
              <div className="flex-1">
                <div className="w-10 h-10 bg-[var(--color-brand-600)]/20 rounded-xl flex items-center justify-center mb-4">
                  <Layers className="h-5 w-5 text-[var(--color-brand-500)]" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[var(--color-brand-500)] transition">
                  {project.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {project._count.queues} {project._count.queues === 1 ? 'Queue' : 'Queues'}
                </p>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-[var(--color-brand-500)] opacity-0 group-hover:opacity-100 transition-opacity">
                View Queues <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

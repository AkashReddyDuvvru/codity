import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Layers, Plus, ArrowRight, Play, Pause } from 'lucide-react';

interface Queue {
  id: string;
  name: string;
  priority: number;
  concurrencyLimit: number;
  isPaused: boolean;
  _count: { jobs: number };
}

export default function Queues() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const queryClient = useQueryClient();
  const [newQueueName, setNewQueueName] = useState('');

  const { data: queues, isLoading } = useQuery<Queue[]>({
    queryKey: ['queues', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/queues/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const createQueueMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post(`/api/queues/${projectId}`, { name, priority: 0, concurrencyLimit: 10 });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues', projectId] });
      setNewQueueName('');
    }
  });

  const togglePauseMutation = useMutation({
    mutationFn: async ({ id, isPaused }: { id: string; isPaused: boolean }) => {
      const action = isPaused ? 'resume' : 'pause';
      const res = await api.put(`/api/queues/${id}/${action}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues', projectId] });
    }
  });

  const handleCreateQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQueueName.trim() && projectId) {
      createQueueMutation.mutate(newQueueName);
    }
  };

  if (!projectId) {
    return <div className="text-[var(--color-text-secondary)]">Please select a project first.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Layers className="h-8 w-8 text-[var(--color-brand-500)]" />
          Queues
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">Manage your job queues and concurrency settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create New Queue Card */}
        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 flex flex-col justify-center border-dashed hover:border-[var(--color-brand-500)] transition duration-200">
          <form onSubmit={handleCreateQueue} className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-[var(--color-brand-500)]" />
              New Queue
            </h3>
            <input
              type="text"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              placeholder="e.g. High Priority Emails"
              className="w-full px-4 py-2 bg-[var(--color-bg-elevated)] rounded-xl border-transparent focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-opacity-50 text-white transition duration-200"
              required
            />
            <button
              type="submit"
              disabled={createQueueMutation.isPending}
              className="w-full py-2 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded-xl text-white font-medium transition duration-200 disabled:opacity-50"
            >
              {createQueueMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* List Queues */}
        {isLoading ? (
          <div className="col-span-2 text-[var(--color-text-secondary)]">Loading queues...</div>
        ) : (
          queues?.map((queue) => (
            <div
              key={queue.id}
              className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6 hover:border-[var(--color-brand-500)] hover:shadow-lg hover:shadow-blue-900/10 transition duration-200 group flex flex-col relative"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-[var(--color-brand-600)]/20 rounded-xl flex items-center justify-center">
                    <Layers className="h-5 w-5 text-[var(--color-brand-500)]" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      togglePauseMutation.mutate({ id: queue.id, isPaused: queue.isPaused });
                    }}
                    className={`p-2 rounded-lg transition ${
                      queue.isPaused 
                        ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
                        : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                    }`}
                    title={queue.isPaused ? "Resume Queue" : "Pause Queue"}
                  >
                    {queue.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-white transition flex items-center gap-2">
                  {queue.name}
                  {queue.isPaused && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">Paused</span>}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-bg-elevated)] p-3 rounded-xl">
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Jobs</p>
                    <p className="text-lg font-semibold text-white">{queue._count.jobs}</p>
                  </div>
                  <div className="bg-[var(--color-bg-elevated)] p-3 rounded-xl">
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Concurrency</p>
                    <p className="text-lg font-semibold text-white">{queue.concurrencyLimit}</p>
                  </div>
                </div>
              </div>
              <Link to={`/jobs?queueId=${queue.id}`} className="mt-4 flex items-center text-sm font-medium text-[var(--color-brand-500)] hover:text-white transition">
                View Jobs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Activity, Clock, PlayCircle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Job {
  id: string;
  status: string;
  priority: number;
  payload: any;
  runAt: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  QUEUED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SCHEDULED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CLAIMED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  RUNNING: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  RETRY: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DEAD_LETTER: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const statusIcons: Record<string, React.ReactNode> = {
  QUEUED: <Clock className="w-3 h-3 mr-1" />,
  SCHEDULED: <Clock className="w-3 h-3 mr-1" />,
  RUNNING: <PlayCircle className="w-3 h-3 mr-1 animate-pulse" />,
  COMPLETED: <CheckCircle2 className="w-3 h-3 mr-1" />,
  FAILED: <XCircle className="w-3 h-3 mr-1" />,
  DEAD_LETTER: <AlertCircle className="w-3 h-3 mr-1" />,
};

export default function Jobs() {
  const [searchParams] = useSearchParams();
  const queueId = searchParams.get('queueId');
  const queryClient = useQueryClient();
  const [showSubmitJob, setShowSubmitJob] = useState(false);
  const [payloadStr, setPayloadStr] = useState('{\n  "task": "send_email",\n  "to": "user@example.com"\n}');
  const [delayMs, setDelayMs] = useState(0);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['jobs', queueId],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${queueId}`);
      return res.data;
    },
    enabled: !!queueId,
  });

  React.useEffect(() => {
    if (!queueId) return;

    import('../services/socket').then(({ socket }) => {
      socket.connect();
      socket.emit('join_queue', queueId);

      socket.on('job:updated', (updatedJob: Job) => {
        queryClient.setQueryData(['jobs', queueId], (oldData: Job[] | undefined) => {
          if (!oldData) return [updatedJob];
          
          const exists = oldData.find(j => j.id === updatedJob.id);
          if (exists) {
            return oldData.map(j => j.id === updatedJob.id ? updatedJob : j);
          } else {
            // New job or changing queues, sort appropriately
            const newData = [updatedJob, ...oldData];
            return newData.sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime());
          }
        });
      });

      return () => {
        socket.emit('leave_queue', queueId);
        socket.off('job:updated');
        socket.disconnect();
      };
    });
  }, [queueId, queryClient]);

  const submitJobMutation = useMutation({
    mutationFn: async () => {
      const payload = JSON.parse(payloadStr);
      const res = await api.post(`/api/jobs/${queueId}`, {
        payload,
        priority: 0,
        delayMs: delayMs > 0 ? delayMs : undefined
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', queueId] });
      setShowSubmitJob(false);
    }
  });

  if (!queueId) {
    return <div className="text-[var(--color-text-secondary)]">Please select a queue first.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-[var(--color-brand-500)]" />
            Jobs
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">Monitor real-time job executions and history.</p>
        </div>
        <button
          onClick={() => setShowSubmitJob(!showSubmitJob)}
          className="px-4 py-2 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded-xl text-white font-medium transition duration-200"
        >
          {showSubmitJob ? 'Cancel' : 'Submit Mock Job'}
        </button>
      </div>

      {showSubmitJob && (
        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] p-6">
          <h3 className="text-lg font-medium text-white mb-4">Submit a New Job</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">Payload (JSON)</label>
              <textarea
                className="w-full h-32 px-4 py-3 bg-[var(--color-bg-base)] text-sm font-mono text-white rounded-xl border border-[var(--color-bg-elevated)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none"
                value={payloadStr}
                onChange={(e) => setPayloadStr(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">Delay (ms)</label>
              <input
                type="number"
                className="w-full px-4 py-2 bg-[var(--color-bg-base)] text-white rounded-xl border border-[var(--color-bg-elevated)] focus:border-[var(--color-brand-500)] outline-none"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
              />
            </div>
            <button
              onClick={() => submitJobMutation.mutate()}
              disabled={submitJobMutation.isPending}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition disabled:opacity-50"
            >
              Submit to Queue
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-bg-elevated)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] text-sm uppercase tracking-wider border-b border-[var(--color-bg-elevated)]">
                <th className="px-6 py-4 font-medium">Job ID</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Payload</th>
                <th className="px-6 py-4 font-medium">Run At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-elevated)]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-secondary)]">
                    Loading jobs...
                  </td>
                </tr>
              ) : jobs?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-secondary)]">
                    No jobs found in this queue.
                  </td>
                </tr>
              ) : (
                jobs?.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--color-bg-base)]/50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[job.status] || statusColors.QUEUED}`}>
                        {statusIcons[job.status] || null}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-sm text-gray-300 font-mono bg-black/20 px-2 py-1 rounded">
                        {JSON.stringify(job.payload)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(job.runAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

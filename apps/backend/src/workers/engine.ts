import prisma from '../utils/db';
import { JobClaimer } from './claimer';
import { JobExecutor } from './executor';

export class WorkerEngine {
  private isRunning = false;
  private pollIntervalMs = 1000;
  private workerId = 'system-worker-1'; // In a real app, this would be a UUID generated per instance

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Register worker in DB
    let worker = await prisma.worker.findFirst({ where: { name: this.workerId } });
    if (!worker) {
      worker = await prisma.worker.create({
        data: { name: this.workerId, status: 'ACTIVE' }
      });
    }

    console.log(`[WorkerEngine] Started polling...`);
    this.poll();
  }

  stop() {
    this.isRunning = false;
    console.log(`[WorkerEngine] Stopped polling.`);
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      // 1. Get all active, unpaused queues
      const activeQueues = await prisma.queue.findMany({
        where: { isPaused: false },
        select: { id: true, concurrencyLimit: true }
      });

      // 2. For each queue, check how many jobs are currently running
      for (const queue of activeQueues) {
        const runningJobsCount = await prisma.job.count({
          where: { queueId: queue.id, status: 'RUNNING' }
        });

        // 3. If we have capacity, try to claim a job
        if (runningJobsCount < queue.concurrencyLimit) {
          const claimedJob = await JobClaimer.claimNextJob(queue.id, workerId);
          if (claimedJob) {
            // Do NOT await execution here, we want it to run concurrently
            JobExecutor.execute(claimedJob);
          }
        }
      }

      // Heartbeat
      await prisma.workerHeartbeat.create({
        data: { workerId: workerId }
      });

    } catch (error) {
      console.error('[WorkerEngine] Polling error:', error);
    }

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollIntervalMs);
  }
}

// Ensure workerId is globally accessible for this instance
const workerId = 'worker-' + Math.random().toString(36).substring(7);

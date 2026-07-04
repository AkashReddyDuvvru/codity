import prisma from '../utils/db';
import { Job, JobStatus } from '@prisma/client';
import { JobRetrier } from './retrier';
import { getSocket } from '../utils/socket';

export class JobExecutor {
  static async execute(job: Job): Promise<void> {
    try {
      // Mark as running
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.RUNNING, updatedAt: new Date() }
      });
      
      // Emit socket event
      getSocket().to(`queue_${job.queueId}`).emit('job:updated', updatedJob);

      // Update execution history
      const latestExecution = await prisma.jobExecution.findFirst({
        where: { jobId: job.id },
        orderBy: { startedAt: 'desc' }
      });

      if (latestExecution) {
        await prisma.jobExecution.update({
          where: { id: latestExecution.id },
          data: { status: JobStatus.RUNNING }
        });
      }

      // ----------------------------------------------------
      // MOCK JOB EXECUTION
      // ----------------------------------------------------
      console.log(`[Worker] Executing Job ${job.id}...`);
      
      // Simulate arbitrary work based on payload or just wait
      const payload: any = job.payload;
      const workTime = payload?.workTime || 2000; 
      
      await new Promise((resolve) => setTimeout(resolve, workTime));

      // Simulate random failure (10% chance) for testing
      if (Math.random() < 0.1) {
        throw new Error("Random simulated execution failure");
      }
      
      // ----------------------------------------------------
      
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - (job.startedAt?.getTime() || finishedAt.getTime());

      // Mark as completed
      const finalJob = await prisma.job.update({
        where: { id: job.id },
        data: { 
          status: JobStatus.COMPLETED, 
          finishedAt,
          duration,
          updatedAt: new Date() 
        }
      });
      
      // Emit socket event
      getSocket().to(`queue_${job.queueId}`).emit('job:updated', finalJob);

      if (latestExecution) {
        await prisma.jobExecution.update({
          where: { id: latestExecution.id },
          data: { status: JobStatus.COMPLETED, finishedAt }
        });
      }

      console.log(`[Worker] Completed Job ${job.id} in ${duration}ms`);

    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error.message);
      await JobRetrier.handleFailure(job, error.message || 'Unknown error');
    }
  }
}

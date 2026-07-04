import prisma from '../utils/db';
import { Job, JobStatus } from '@prisma/client';

export class JobClaimer {
  static async claimNextJob(queueId: string, workerId: string): Promise<Job | null> {
    try {
      // Use PostgreSQL row-level locking to atomically claim a job
      // SKIP LOCKED ensures multiple workers don't block each other, they just skip rows already being evaluated
      const claimedJobs = await prisma.$queryRaw<Job[]>`
        UPDATE "Job"
        SET status = ${JobStatus.CLAIMED}::"JobStatus",
            "startedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = (
          SELECT id FROM "Job"
          WHERE status IN (${JobStatus.QUEUED}::"JobStatus", ${JobStatus.SCHEDULED}::"JobStatus")
            AND "runAt" <= NOW()
            AND "queueId" = ${queueId}
          ORDER BY priority DESC, "runAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING *;
      `;

      if (claimedJobs && claimedJobs.length > 0) {
        const job = claimedJobs[0];
        
        // Log the execution attempt
        await prisma.jobExecution.create({
          data: {
            jobId: job.id,
            workerId: workerId,
            status: JobStatus.CLAIMED,
          }
        });

        return job;
      }
      return null;
    } catch (error) {
      console.error(`Error claiming job for queue ${queueId}:`, error);
      return null;
    }
  }
}

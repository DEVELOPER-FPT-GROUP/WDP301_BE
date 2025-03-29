import { Worker } from 'worker_threads';

/**
 * Interface defining a worker task in the worker pool.
 * Manages the state and lifecycle of a worker thread.
 */
export interface WorkerTask {
  /**
   * Unique identifier for the worker task.
   */
  id: string;

  /**
   * The Node.js Worker instance that executes code in a separate thread.
   */
  worker: Worker;

  /**
   * Indicates whether the worker is currently processing a task.
   * Used for worker allocation and pool management.
   */
  busy: boolean;

  /**
   * Timestamp when the worker was last used.
   * Used for idle worker cleanup to prevent memory leaks.
   */
  lastUsed?: Date;

  /**
   * Type of worker indicating its primary function.
   * Helps with specialized worker allocation.
   */
  workerType?: 'face-detection' | 'embedding-generation' | 'general';

  /**
   * Number of tasks completed by this worker.
   * Used for monitoring and worker health assessment.
   */
  tasksCompleted?: number;

  /**
   * Number of errors encountered by this worker.
   * Used for monitoring and worker health assessment.
   */
  errorCount?: number;

  /**
   * Total processing time in milliseconds.
   * Used for performance monitoring.
   */
  totalProcessingTime?: number;

  /**
   * Timestamp when the worker was created.
   * Used for worker lifecycle management.
   */
  createdAt: Date;
}
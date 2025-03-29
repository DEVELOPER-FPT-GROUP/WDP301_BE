/**
 * Interface defining an item in the background processing queue.
 * Each item includes the task to execute, its priority, and creation timestamp.
 */
export interface QueueItem {
    /**
     * The task to be executed asynchronously in the background.
     * Implemented as a function that returns a Promise.
     */
    task: () => Promise<void>;
  
    /**
     * Priority level of the task. Lower numbers indicate higher priority.
     * - 0-4: Critical tasks (immediate execution)
     * - 5-9: High priority tasks
     * - 10-19: Normal priority tasks
     * - 20+: Low priority tasks
     */
    priority: number;
  
    /**
     * Timestamp when the item was added to the queue.
     * Used for FIFO processing when priorities are equal.
     */
    createdAt: Date;
  
    /**
     * Optional unique identifier for the task.
     * Can be used to find and cancel specific tasks.
     */
    id?: string;
  
    /**
     * Optional metadata associated with the task.
     * Can be used for logging or monitoring purposes.
     */
    metadata?: {
      description?: string;
      ownerId?: string;
      operationType?: string;
      [key: string]: any;
    };
  }
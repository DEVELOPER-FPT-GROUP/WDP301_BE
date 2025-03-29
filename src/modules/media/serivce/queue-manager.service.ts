import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { QueueItem } from '../interfaces/queue-item.interface';

/**
 * Service for managing background task queues.
 * Handles prioritization, scheduling, and execution of asynchronous tasks.
 */
@Injectable()
export class QueueManagerService implements OnModuleDestroy {
  private backgroundQueue: QueueItem[] = [];
  private isProcessingQueue = false;
  private maxConcurrentTasks = 3;
  private processingTasks: Map<string, Promise<void>> = new Map();
  private queueInterval: NodeJS.Timeout;
  private taskIdCounter = 0;

  constructor() {
    // Start the queue processor
    this.startQueueProcessor();
    logger.info('Queue manager initialized');
  }

  /**
   * Clean up resources when module is destroyed
   */
  async onModuleDestroy() {
    logger.info('Cleaning up queue manager resources');
    clearInterval(this.queueInterval);
    
    // Wait for any in-progress tasks to complete
    if (this.processingTasks.size > 0) {
      logger.info(`Waiting for ${this.processingTasks.size} in-progress tasks to complete`);
      try {
        await Promise.all(this.processingTasks.values());
      } catch (error) {
        logger.error(`Error while waiting for tasks to complete: ${error.message}`);
      }
    }
  }

  /**
   * Add a task to the background processing queue
   * 
   * @param task Function to execute asynchronously
   * @param priority Priority level (lower = higher priority)
   * @param metadata Optional metadata for the task
   * @returns ID of the queued task
   */
  addToBackgroundQueue(
    task: () => Promise<void>, 
    priority: number = 10,
    metadata?: { [key: string]: any }
  ): string {
    // Generate a unique task ID
    const taskId = `task-${Date.now()}-${++this.taskIdCounter}`;
    
    // Create queue item
    const queueItem: QueueItem = {
      task,
      priority,
      createdAt: new Date(),
      id: taskId,
      metadata
    };
    
    // Add to queue
    this.backgroundQueue.push(queueItem);
    
    // Log queue state
    logger.debug(
      `Added task ${taskId} to queue with priority ${priority}. ` +
      `Queue size: ${this.backgroundQueue.length}, ` + 
      `Active tasks: ${this.processingTasks.size}`
    );
    
    // Sort queue by priority and then by creation time
    this.sortQueue();
    
    // Ensure the queue processor is running
    if (!this.isProcessingQueue) {
      this.processNextQueueItem();
    }
    
    return taskId;
  }

  /**
   * Sort the queue by priority and creation time
   * 
   * @private
   */
  private sortQueue(): void {
    this.backgroundQueue.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // When priorities are equal, sort by creation time (FIFO)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Process the next item in the queue
   * 
   * @private
   */
  private async processNextQueueItem(): Promise<void> {
    // If queue is empty, stop processing
    if (this.backgroundQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    // Check if we're already at max concurrent tasks
    if (this.processingTasks.size >= this.maxConcurrentTasks) {
      this.isProcessingQueue = true;
      
      // Schedule to check again soon
      setTimeout(() => this.processNextQueueItem(), 500);
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Get the highest priority item from the queue
    const item = this.backgroundQueue.shift();
    if (!item) {
      this.isProcessingQueue = false;
      return;
    }
    
    try {
      // Create a task promise
      const taskPromise = (async () => {
        try {
          const startTime = Date.now();
          
          // Log task start
          logger.debug(`Starting task ${item.id}${item.metadata?.description ? `: ${item.metadata.description}` : ''}`);
          
          // Execute the task
          await item.task();
          
          // Log task completion
          const duration = Date.now() - startTime;
          logger.debug(`Completed task ${item.id} in ${duration}ms`);
        } catch (error) {
          logger.error(`Error in task ${item.id}: ${error.message}`);
        } finally {
          // Remove from processing map
          this.processingTasks.delete(item.id as string);
        }
      })();
      
      // Add to processing map
      this.processingTasks.set(item.id as string, taskPromise);
      
      // Process next item immediately without waiting for this one to complete
      setImmediate(() => this.processNextQueueItem());
    } catch (error) {
      logger.error(`Error scheduling task ${item.id}: ${error.message}`);
      
      // Process next item
      setImmediate(() => this.processNextQueueItem());
    }
  }

  /**
   * Start the background queue processor
   * 
   * @private
   */
  private startQueueProcessor(): void {
    // Check for queue items periodically
    this.queueInterval = setInterval(() => {
      if (!this.isProcessingQueue && this.backgroundQueue.length > 0) {
        this.processNextQueueItem();
      }
    }, 1000);
  }

  /**
   * Get the number of tasks in the queue
   * 
   * @returns Number of queued tasks
   */
  getQueueLength(): number {
    return this.backgroundQueue.length;
  }

  /**
 * Get the maximum number of concurrent tasks allowed
 * 
 * @returns number of max concurrent tasks
 */
getMaxConcurrentTasks(): number {
  return this.maxConcurrentTasks;
}

  /**
   * Get the number of tasks currently being processed
   * 
   * @returns Number of active tasks
   */
  getActiveTaskCount(): number {
    return this.processingTasks.size;
  }

  /**
   * Get statistics about the queue
   * 
   * @returns Queue statistics
   */
  getQueueStats(): any {
    // Count tasks by priority
    const tasksByPriority = this.backgroundQueue.reduce((acc, item) => {
      const priority = item.priority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    // Count tasks by type if metadata includes type
    const tasksByType = this.backgroundQueue.reduce((acc, item) => {
      if (item.metadata?.operationType) {
        const type = item.metadata.operationType;
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});
    
    return {
      queuedTasks: this.backgroundQueue.length,
      activeTasks: this.processingTasks.size,
      tasksByPriority,
      tasksByType,
      oldestTask: this.backgroundQueue.length > 0 
        ? this.backgroundQueue[0].createdAt 
        : null,
      maxConcurrentTasks: this.maxConcurrentTasks
    };
  }

  /**
   * Change the maximum number of concurrent tasks
   * 
   * @param maxTasks New maximum concurrent task count
   */
  setMaxConcurrentTasks(maxTasks: number): void {
    if (maxTasks < 1) {
      throw new Error('Maximum concurrent tasks must be at least 1');
    }
    
    this.maxConcurrentTasks = maxTasks;
    logger.info(`Set maximum concurrent tasks to ${maxTasks}`);
    
    // Trigger queue processing in case we can now process more tasks
    if (!this.isProcessingQueue && this.backgroundQueue.length > 0) {
      this.processNextQueueItem();
    }
  }

  /**
   * Cancel a task by ID
   * 
   * @param taskId ID of the task to cancel
   * @returns True if task was found and canceled
   */
  cancelTask(taskId: string): boolean {
    // Try to remove from queue first
    const initialLength = this.backgroundQueue.length;
    this.backgroundQueue = this.backgroundQueue.filter(item => item.id !== taskId);
    
    // If queue length changed, task was removed
    if (initialLength !== this.backgroundQueue.length) {
      logger.info(`Canceled queued task ${taskId}`);
      return true;
    }
    
    // If task is already executing, we can't cancel it
    if (this.processingTasks.has(taskId)) {
      logger.warn(`Cannot cancel task ${taskId} as it is already executing`);
      return false;
    }
    
    // Task not found
    return false;
  }

  /**
   * Clear all queued tasks
   * 
   * @returns Number of tasks cleared
   */
  clearQueue(): number {
    const taskCount = this.backgroundQueue.length;
    this.backgroundQueue = [];
    logger.info(`Cleared ${taskCount} tasks from queue`);
    return taskCount;
  }
}
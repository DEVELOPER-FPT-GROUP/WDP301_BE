import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';
import * as os from 'os';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { WorkerTask } from '../interfaces/worker-task.interface';

/**
 * Service for managing a pool of worker threads.
 * Handles creation, assignment, cleanup, and communication with worker threads.
 */
@Injectable()
export class WorkerPoolService implements OnModuleDestroy {
  private workerPool: WorkerTask[] = [];
  private maxWorkers = Math.max(2, Math.floor(os.cpus().length / 2));
  private workerIdleTimeout = 60000; // 60 seconds
  private cleanupInterval: NodeJS.Timeout;
  private workerScriptsDir: string;

  constructor() {
    // Determine the worker scripts directory
    this.workerScriptsDir = path.resolve(process.cwd(), 'dist/modules/media/workers');
    
    // Initialize the worker pool
    this.initWorkerPool();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupIdleWorkers(), 30000);
    
    logger.info(`Worker pool initialized with max ${this.maxWorkers} workers`);
    logger.info(`Worker scripts directory: ${this.workerScriptsDir}`);
  }

  /**
   * Clean up resources when the module is destroyed
   */
  async onModuleDestroy() {
    logger.info('Cleaning up worker pool resources');
    clearInterval(this.cleanupInterval);
    await this.cleanupWorkerPool();
  }

  /**
   * Initialize the worker pool
   * Pre-warms a few workers to reduce startup time for first requests
   * 
   * @private
   */
  private initWorkerPool(): void {
    // Clear existing workers
    this.cleanupWorkerPool();
    
    // Pre-create a few workers to reduce startup time for first requests
    const preWarmCount = Math.min(2, this.maxWorkers);
    logger.info(`Pre-warming ${preWarmCount} workers in the pool`);
    
    try {
      for (let i = 0; i < preWarmCount; i++) {
        // Create workers with different scripts for different purposes
        if (i % 2 === 0) {
          this.createWorker(path.join(this.workerScriptsDir, 'face-detection.worker.js'), 'face-detection');
        } else {
          this.createWorker(path.join(this.workerScriptsDir, 'embedding.worker.js'), 'embedding-generation');
        }
      }
    } catch (error) {
      logger.error(`Error during worker pool initialization: ${error.message}`);
    }
  }

 /**
 * Create a new worker thread
 * 
 * @param scriptPath Path to the worker script
 * @param workerType Type of worker (for identification)
 * @returns The created worker task
 */
createWorker(
    scriptPath: string, 
    workerType: 'face-detection' | 'embedding-generation' | 'general' = 'general'
  ): WorkerTask {
    const workerId = `${workerType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
    try {
      logger.debug(`Creating worker ${workerId} for script: ${scriptPath}`);
      
      const resolvedScriptPath = path.isAbsolute(scriptPath) 
        ? scriptPath 
        : path.resolve(process.cwd(), scriptPath);
      
        const worker = new Worker(resolvedScriptPath, { workerData: undefined });

  
      worker.on('exit', (code) => {
        if (code !== 0) {
          logger.warn(`Worker ${workerId} exited with code ${code}`);
        }
        this.workerPool = this.workerPool.filter(w => w.id !== workerId);
      });
  
      worker.on('error', (err) => {
        logger.error(`Worker ${workerId} error: ${err.message}`);
        this.workerPool = this.workerPool.filter(w => w.id !== workerId);
      });
  
      const workerTask: WorkerTask = {
        id: workerId,
        worker,
        busy: false,
        workerType, // This now strictly follows the defined type
        createdAt: new Date(),
        tasksCompleted: 0,
        errorCount: 0,
        totalProcessingTime: 0
      };
  
      this.workerPool.push(workerTask);
      logger.debug(`Worker ${workerId} created successfully, pool size: ${this.workerPool.length}`);
      
      return workerTask;
    } catch (error) {
      logger.error(`Failed to create worker: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get an available worker or create one if needed
   * 
   * @param scriptPath Path to the worker script
   * @param workerType Type of worker to retrieve
   * @returns An available worker task
   */
  getAvailableWorker(
    scriptPath: string, 
    workerType: 'face-detection' | 'embedding-generation' | 'general' = 'general'
  ): WorkerTask {
    const idleWorker = this.workerPool.find(w => 
      !w.busy && (w.workerType === workerType || workerType === 'general')
    );
  
    if (idleWorker) {
      idleWorker.busy = true;
      logger.debug(`Using existing worker ${idleWorker.id}`);
      return idleWorker;
    }
  
    if (this.workerPool.length < this.maxWorkers) {
      const newWorker = this.createWorker(scriptPath, workerType);
      newWorker.busy = true;
      logger.debug(`Created new worker ${newWorker.id} for task`);
      return newWorker;
    }
  
    this.workerPool.sort((a, b) => (a.tasksCompleted || 0) - (b.tasksCompleted || 0));
    const worker = this.workerPool[0];
    worker.busy = true;
  
    logger.debug(`All workers busy, reusing worker ${worker.id} (completed ${worker.tasksCompleted} tasks)`);
    return worker;
  }
  
  /**
   * Release a worker back to the pool
   * 
   * @param workerId ID of the worker to release
   */
  releaseWorker(workerId: string): void {
    const worker = this.workerPool.find(w => w.id === workerId);
    if (worker) {
      worker.busy = false;
      worker.lastUsed = new Date();
      logger.debug(`Released worker ${workerId} back to pool`);
    }
  }

  /**
   * Run a task with a worker thread
   * 
   * @param scriptPath Path to the worker script
   * @param data Data to send to the worker
   * @param workerType Type of worker to use
   * @param timeout Maximum time to wait for completion (ms)
   * @returns Result from the worker
   */
  async runTaskWithWorker<T>(
    scriptPath: string, 
    data: any, 
    workerType: 'face-detection' | 'embedding-generation' | 'general' = 'general',
    timeout: number = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        // Get an available worker
        const workerTask = this.getAvailableWorker(scriptPath, workerType);
        const worker = workerTask.worker;
        const taskStartTime = Date.now();
        
        // Set up a timeout to prevent hanging workers
        const timeoutId = setTimeout(() => {
          logger.warn(`Worker ${workerTask.id} timed out after ${timeout}ms`);
          
          // Record error and release worker
          if (workerTask.errorCount !== undefined) workerTask.errorCount++;
          this.releaseWorker(workerTask.id);
          
          reject(new Error(`Worker operation timed out after ${timeout}ms`));
        }, timeout);
        
        // Set up message handler
        const messageHandler = (result) => {
          clearTimeout(timeoutId);
          
          // Record performance metrics
          const taskDuration = Date.now() - taskStartTime;
          if (workerTask.tasksCompleted !== undefined) workerTask.tasksCompleted++;
          if (workerTask.totalProcessingTime !== undefined) {
            workerTask.totalProcessingTime += taskDuration;
          }
          
          // Release the worker
          this.releaseWorker(workerTask.id);
          
          // Check for error in result
          if (result.error) {
            if (workerTask.errorCount !== undefined) workerTask.errorCount++;
            reject(new Error(result.error));
            return;
          }
          
          // Process successful result
          resolve(result as T);
          
          // Clean up event listeners
          worker.removeListener('message', messageHandler);
          worker.removeListener('error', errorHandler);
          worker.removeListener('exit', exitHandler);
          
          logger.debug(`Worker ${workerTask.id} completed task in ${taskDuration}ms`);
        };
        
        // Set up error handler
        const errorHandler = (error) => {
          clearTimeout(timeoutId);
          
          // Record error and release worker
          if (workerTask.errorCount !== undefined) workerTask.errorCount++;
          this.releaseWorker(workerTask.id);
          
          reject(error);
          
          // Clean up event listeners
          worker.removeListener('message', messageHandler);
          worker.removeListener('error', errorHandler);
          worker.removeListener('exit', exitHandler);
          
          logger.error(`Worker ${workerTask.id} encountered error: ${error.message}`);
        };
        
        // Set up exit handler
        const exitHandler = (code) => {
          clearTimeout(timeoutId);
          this.releaseWorker(workerTask.id);
          
          if (code !== 0) {
            if (workerTask.errorCount !== undefined) workerTask.errorCount++;
            reject(new Error(`Worker exited with code ${code}`));
          }
          
          // Clean up event listeners
          worker.removeListener('message', messageHandler);
          worker.removeListener('error', errorHandler);
          worker.removeListener('exit', exitHandler);
          
          logger.warn(`Worker ${workerTask.id} exited with code ${code}`);
        };
        
        // Register event handlers
        worker.once('message', messageHandler);
        worker.once('error', errorHandler);
        worker.once('exit', exitHandler);
        
        // Send the data to the worker
        logger.debug(`Sending task to worker ${workerTask.id}`);
        worker.postMessage(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clean up idle workers to free resources
   * 
   * @private
   */
  private cleanupIdleWorkers(): void {
    const now = new Date().getTime();
    
    // Keep at least 2 workers in the pool regardless of idle time
    if (this.workerPool.length <= 2) return;
    
    // Find idle workers that exceed the timeout
    const workersToRemove = this.workerPool.filter(worker => 
      !worker.busy && 
      worker.lastUsed && 
      (now - worker.lastUsed.getTime() > this.workerIdleTimeout)
    );
    
    if (workersToRemove.length === 0) return;
    
    logger.info(`Cleaning up ${workersToRemove.length} idle workers`);
    
    // Terminate each idle worker
    for (const worker of workersToRemove) {
      try {
        worker.worker.terminate();
        logger.debug(`Terminated idle worker ${worker.id}`);
      } catch (error) {
        logger.error(`Error terminating worker ${worker.id}: ${error.message}`);
      }
    }
    
    // Remove terminated workers from pool
    this.workerPool = this.workerPool.filter(worker => 
      !workersToRemove.some(w => w.id === worker.id)
    );
    
    logger.info(`Worker pool size after cleanup: ${this.workerPool.length}`);
  }

  /**
   * Clean up all workers in the pool
   * 
   * @private
   */
  private async cleanupWorkerPool(): Promise<void> {
    logger.info(`Cleaning up all ${this.workerPool.length} workers in the pool`);
    
    const terminationPromises = this.workerPool.map(async (workerTask) => {
      try {
        await workerTask.worker.terminate();
        logger.debug(`Terminated worker ${workerTask.id}`);
      } catch (error) {
        logger.error(`Error terminating worker ${workerTask.id}: ${error.message}`);
      }
    });
    
    // Wait for all workers to terminate
    await Promise.all(terminationPromises);
    
    this.workerPool = [];
    logger.info('Worker pool cleared');
  }

  /**
   * Get statistics about the worker pool
   * 
   * @returns Statistics about the worker pool
   */
  getPoolStats(): any {
    return {
      totalWorkers: this.workerPool.length,
      busyWorkers: this.workerPool.filter(w => w.busy).length,
      idleWorkers: this.workerPool.filter(w => !w.busy).length,
      workersByType: this.workerPool.reduce((acc, worker) => {
        const type = worker.workerType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      totalTasksCompleted: this.workerPool.reduce((sum, worker) => 
        sum + (worker.tasksCompleted || 0), 0),
      totalErrors: this.workerPool.reduce((sum, worker) => 
        sum + (worker.errorCount || 0), 0),
      averageTaskTime: this.calculateAverageTaskTime(),
      maxWorkers: this.maxWorkers
    };
  }

  /**
   * Calculate the average task processing time across all workers
   * 
   * @private
   * @returns Average processing time in milliseconds
   */
  private calculateAverageTaskTime(): number {
    const totalTasks = this.workerPool.reduce((sum, worker) => 
      sum + (worker.tasksCompleted || 0), 0);
    
    const totalTime = this.workerPool.reduce((sum, worker) => 
      sum + (worker.totalProcessingTime || 0), 0);
    
    return totalTasks > 0 ? Math.round(totalTime / totalTasks) : 0;
  }
}
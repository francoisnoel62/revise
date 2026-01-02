// ABOUTME: Utility for measuring and logging performance metrics
// ABOUTME: Helps ensure < 3 second target for rewrite operations

export class PerformanceMonitor {
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(label: string): number {
    const duration = performance.now() - this.startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }
}

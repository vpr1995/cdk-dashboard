import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { IQueue } from 'aws-cdk-lib/aws-sqs';

import { MetricFactory } from './metric-factory';
import { ServiceMetricProvider } from './service-metric-provider';

/**
 * Provides SQS-specific metrics for CloudWatch dashboards.
 */
export class SQSMetricProvider implements ServiceMetricProvider<IQueue> {
  private readonly metricFactory: MetricFactory;

  /**
   * Creates a new SQSMetricProvider instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Creates dashboard widgets for SQS queues.
   * 
   * @param queues - Array of SQS queue constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createWidgets(queues: IQueue[]): GraphWidget[] {
    if (queues.length === 0) {
      return [];
    }

    // Collect metrics from all SQS queues
    const sentMetrics: IMetric[] = [];
    const receivedMetrics: IMetric[] = [];
    const visibleMessagesMetrics: IMetric[] = [];
    const ageOfOldestMessageMetrics: IMetric[] = [];
    
    // Group metrics by type for all SQS queues
    queues.forEach(queue => {
      try {
        // Get queue name safely
        const queueName = queue.queueName || 'unknown-queue';
        
        sentMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SQS',
            metricName: 'NumberOfMessagesSent',
            dimensionsMap: { QueueName: queueName },
          })
        );
        
        receivedMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SQS',
            metricName: 'NumberOfMessagesReceived',
            dimensionsMap: { QueueName: queueName },
          })
        );
        
        visibleMessagesMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: queueName },
          })
        );
        
        ageOfOldestMessageMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateAgeOfOldestMessage',
            dimensionsMap: { QueueName: queueName },
          })
        );
      } catch (error) {
        // Using a silent failure approach for metrics creation
        // This prevents crashing the dashboard generation if a metric cannot be created
      }
    });

    // Create widgets for each metric type
    return [
      this.metricFactory.createGraphWidget({
        title: 'SQS - Messages Sent',
        metrics: sentMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SQS - Messages Received',
        metrics: receivedMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SQS - Visible Messages',
        metrics: visibleMessagesMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SQS - Age of Oldest Message (seconds)',
        metrics: ageOfOldestMessageMetrics,
        width: 6,
      }),
    ];
  }
}
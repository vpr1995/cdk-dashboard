import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { ITopic } from 'aws-cdk-lib/aws-sns';

import { MetricFactory } from './metric-factory';
import { ServiceMetricProvider } from './service-metric-provider';

/**
 * Provides SNS-specific metrics for CloudWatch dashboards.
 */
export class SNSMetricProvider implements ServiceMetricProvider<ITopic> {
  private readonly metricFactory: MetricFactory;

  /**
   * Creates a new SNSMetricProvider instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Creates dashboard widgets for SNS topics.
   * 
   * @param topics - Array of SNS topic constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createWidgets(topics: ITopic[]): GraphWidget[] {
    if (topics.length === 0) {
      return [];
    }

    // Collect metrics from all SNS topics
    const publishMetrics: IMetric[] = [];
    const deliveryMetrics: IMetric[] = [];
    const failureMetrics: IMetric[] = [];
    
    // Group metrics by type for all SNS topics
    topics.forEach(topic => {
      try {
        // Get topic name safely
        const topicName = topic.topicName || 'unknown-topic';
        const topicNameDimension = { TopicName: topicName };
        
        // Create individual metrics manually
        publishMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SNS',
            metricName: 'NumberOfMessagesPublished',
            dimensionsMap: topicNameDimension,
          })
        );

        deliveryMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SNS',
            metricName: 'NumberOfNotificationsDelivered',
            dimensionsMap: topicNameDimension,
          })
        );

        failureMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/SNS',
            metricName: 'NumberOfNotificationsFailed',
            dimensionsMap: topicNameDimension,
          })
        );
      } catch (error) {
        // Using a silent failure approach for metrics creation
        // This prevents crashing the dashboard generation if a metric cannot be created
      }
    });

    return [
      this.metricFactory.createGraphWidget({
        title: 'SNS - Published Messages',
        metrics: publishMetrics,
        width: 8,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SNS - Notifications Delivered',
        metrics: deliveryMetrics,
        width: 8,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SNS - Notifications Failed',
        metrics: failureMetrics,
        width: 8,
      }),
    ];
  }
}
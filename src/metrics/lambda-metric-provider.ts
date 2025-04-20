import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

import { MetricFactory } from './metric-factory';
import { ServiceMetricProvider } from './service-metric-provider';

/**
 * Provides Lambda-specific metrics for CloudWatch dashboards.
 */
export class LambdaMetricProvider implements ServiceMetricProvider<IFunction> {
  private readonly metricFactory: MetricFactory;

  /**
   * Creates a new LambdaMetricProvider instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Creates dashboard widgets for Lambda functions.
   * 
   * @param functions - Array of Lambda function constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createWidgets(functions: IFunction[]): GraphWidget[] {
    if (functions.length === 0) {
      return [];
    }

    // Collect metrics from all Lambda functions
    const invocationMetrics: IMetric[] = [];
    const durationMetrics: IMetric[] = [];
    const errorMetrics: IMetric[] = [];
    const throttleMetrics: IMetric[] = [];
    
    // Group metrics by type for all Lambda functions
    functions.forEach(lambda => {
      try {
        // Create invocation metrics
        if (typeof lambda.metricInvocations === 'function') {
          invocationMetrics.push(lambda.metricInvocations());
        } else {
          invocationMetrics.push(
            this.metricFactory.createMetric({
              namespace: 'AWS/Lambda',
              metricName: 'Invocations',
              dimensionsMap: { FunctionName: lambda.functionName },
            })
          );
        }
        
        // Create duration metrics
        if (typeof lambda.metricDuration === 'function') {
          durationMetrics.push(lambda.metricDuration());
        } else {
          durationMetrics.push(
            this.metricFactory.createMetric({
              namespace: 'AWS/Lambda',
              metricName: 'Duration',
              dimensionsMap: { FunctionName: lambda.functionName },
            })
          );
        }
        
        // Create error metrics
        if (typeof lambda.metricErrors === 'function') {
          errorMetrics.push(lambda.metricErrors());
        } else {
          errorMetrics.push(
            this.metricFactory.createMetric({
              namespace: 'AWS/Lambda',
              metricName: 'Errors',
              dimensionsMap: { FunctionName: lambda.functionName },
            })
          );
        }
        
        // Create throttle metrics
        if (typeof lambda.metricThrottles === 'function') {
          throttleMetrics.push(lambda.metricThrottles());
        } else {
          throttleMetrics.push(
            this.metricFactory.createMetric({
              namespace: 'AWS/Lambda',
              metricName: 'Throttles',
              dimensionsMap: { FunctionName: lambda.functionName },
            })
          );
        }
      } catch (error) {
        // Using a silent failure approach for metrics creation
        // This prevents crashing the dashboard generation if a metric cannot be created
      }
    });

    // Create widgets for each metric type
    return [
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Invocations',
        metrics: invocationMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Duration (ms)',
        metrics: durationMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Errors',
        metrics: errorMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Throttles',
        metrics: throttleMetrics,
        width: 6,
      }),
    ];
  }
}
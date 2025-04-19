import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { Method } from 'aws-cdk-lib/aws-apigateway';

import { MetricFactory } from './metric-factory';
import { ServiceMetricProvider } from './service-metric-provider';

/**
 * Provides API Gateway Method-specific metrics for CloudWatch dashboards.
 */
export class ApiMethodMetricProvider implements ServiceMetricProvider<Method> {
  private readonly metricFactory: MetricFactory;

  /**
   * Creates a new ApiMethodMetricProvider instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Creates dashboard widgets for API Gateway methods.
   * 
   * @param methods - Array of API Gateway method constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createWidgets(methods: Method[]): GraphWidget[] {
    if (methods.length === 0) {
      return [];
    }

    // Collect metrics from all API Gateway methods
    const requestCountMetrics: IMetric[] = [];
    const latencyMetrics: IMetric[] = [];
    const error4xxMetrics: IMetric[] = [];
    const error5xxMetrics: IMetric[] = [];
    
    // Group metrics by type for all API Gateway methods
    methods.forEach(method => {
      try {
        // Create individual metrics manually using the MetricFactory
        // Use a safer way to get the API name
        const apiName = method.resource.path || 'unknown-api';
        const apiMethod = method.httpMethod || 'unknown-method';

        requestCountMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { ApiName: apiName, Method: apiMethod },
          })
        );
        
        latencyMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: { ApiName: apiName, Method: apiMethod },
          })
        );
        
        error4xxMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: { ApiName: apiName, Method: apiMethod },
          })
        );
        
        error5xxMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: { ApiName: apiName, Method: apiMethod },
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
        title: 'API Gateway Method - Request Count',
        metrics: requestCountMetrics,
        width: 8,
      }),
      this.metricFactory.createGraphWidget({
        title: 'API Gateway Method - Latency (ms)',
        metrics: latencyMetrics,
        width: 8,
      }),
      this.metricFactory.createGraphWidget({
        title: 'API Gateway Method - Error Rate',
        metrics: error4xxMetrics.concat(error5xxMetrics),
        width: 8,
      }),
    ];
  }
}
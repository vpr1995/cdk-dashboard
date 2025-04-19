import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway';

import { MetricFactory } from './metric-factory';
import { ServiceMetricProvider } from './service-metric-provider';

/**
 * Provides API Gateway-specific metrics for CloudWatch dashboards.
 */
export class ApiGatewayMetricProvider implements ServiceMetricProvider<IRestApi> {
  private readonly metricFactory: MetricFactory;

  /**
   * Creates a new ApiGatewayMetricProvider instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Creates dashboard widgets for API Gateway REST APIs.
   * 
   * @param apis - Array of API Gateway REST API constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createWidgets(apis: IRestApi[]): GraphWidget[] {
    if (apis.length === 0) {
      return [];
    }

    // Collect metrics from all API Gateways
    const requestCountMetrics: IMetric[] = [];
    const latencyMetrics: IMetric[] = [];
    const error4xxMetrics: IMetric[] = [];
    const error5xxMetrics: IMetric[] = [];
    
    // Group metrics by type for all API Gateways
    apis.forEach(api => {
      try {
        // Create individual metrics manually using the MetricFactory
        // Use a safer way to get the API name
        const apiName = api.restApiName || 'unknown-api';
        
        requestCountMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { ApiName: apiName },
          })
        );
        
        latencyMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: { ApiName: apiName },
          })
        );
        
        error4xxMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: { ApiName: apiName },
          })
        );
        
        error5xxMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: { ApiName: apiName },
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
        title: 'API Gateway - Request Count',
        metrics: requestCountMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'API Gateway - Latency (ms)',
        metrics: latencyMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'API Gateway - 4XX Errors',
        metrics: error4xxMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'API Gateway - 5XX Errors',
        metrics: error5xxMetrics,
      }),
    ];
  }
}
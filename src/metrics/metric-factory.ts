import { Duration } from 'aws-cdk-lib';
import { 
  GraphWidget, 
  Metric, 
  MetricProps, 
  IMetric, 
  GraphWidgetProps 
} from 'aws-cdk-lib/aws-cloudwatch';

/**
 * Factory class to create standardized CloudWatch metrics and widgets.
 * 
 * This class provides utility methods to create consistent metrics and graph widgets
 * with standardized properties across your CloudWatch dashboards.
 */
export class MetricFactory {
  private readonly timePeriod: Duration;

  /**
   * Creates a new MetricFactory instance.
   * 
   * @param timePeriod - The default time period to use for metrics and widgets
   */
  constructor(timePeriod: Duration) {
    this.timePeriod = timePeriod;
  }

  /**
   * Creates a CloudWatch metric with standardized settings.
   * 
   * @param props - The metric properties to configure
   * @returns A configured CloudWatch metric
   */
  public createMetric(props: MetricProps): IMetric {
    return new Metric({
      statistic: 'Average',
      period: Duration.minutes(5),
      ...props,
    });
  }

  /**
   * Creates a CloudWatch graph widget with standardized settings and metrics.
   * 
   * @param props - The graph widget properties including title and metrics
   * @returns A configured CloudWatch graph widget
   */
  public createGraphWidget(props: Partial<GraphWidgetProps> & { title: string, metrics: IMetric[] }): GraphWidget {
    return new GraphWidget({
      width: 24,
      height: 6,
      left: props.metrics,
      liveData: true,
      period: this.timePeriod,
      ...props,
    });
  }

  /**
   * Creates multiple time series metrics that share the same namespace and dimensions.
   * 
   * @param namespace - The CloudWatch namespace for the metrics
   * @param metricNames - Array of metric names to create
   * @param dimensions - Optional dimensions to apply to all metrics
   * @returns An array of configured CloudWatch metrics
   */
  public createMetricSet(
    namespace: string, 
    metricNames: string[], 
    dimensions?: Record<string, string>
  ): IMetric[] {
    return metricNames.map(metricName => 
      this.createMetric({
        namespace,
        metricName,
        dimensionsMap: dimensions,
      })
    );
  }
}
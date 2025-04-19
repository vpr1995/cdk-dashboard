import { Duration } from 'aws-cdk-lib';
import { 
  GraphWidget, 
  Metric, 
  MetricProps, 
  IMetric, 
  GraphWidgetProps 
} from 'aws-cdk-lib/aws-cloudwatch';

/**
 * Factory class to create standardized CloudWatch metrics and widgets
 */
export class MetricFactory {
  private readonly periodHours: number;

  constructor(periodHours: number) {
    this.periodHours = periodHours;
  }

  /**
   * Creates a metric with standardized settings
   */
  public createMetric(props: MetricProps): IMetric {
    return new Metric({
      statistic: 'Average',
      period: Duration.minutes(5),
      ...props,
    });
  }

  /**
   * Creates a graph widget with standardized settings and metrics
   */
  public createGraphWidget(props: Partial<GraphWidgetProps> & { title: string, metrics: IMetric[] }): GraphWidget {
    return new GraphWidget({
      width: 24,
      height: 6,
      left: props.metrics,
      liveData: true,
      period: Duration.hours(this.periodHours),
      ...props,
    });
  }

  /**
   * Creates multiple time series metrics that share the same namespace and dimensions
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
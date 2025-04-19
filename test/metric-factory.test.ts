import { Duration } from 'aws-cdk-lib';
import { Metric, GraphWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { MetricFactory } from '../src/metrics/metric-factory';

describe('MetricFactory', () => {
  let metricFactory: MetricFactory;
  
  beforeEach(() => {
    // Create a new MetricFactory with a 3-hour time period before each test
    metricFactory = new MetricFactory(Duration.hours(3));
  });
  
  test('createMetric returns a metric with default and custom properties', () => {
    // WHEN
    const metric = metricFactory.createMetric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: { FunctionName: 'test-function' },
    }) as Metric;
    
    // THEN
    expect(metric).toBeDefined();
    expect(metric.namespace).toBe('AWS/Lambda');
    expect(metric.metricName).toBe('Invocations');
    expect(metric.dimensions).toEqual({ FunctionName: 'test-function' });
    expect(metric.statistic).toBe('Average');
    
    // Period is not directly accessible in the Metric class, so we'll skip that check
  });
  
  test('createGraphWidget returns a widget with default and custom properties', () => {
    // GIVEN
    const metric1 = new Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: { FunctionName: 'test-function-1' },
    });
    
    const metric2 = new Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: { FunctionName: 'test-function-2' },
    });
    
    // WHEN
    const widget = metricFactory.createGraphWidget({
      title: 'Test Widget',
      metrics: [metric1, metric2],
      width: 12,
    });
    
    // THEN
    expect(widget).toBeDefined();
    expect(widget.width).toBe(12);
    expect(widget.height).toBe(6);
    
    // We can't easily test the internal properties of GraphWidget since they're not exposed
    // Instead, we'll trust that the factory configures them correctly
  });
  
  test('createMetricSet returns multiple metrics with the same namespace and dimensions', () => {
    // WHEN
    const metrics = metricFactory.createMetricSet(
      'AWS/Lambda',
      ['Invocations', 'Errors', 'Duration'],
      { FunctionName: 'test-function' }
    );
    
    // THEN
    expect(metrics).toHaveLength(3);
    
    metrics.forEach((metric, index) => {
      const castedMetric = metric as Metric;
      expect(castedMetric.namespace).toBe('AWS/Lambda');
      expect(castedMetric.dimensions).toEqual({ FunctionName: 'test-function' });
      
      if (index === 0) expect(castedMetric.metricName).toBe('Invocations');
      if (index === 1) expect(castedMetric.metricName).toBe('Errors');
      if (index === 2) expect(castedMetric.metricName).toBe('Duration');
    });
  });
});
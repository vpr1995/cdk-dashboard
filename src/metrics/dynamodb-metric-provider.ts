import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';

import { MetricFactory } from './metric-factory';
import { ServiceMetricProvider } from './service-metric-provider';

/**
 * Provides DynamoDB-specific metrics for CloudWatch dashboards.
 */
export class DynamoDBMetricProvider implements ServiceMetricProvider<ITable> {
  private readonly metricFactory: MetricFactory;

  /**
   * Creates a new DynamoDBMetricProvider instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Creates dashboard widgets for DynamoDB tables.
   * 
   * @param tables - Array of DynamoDB table constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createWidgets(tables: ITable[]): GraphWidget[] {
    if (tables.length === 0) {
      return [];
    }

    // Collect metrics from all DynamoDB tables
    const readCapacityMetrics: IMetric[] = [];
    const writeCapacityMetrics: IMetric[] = [];
    const readThrottleMetrics: IMetric[] = [];
    const writeThrottleMetrics: IMetric[] = [];
    const queryMetrics: IMetric[] = [];
    const scanMetrics: IMetric[] = [];
    
    // Group metrics by type for all DynamoDB tables
    tables.forEach(table => {
      try {
        // Get table name safely
        const tableName = table.tableName || 'unknown-table';
        const tableNameDimension = { TableName: tableName };
        
        // Use safer access to the metrics with fallbacks
        if (typeof table.metricConsumedReadCapacityUnits === 'function') {
          readCapacityMetrics.push(table.metricConsumedReadCapacityUnits());
        } else {
          readCapacityMetrics.push(
            this.metricFactory.createMetric({
              namespace: 'AWS/DynamoDB',
              metricName: 'ConsumedReadCapacityUnits',
              dimensionsMap: tableNameDimension,
            })
          );
        }
        
        if (typeof table.metricConsumedWriteCapacityUnits === 'function') {
          writeCapacityMetrics.push(table.metricConsumedWriteCapacityUnits());
        } else {
          writeCapacityMetrics.push(
            this.metricFactory.createMetric({
              namespace: 'AWS/DynamoDB',
              metricName: 'ConsumedWriteCapacityUnits',
              dimensionsMap: tableNameDimension,
            })
          );
        }
        
        // Create read and write throttle metrics
        readThrottleMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ReadThrottleEvents',
            dimensionsMap: tableNameDimension,
          })
        );
        
        writeThrottleMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/DynamoDB',
            metricName: 'WriteThrottleEvents',
            dimensionsMap: tableNameDimension,
          })
        );
        
        // Add query and scan metrics using the metricFactory
        queryMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/DynamoDB',
            metricName: 'SuccessfulRequestLatency',
            dimensionsMap: { ...tableNameDimension, Operation: 'Query' },
          })
        );
        
        scanMetrics.push(
          this.metricFactory.createMetric({
            namespace: 'AWS/DynamoDB',
            metricName: 'SuccessfulRequestLatency',
            dimensionsMap: { ...tableNameDimension, Operation: 'Scan' },
          })
        );
      } catch (error) {
        // Using a silent failure approach for metrics creation
        // This prevents crashing the dashboard generation if a metric cannot be created
      }
    });

    return [
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Capacity Units',
        metrics: [...readCapacityMetrics, ...writeCapacityMetrics],
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Throttle Events',
        metrics: [ ...readThrottleMetrics, ...writeThrottleMetrics ],
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Query Latency',
        metrics: queryMetrics,
        width: 6,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Scan Latency',
        metrics: scanMetrics,
        width: 6,
      }),
    ];
  }
}
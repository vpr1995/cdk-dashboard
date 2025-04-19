import { GraphWidget } from 'aws-cdk-lib/aws-cloudwatch';

/**
 * Interface for service-specific metric providers.
 * 
 * Each AWS service metric provider should implement this interface
 * to provide metrics for specific AWS resources.
 */
export interface ServiceMetricProvider<T> {
  /**
   * Creates dashboard widgets for specific AWS service resources.
   * 
   * @param resources - Array of AWS service resource constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  createWidgets(resources: T[]): GraphWidget[];
}
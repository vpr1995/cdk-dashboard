import { Stack } from 'aws-cdk-lib';

/**
 * Options for configuring the CDK Dashboard
 */
export interface DashboardOptions {
  /**
   * Optional name for the CloudWatch dashboard
   * @default - A name is automatically generated
   */
  readonly dashboardName?: string;

  /**
   * The CDK stack to analyze for resources
   * @default - No stack is analyzed automatically
   */
  readonly stack?: Stack;

  /**
   * Number of periods to show in dashboard widgets
   * @default 3
   */
  readonly periodHours?: number;

  /**
   * Include Lambda function metrics
   * @default true
   */
  readonly includeLambda?: boolean;

  /**
   * Include API Gateway metrics
   * @default true
   */
  readonly includeApiGateway?: boolean;

  /**
   * Include DynamoDB table metrics
   * @default true
   */
  readonly includeDynamoDB?: boolean;

  /**
   * Include SNS topic metrics
   * @default true
   */
  readonly includeSNS?: boolean;

  /**
   * Include SQS queue metrics
   * @default true
   */
  readonly includeSQS?: boolean;
}
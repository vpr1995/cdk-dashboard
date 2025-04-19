import { GraphWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IRestApi, Method } from 'aws-cdk-lib/aws-apigateway';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { IQueue } from 'aws-cdk-lib/aws-sqs';

import { MetricFactory } from './metric-factory';
import { LambdaMetricProvider } from './lambda-metric-provider';
import { ApiGatewayMetricProvider } from './api-gateway-metric-provider';
import { DynamoDBMetricProvider } from './dynamodb-metric-provider';
import { SNSMetricProvider } from './sns-metric-provider';
import { SQSMetricProvider } from './sqs-metric-provider';
import { ApiMethodMetricProvider } from './api-method-metric-provider';

/**
 * Provides service-specific metrics for AWS services.
 * 
 * This class contains methods to create standardized dashboard widgets for common AWS services
 * such as Lambda, API Gateway, DynamoDB, SNS, and SQS. Each method accepts AWS service constructs
 * and creates appropriately configured dashboard widgets for them.
 * 
 * The implementation delegates to service-specific providers to keep this class manageable.
 */
export class ServiceMetrics {
  private readonly lambdaProvider: LambdaMetricProvider;
  private readonly apiGatewayProvider: ApiGatewayMetricProvider;
  private readonly dynamoDBProvider: DynamoDBMetricProvider;
  private readonly snsProvider: SNSMetricProvider;
  private readonly sqsProvider: SQSMetricProvider;
  private readonly apiMethodProvider: ApiMethodMetricProvider;

  /**
   * Creates a new ServiceMetrics instance.
   * 
   * @param metricFactory - The MetricFactory instance to use for creating metrics and widgets
   */
  constructor(metricFactory: MetricFactory) {
    // Initialize all service-specific metric providers
    this.lambdaProvider = new LambdaMetricProvider(metricFactory);
    this.apiGatewayProvider = new ApiGatewayMetricProvider(metricFactory);
    this.dynamoDBProvider = new DynamoDBMetricProvider(metricFactory);
    this.snsProvider = new SNSMetricProvider(metricFactory);
    this.sqsProvider = new SQSMetricProvider(metricFactory);
    this.apiMethodProvider = new ApiMethodMetricProvider(metricFactory);
  }

  /**
   * Creates dashboard widgets for Lambda functions.
   * 
   * @param functions - Array of Lambda function constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createLambdaWidgets(functions: IFunction[]): GraphWidget[] {
    return this.lambdaProvider.createWidgets(functions);
  }

  /**
   * Creates dashboard widgets for API Gateway REST APIs.
   * 
   * @param apis - Array of API Gateway REST API constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createApiGatewayWidgets(apis: IRestApi[]): GraphWidget[] {
    return this.apiGatewayProvider.createWidgets(apis);
  }

  /**
   * Creates dashboard widgets for DynamoDB tables.
   * 
   * @param tables - Array of DynamoDB table constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createDynamoDBWidgets(tables: ITable[]): GraphWidget[] {
    return this.dynamoDBProvider.createWidgets(tables);
  }

  /**
   * Creates dashboard widgets for SNS topics.
   * 
   * @param topics - Array of SNS topic constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createSNSWidgets(topics: ITopic[]): GraphWidget[] {
    return this.snsProvider.createWidgets(topics);
  }

  /**
   * Creates dashboard widgets for SQS queues.
   * 
   * @param queues - Array of SQS queue constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createSQSWidgets(queues: IQueue[]): GraphWidget[] {
    return this.sqsProvider.createWidgets(queues);
  }

  /**
   * Creates dashboard widgets for API Gateway methods.
   * 
   * @param methods - Array of API Gateway method constructs
   * @returns Array of configured CloudWatch graph widgets
   */
  public createApiMethodWidgets(methods: Method[]): GraphWidget[] {
    return this.apiMethodProvider.createWidgets(methods);
  }
}
import { GraphWidget, IMetric } from 'aws-cdk-lib/aws-cloudwatch';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { IQueue } from 'aws-cdk-lib/aws-sqs';

import { MetricFactory } from './metric-factory';

/**
 * Provides service-specific metrics for AWS services
 */
export class ServiceMetrics {
  private readonly metricFactory: MetricFactory;

  constructor(metricFactory: MetricFactory) {
    this.metricFactory = metricFactory;
  }

  /**
   * Create Lambda function dashboard widgets
   */
  public createLambdaWidgets(functions: IFunction[]): GraphWidget[] {
    if (functions.length === 0) {
      return [];
    }

    // Collect metrics from all Lambda functions
    const invocationsMetrics: IMetric[] = [];
    const durationMetrics: IMetric[] = [];
    const errorsMetrics: IMetric[] = [];
    const throttlesMetrics: IMetric[] = [];
    
    // Group metrics by type for all Lambda functions
    functions.forEach(fn => {
      invocationsMetrics.push(fn.metricInvocations());
      durationMetrics.push(fn.metricDuration());
      errorsMetrics.push(fn.metricErrors());
      throttlesMetrics.push(fn.metricThrottles());
      
      // ConcurrentExecutions is a namespace-level metric, not function-specific
      // We'll create it separately using the metric factory
    });
    
    // Create concurrent executions metric for the Lambda service
    const concurrentExecutionsMetric = this.metricFactory.createMetric({
      namespace: 'AWS/Lambda',
      metricName: 'ConcurrentExecutions',
    });

    // Create widgets for each metric type
    return [
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Invocations',
        metrics: invocationsMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Duration (ms)',
        metrics: durationMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Errors',
        metrics: errorsMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Throttles',
        metrics: throttlesMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'Lambda - Concurrent Executions',
        metrics: [concurrentExecutionsMetric],
      }),
    ];
  }

  /**
   * Create API Gateway dashboard widgets
   */
  public createApiGatewayWidgets(apis: IRestApi[]): GraphWidget[] {
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
      // Create individual metrics manually using the MetricFactory
      const apiName = api.restApiName;
      
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

  /**
   * Create DynamoDB dashboard widgets
   */
  public createDynamoDBWidgets(tables: ITable[]): GraphWidget[] {
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
      // Use safer access to the metrics
      if (typeof table.metricConsumedReadCapacityUnits === 'function') {
        readCapacityMetrics.push(table.metricConsumedReadCapacityUnits());
      }
      
      if (typeof table.metricConsumedWriteCapacityUnits === 'function') {
        writeCapacityMetrics.push(table.metricConsumedWriteCapacityUnits());
      }
      
      // Create read and write throttle metrics
      const tableNameDimension = { TableName: table.tableName };
      
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
    });

    // Create widgets for each metric type
    return [
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Read Capacity Units',
        metrics: readCapacityMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Write Capacity Units',
        metrics: writeCapacityMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Read Throttle Events',
        metrics: readThrottleMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Write Throttle Events',
        metrics: writeThrottleMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Query Latency',
        metrics: queryMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'DynamoDB - Scan Latency',
        metrics: scanMetrics,
      }),
    ];
  }

  /**
   * Create SNS dashboard widgets
   */
  public createSNSWidgets(topics: ITopic[]): GraphWidget[] {
    if (topics.length === 0) {
      return [];
    }

    // Collect metrics from all SNS topics
    const publishedMetrics: IMetric[] = [];
    const deliveredMetrics: IMetric[] = [];
    const failedMetrics: IMetric[] = [];
    
    // Group metrics by type for all SNS topics
    topics.forEach(topic => {
      const topicName = topic.topicName;
      
      publishedMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SNS',
          metricName: 'NumberOfMessagesPublished',
          dimensionsMap: { TopicName: topicName },
        })
      );
      
      deliveredMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SNS',
          metricName: 'NumberOfNotificationsDelivered',
          dimensionsMap: { TopicName: topicName },
        })
      );
      
      failedMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SNS',
          metricName: 'NumberOfNotificationsFailed',
          dimensionsMap: { TopicName: topicName },
        })
      );
    });

    // Create widgets for each metric type
    return [
      this.metricFactory.createGraphWidget({
        title: 'SNS - Messages Published',
        metrics: publishedMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SNS - Notifications Delivered',
        metrics: deliveredMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SNS - Notifications Failed',
        metrics: failedMetrics,
      }),
    ];
  }

  /**
   * Create SQS dashboard widgets
   */
  public createSQSWidgets(queues: IQueue[]): GraphWidget[] {
    if (queues.length === 0) {
      return [];
    }

    // Collect metrics from all SQS queues
    const sentMetrics: IMetric[] = [];
    const receivedMetrics: IMetric[] = [];
    const visibleMessagesMetrics: IMetric[] = [];
    const ageOfOldestMessageMetrics: IMetric[] = [];
    
    // Group metrics by type for all SQS queues
    queues.forEach(queue => {
      const queueName = queue.queueName;
      
      sentMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SQS',
          metricName: 'NumberOfMessagesSent',
          dimensionsMap: { QueueName: queueName },
        })
      );
      
      receivedMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SQS',
          metricName: 'NumberOfMessagesReceived',
          dimensionsMap: { QueueName: queueName },
        })
      );
      
      visibleMessagesMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SQS',
          metricName: 'ApproximateNumberOfMessagesVisible',
          dimensionsMap: { QueueName: queueName },
        })
      );
      
      ageOfOldestMessageMetrics.push(
        this.metricFactory.createMetric({
          namespace: 'AWS/SQS',
          metricName: 'ApproximateAgeOfOldestMessage',
          dimensionsMap: { QueueName: queueName },
        })
      );
    });

    // Create widgets for each metric type
    return [
      this.metricFactory.createGraphWidget({
        title: 'SQS - Messages Sent',
        metrics: sentMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SQS - Messages Received',
        metrics: receivedMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SQS - Visible Messages',
        metrics: visibleMessagesMetrics,
      }),
      this.metricFactory.createGraphWidget({
        title: 'SQS - Age of Oldest Message (seconds)',
        metrics: ageOfOldestMessageMetrics,
      }),
    ];
  }
}
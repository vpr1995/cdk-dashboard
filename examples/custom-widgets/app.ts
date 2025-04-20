import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { GraphWidget, TextWidget, Metric, LogQueryWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { CdkDashboard } from '../../src/index';

class CustomWidgetsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a Lambda function
    const helloFunction = new Function(this, 'HelloFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Hello from Lambda!' }),
          };
        };
      `),
    });

    // Create an API Gateway
    const api = new RestApi(this, 'HelloApi', {
      restApiName: 'Hello Service',
      description: 'API for hello service',
    });

    // Add a Lambda integration
    const integration = new LambdaIntegration(helloFunction);
    api.root.addMethod('GET', integration);

    // Create a DynamoDB table
    new Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: 'users-table',
    });

    // Create an SNS Topic
    new Topic(this, 'NotificationTopic', {
      displayName: 'Customer Notifications',
    });

    // Create an SQS Queue
    new Queue(this, 'TaskQueue', {
      visibilityTimeout: Duration.seconds(300),
      queueName: 'task-queue',
    });

    // Create the dashboard with custom widgets
    const dashboard = new CdkDashboard(this, 'CustomWidgetsDashboard', {
      dashboardName: 'DashboardWithCustomWidgets',
    });

    // Add a text header as a section divider
    dashboard.addWidgets(
      new TextWidget({
        markdown: '# Custom Application Widgets',
        width: 24,
        height: 1,
      })
    );

    // Add a custom metric graph
    dashboard.addWidgets(
      new GraphWidget({
        title: 'Business Logic Metrics',
        left: [
          new Metric({
            namespace: 'BusinessMetrics',
            metricName: 'TransactionsProcessed',
            dimensionsMap: { 
              Environment: 'Production',
              Service: 'PaymentProcessor'
            },
            statistic: 'Sum',
          }),
          new Metric({
            namespace: 'BusinessMetrics',
            metricName: 'TransactionValue',
            dimensionsMap: { 
              Environment: 'Production',
              Service: 'PaymentProcessor'
            },
            statistic: 'Average',
          })
        ],
        right: [
          new Metric({
            namespace: 'BusinessMetrics',
            metricName: 'TransactionLatency',
            dimensionsMap: { 
              Environment: 'Production',
              Service: 'PaymentProcessor'
            },
            statistic: 'Average',
          })
        ],
        width: 12,
        height: 6,
      }),
      
      // Add a CloudWatch Logs query widget
      new LogQueryWidget({
        title: 'Error Logs',
        logGroupNames: ['/aws/lambda/payment-processor'],
        width: 12,
        height: 6})
    );
  }
}

// Create the CDK app
const app = new App();

// Deploy the example stack
new CustomWidgetsStack(app, 'CustomWidgetsDemoStack');
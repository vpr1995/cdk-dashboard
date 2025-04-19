import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { CdkDashboard } from '../../src/index';

class ExampleStack extends Stack {
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

    // Create another Lambda function from an existing ARN
    // Note: In a real-world scenario, you would replace this ARN with an actual function ARN
    const testFunction = Function.fromFunctionArn(
      this,
      'TestFunction',
      'arn:aws:lambda:us-east-1:1234567890:function:TestFunction',
    );

    // Create an API Gateway
    const api = new RestApi(this, 'HelloApi', {
      restApiName: 'Hello Service',
      description: 'API for hello service',
    });

    // Add a Lambda integration
    const integration = new LambdaIntegration(helloFunction);
    api.root.addMethod('GET', integration);
    api.root.addMethod('POST', new LambdaIntegration(testFunction));

    // Create a DynamoDB tables
    new Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: 'users-table',
    });

    new Table(this, 'RolesTable', {
      partitionKey: { name: 'roleId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: 'roles-table',
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

    // Create the dashboard for this stack
    new CdkDashboard(this, 'ResourceDashboard', {
      dashboardName: 'ExampleCdkDashboard',
      timeframe: Duration.hours(1),
    });
  }
}

// Create the CDK app
const app = new App();

// Deploy the example stack
new ExampleStack(app, 'CdkDashboardExampleStack');
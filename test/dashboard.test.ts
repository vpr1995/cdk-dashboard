import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';

import { CdkDashboard } from '../src';

describe('CdkDashboard', () => {
  test('Dashboard is created with all resources', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    // Create test resources in the stack
    const testFunction = new Function(stack, 'TestFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = async () => { return { statusCode: 200, body: "OK" }; }'),
    });
    
    // Create an API Gateway with at least one method to avoid validation errors
    const api = new RestApi(stack, 'TestApi');
    const integration = new LambdaIntegration(testFunction);
    api.root.addMethod('GET', integration);
    
    new Table(stack, 'TestTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    
    new Topic(stack, 'TestTopic');
    
    new Queue(stack, 'TestQueue');
    
    // WHEN
    new CdkDashboard(stack, 'TestDashboard', {
      dashboardName: 'test-dashboard',
      stack: stack,
    });
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the dashboard is created
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    
    // Additional assertions could verify dashboard widgets and content
  });
});
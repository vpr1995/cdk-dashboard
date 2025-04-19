import { App, Stack, Duration } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { GraphWidget, TextWidget } from 'aws-cdk-lib/aws-cloudwatch';

import { CdkDashboard } from '../src';

// Define an interface for the widget structure in the CloudWatch dashboard JSON
interface DashboardWidget {
  type: string;
  properties: {
    markdown?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

describe('CdkDashboard', () => {
  test('Dashboard is created with default props', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    // WHEN
    new CdkDashboard(stack, 'TestDashboard', {});
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the dashboard is created
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    
    // Verify dashboard name
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'CdkDashboard'
    });
  });
  
  test('Dashboard is created with custom name and timeframe', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    // WHEN
    new CdkDashboard(stack, 'CustomDashboard', {
      dashboardName: 'custom-dashboard-name',
      timeframe: Duration.days(1)
    });
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the dashboard is created with the custom name
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'custom-dashboard-name'
    });
  });

  test('Resources are detected and dashboard widgets are created', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    // Create resources
    new Function(stack, 'TestFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = () => {}'),
    });
    
    new Table(stack, 'TestTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    
    new Queue(stack, 'TestQueue');
    new Topic(stack, 'TestTopic');
    
    // WHEN
    new CdkDashboard(stack, 'TestDashboard', {
      dashboardName: 'test-dashboard',
    });
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the dashboard is created
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    
    // Get the dashboard json body
    const dashboardResources = template.findResources('AWS::CloudWatch::Dashboard');
    const dashboardId = Object.keys(dashboardResources)[0];
    const dashboardBody = dashboardResources[dashboardId].Properties.DashboardBody;
    
    // Check that the dashboard body is present
    expect(dashboardBody).toBeDefined();
    
    // For CloudFormation templates, the dashboard body might be a string, an object, or a Fn::Join array
    // We'll check if dashboardBody has Fn::Join, which indicates it contains CloudFormation intrinsic functions
    if (dashboardBody['Fn::Join']) {
      // If it's using Fn::Join, at least verify it's a non-empty array
      expect(Array.isArray(dashboardBody['Fn::Join'][1])).toBe(true);
      expect(dashboardBody['Fn::Join'][1].length).toBeGreaterThan(0);
      
      // Also check if the first element contains the widgets JSON start
      const firstElement = dashboardBody['Fn::Join'][1][0];
      expect(typeof firstElement === 'string' && firstElement.includes('widgets')).toBe(true);
    } else if (typeof dashboardBody === 'string') {
      // If it's a string, parse it and validate
      const body = JSON.parse(dashboardBody);
      expect(body).toHaveProperty('widgets');
      expect(Array.isArray(body.widgets)).toBe(true);
      expect(body.widgets.length).toBeGreaterThan(0);
    } else {
      // If it's already an object, validate
      expect(dashboardBody).toHaveProperty('widgets');
      expect(Array.isArray(dashboardBody.widgets)).toBe(true);
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    }
  });
  
  test('addWidgets method adds custom widgets', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    // WHEN
    const dashboard = new CdkDashboard(stack, 'CustomWidgetsDashboard', {
      dashboardName: 'dashboard-with-custom-widgets',
    });
    
    dashboard.addWidgets(
      new TextWidget({
        markdown: '# Custom Section',
        width: 24,
        height: 1,
      })
    );
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the dashboard is created
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    
    // Get the dashboard json body to verify it contains the custom widget
    const dashboardResources = template.findResources('AWS::CloudWatch::Dashboard');
    const dashboardId = Object.keys(dashboardResources)[0];
    const dashboardBody = dashboardResources[dashboardId].Properties.DashboardBody;
    
    // Verify the dashboard body exists
    expect(dashboardBody).toBeDefined();
    
    // For CloudFormation templates, the dashboard body might be different formats
    if (dashboardBody['Fn::Join']) {
      // If it's using Fn::Join, check that the first element contains the text widget
      const firstElement = dashboardBody['Fn::Join'][1][0];
      expect(typeof firstElement === 'string' && firstElement.includes('text')).toBe(true);
      expect(typeof firstElement === 'string' && firstElement.includes('Custom Section')).toBe(true);
    } else if (typeof dashboardBody === 'string') {
      // If it's a string, parse it and validate
      const body = JSON.parse(dashboardBody);
      expect(body.widgets.some((widget: DashboardWidget) => widget.type === 'text')).toBe(true);
      expect(body.widgets.some((widget: DashboardWidget) => 
        widget.properties.markdown === '# Custom Section')).toBe(true);
    } else {
      // If it's already an object, validate
      expect(dashboardBody.widgets.some((widget: DashboardWidget) => widget.type === 'text')).toBe(true);
      expect(dashboardBody.widgets.some((widget: DashboardWidget) => 
        widget.properties.markdown === '# Custom Section')).toBe(true);
    }
  });
});
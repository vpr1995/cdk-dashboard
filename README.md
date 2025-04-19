# cdk-dashboard

A CDK construct library that creates CloudWatch dashboards for AWS CDK stacks. It automatically discovers resources in your stack and creates dashboard widgets grouped by service type.

## Features

- **Automatic Resource Discovery**: Uses CDK Aspects to automatically find and monitor resources in your stack
- **Service Grouping**: Groups metrics by AWS service type for better organization
- **Supported AWS Services**:
  - Lambda Functions
  - API Gateway
  - DynamoDB Tables
  - SNS Topics
  - SQS Queues
- **Simple Integration**: Easy to add to any CDK stack with minimal configuration

## Installation

```bash
npm install cdk-dashboard
```

## Usage

### Basic Usage

```typescript
import { Stack, App } from 'aws-cdk-lib';
import { CdkDashboard } from 'cdk-dashboard';

class MyStack extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);

    // Define your AWS resources here
    // ...

    // Create a dashboard for this stack
    new CdkDashboard(this, 'Dashboard', {
      dashboardName: 'my-stack-dashboard',
      stack: this,
    });
  }
}
```

### Customizing the Dashboard

You can customize which services are included in the dashboard:

```typescript
new CdkDashboard(this, 'CustomDashboard', {
  dashboardName: 'custom-dashboard',
  stack: this,
  periodHours: 6,                // Show 6 hours of data in widgets
  includeLambda: true,           // Include Lambda metrics
  includeApiGateway: true,       // Include API Gateway metrics
  includeDynamoDB: true,         // Include DynamoDB metrics
  includeSNS: false,             // Exclude SNS metrics
  includeSQS: false,             // Exclude SQS metrics
});
```

### Adding to Multiple Stacks

You can create a single dashboard that monitors multiple stacks:

```typescript
// Create the dashboard in the main stack
const dashboard = new CdkDashboard(mainStack, 'Dashboard', {
  dashboardName: 'multi-stack-dashboard',
});

// Add additional stacks to the dashboard
dashboard.addToStack(stackA);
dashboard.addToStack(stackB);
```

## How It Works

The `cdk-dashboard` library uses CDK's Aspects feature to traverse the construct tree of your stack and identify resources by type. It then collects metrics for each resource and groups them by service, creating dashboard widgets for each group.

The dashboard shows common metrics for each service. For example:

- **Lambda**: Invocations, Duration, Errors, Throttles, Concurrent Executions
- **API Gateway**: Request Count, Latency, Errors (4XX, 5XX)
- **DynamoDB**: Read/Write Capacity, Throttle Events, Query/Scan Latency
- **SNS**: Published Messages, Delivered Notifications, Failed Notifications
- **SQS**: Messages Sent/Received, Visible Messages, Age of Oldest Message

## License

MIT
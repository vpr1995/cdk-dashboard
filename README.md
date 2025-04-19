# CDK Dashboard

A CDK construct library that automatically creates CloudWatch dashboards for AWS CDK stacks. It scans your stack for supported resources and generates organized, service-grouped dashboard widgets to monitor your infrastructure.

## Features

- **Zero-Config Resource Discovery**: Uses CDK Aspects to automatically find and monitor resources in your stack
- **Pre-configured Metric Widgets**: Creates optimized CloudWatch widgets with the most useful metrics for each service
- **Consistent Dashboards**: Standardizes dashboard layout and metrics across all your stacks
- **Custom Widget Support**: Allows adding your own custom CloudWatch widgets alongside auto-discovered resources
- **Supported AWS Services**:
  - Lambda Functions (invocations, errors, duration, throttles)
  - API Gateway (request count, latency, error rates)
  - DynamoDB Tables (read/write capacity, throttling, query/scan performance)
  - SNS Topics (published messages, delivery success/failure)
  - SQS Queues (sent/received messages, queue depth, message age)

## Installation

```bash
npm install cdk-dashboard
```

## Usage

### Basic Usage

```typescript
import { Stack, App, Duration } from 'aws-cdk-lib';
import { CdkDashboard } from 'cdk-dashboard';

class MyStack extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);

    // Define your AWS resources here
    // ...

    // Create a dashboard for this stack
    new CdkDashboard(this, 'Dashboard', {
      dashboardName: 'my-service-dashboard',
      timeframe: Duration.hours(3)
    });
  }
}
```

### Customizing the Dashboard

You can customize the dashboard name and timeframe:

```typescript
new CdkDashboard(this, 'CustomDashboard', {
  dashboardName: 'production-monitoring',
  timeframe: Duration.days(1)  // Show 1 day of data in all widgets
});
```

### Adding Custom Widgets

You can add your own custom CloudWatch widgets alongside the automatically discovered resource widgets:

```typescript
import { GraphWidget, TextWidget, Metric } from 'aws-cdk-lib/aws-cloudwatch';

// Create a dashboard
const dashboard = new CdkDashboard(this, 'CustomDashboard', {
  dashboardName: 'production-monitoring',
  timeframe: Duration.days(1)
});

// Add a text header
dashboard.addWidgets(
  new TextWidget({
    markdown: '# Custom Metrics',
    width: 24,
    height: 1
  })
);

// Add a custom metric graph
dashboard.addWidgets(
  new GraphWidget({
    title: 'Custom Application Metrics',
    left: [
      new Metric({
        namespace: 'CustomNamespace',
        metricName: 'SuccessRate',
        dimensionsMap: { Service: 'MyService' },
        statistic: 'Average'
      })
    ],
    width: 12,
    height: 6
  })
);
```

## How It Works

The `cdk-dashboard` library uses CDK's Aspects feature to traverse the construct tree of your stack. It identifies resources by type and collects them into service groups. Then it generates optimized metrics and widgets for each service type.

### Service Metrics

The library creates these metrics for each service:

#### Lambda Functions
- Invocations
- Duration (ms)
- Errors
- Throttles

#### API Gateway
- Request Count
- Latency (ms)
- 4XX Errors
- 5XX Errors

#### DynamoDB
- Read/Write Capacity Units
- Throttle Events
- Query Latency
- Scan Latency

#### SNS Topics
- Messages Published
- Notifications Delivered
- Notifications Failed

#### SQS Queues
- Messages Sent
- Messages Received
- Visible Messages
- Age of Oldest Message

## Example

Here's a complete example that creates a stack with some AWS resources and adds a dashboard:

```typescript
import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { CdkDashboard } from 'cdk-dashboard';

class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a Lambda function
    const processor = new NodejsFunction(this, 'Processor', {
      entry: 'src/handler.js',
      handler: 'handler'
    });

    // Create a DynamoDB table
    const table = new Table(this, 'Items', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    // Create an SQS queue
    const queue = new Queue(this, 'ItemsQueue');

    // Create an SNS topic
    const topic = new Topic(this, 'ItemsTopic');

    // Create a dashboard for this stack
    new CdkDashboard(this, 'Dashboard', {
      dashboardName: 'example-dashboard',
      timeframe: Duration.hours(6)
    });
  }
}

const app = new App();
new ExampleStack(app, 'ExampleStack');
app.synth();
```

## Advanced Usage

The `CdkDashboard` construct is highly reusable. You can create specialized dashboards for different parts of your infrastructure by controlling the scope:

```typescript
// Create a dashboard for a specific construct and its children
new CdkDashboard(apiConstruct, 'ApiDashboard', {
  dashboardName: 'api-metrics'
});

// Create a dashboard for a specific database and its resources
new CdkDashboard(databaseConstruct, 'DatabaseDashboard', {
  dashboardName: 'db-metrics'
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
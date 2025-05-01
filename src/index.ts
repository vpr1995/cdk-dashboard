import { Aspects, Duration, IAspect } from "aws-cdk-lib";
import { Dashboard, IWidget } from "aws-cdk-lib/aws-cloudwatch";
import { ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct, IConstruct } from "constructs";
import { MetricFactory } from "./metrics/metric-factory";
import { ServiceMetrics } from "./metrics/service-metrics";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IFunction, Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
import { IQueue, Queue } from "aws-cdk-lib/aws-sqs";
import { IRestApi, Method, RestApi } from "aws-cdk-lib/aws-apigateway";
import { ITopic, Topic } from "aws-cdk-lib/aws-sns";

/**
 * Configuration properties for the CdkDashboard construct.
 */
export interface DashboardProps {
  /**
   * The name of the CloudWatch dashboard.
   * @default 'CdkDashboard'
   */
  dashboardName?: string;
}

/**
 * Main construct for creating a CloudWatch dashboard for AWS CDK constructs.
 * 
 * This construct scans the specified scope for supported AWS resources and 
 * automatically creates dashboard widgets to visualize their metrics.
 * 
 * Supported resources:
 * - Lambda functions
 * - DynamoDB tables
 * - SQS queues
 * - SNS topics
 * - API Gateway methods
 * 
 * @example
 * ```ts
 * // Create a dashboard for all resources in the stack
 * new CdkDashboard(this, 'ServiceDashboard', {
 *   dashboardName: 'MyServiceDashboard'
 * });
 * 
 * // Add custom widgets to the dashboard
 * const dashboard = new CdkDashboard(this, 'CustomDashboard', {
 *   dashboardName: 'dashboard-with-custom-widgets'
 * });
 * 
 * dashboard.addWidgets(
 *   new TextWidget({
 *     markdown: '# Custom Section',
 *     width: 24
 *   })
 * );
 * ```
 */
export class CdkDashboard extends Construct implements IAspect {
  private dashboard: Dashboard;
  private dydbTables: ITable[] = [];
  private lambdas: IFunction[] = [];
  private widgets: IWidget[] = [];
  private queues: IQueue[] = [];
  private apiMethods: Method[] = [];
  private apiGateways: IRestApi[] = [];
  private snsTopics: ITopic[] = [];
  private metricFactory: MetricFactory;
  private serviceMetrics: ServiceMetrics;

  /**
   * Creates a new CdkDashboard construct.
   * 
   * @param scope - The scope in which to define this construct
   * @param id - The scoped ID of the construct
   * @param props - Configuration properties
   */
  constructor(
    scope: Construct,
    id: string,
    props: DashboardProps,
  ) {
    super(scope, id);

    const { dashboardName } = props;

    // Register this aspect to scan the provided scope
    Aspects.of(scope).add(this);

    // Create the dashboard
    this.dashboard = new Dashboard(this, `${dashboardName || 'default'}-cdkdashboard`, {
      dashboardName: dashboardName || 'CdkDashboard',
    });

    // Initialize the metric factory and service metrics
    this.metricFactory = new MetricFactory(Duration.hours(3));
    this.serviceMetrics = new ServiceMetrics(this.metricFactory);
  }

  /**
   * Implementation of the IAspect visit method.
   * Collects all supported resources and updates the dashboard.
   * 
   * @param node - The construct being visited
   */
  public visit(node: IConstruct): void {
    // Collect resources by type
    if (isDynamoDBTable(node)) {
      this.dydbTables.push(node);
    } else if (isLambdaFunction(node)) {
      this.lambdas.push(node);
    } else if (isQueue(node)) {
      this.queues.push(node);
    } else if (isApiMethod(node)) {
      this.apiMethods.push(node);
    } else if (isSnsTopic(node)) {
      this.snsTopics.push(node);
    } else if (isApiGateway(node)) {
      this.apiGateways.push(node);
    }else {
      return;
    }

    // Reset and rebuild the dashboard with all collected resources
    // Using a type assertion with a specific type instead of 'any'
    (this.dashboard as unknown as { rows: never[] }).rows = [];
    this.dashboard.addWidgets(
      ...this.widgets,
      ...this.serviceMetrics.createDynamoDBWidgets(this.dydbTables),
      ...this.serviceMetrics.createLambdaWidgets(this.lambdas),
      ...this.serviceMetrics.createSQSWidgets(this.queues),
      ...this.serviceMetrics.createApiGatewayWidgets(this.apiGateways),
      ...this.serviceMetrics.createApiMethodWidgets(this.apiMethods),
      ...this.serviceMetrics.createSNSWidgets(this.snsTopics),
    );
  }

  /**
   * Adds custom widgets to the dashboard. These widgets will be displayed
   * before the automatically discovered resource widgets.
   * 
   * This method allows you to enhance the auto-generated dashboard with your own
   * custom widgets such as text headers, custom metrics, or any other CloudWatch
   * dashboard widgets.
   * 
   * @param widgets - One or more CloudWatch dashboard widgets to add
   * 
   * @example
   * ```ts
   * // Add a text header and a custom metric graph
   * dashboard.addWidgets(
   *   new TextWidget({
   *     markdown: '# Application Metrics',
   *     width: 24,
   *     height: 1
   *   }),
   *   new GraphWidget({
   *     title: 'Business Metrics',
   *     left: [
   *       new Metric({
   *         namespace: 'MyApp',
   *         metricName: 'TransactionCount',
   *         dimensionsMap: { Environment: 'Production' }
   *       })
   *     ],
   *     width: 12
   *   })
   * );
   * ```
   */
  public addWidgets(...widgets: IWidget[]): void {
    this.widgets.push(...widgets);
  }
}

/**
 * Type guard to check if a construct is a Lambda function.
 */
function isLambdaFunction(node: IConstruct): node is IFunction {
  return (
    node instanceof NodejsFunction ||
    node instanceof LambdaFunction ||
    (node as IFunction).functionArn !== undefined &&
    (node as IFunction).functionName !== undefined
  );
}

/**
 * Type guard to check if a construct is an SQS queue.
 */
function isQueue(node: IConstruct): node is IQueue {
  return (
    node instanceof Queue ||
    (node as IQueue).queueArn !== undefined &&
    (node as IQueue).queueName !== undefined
  );
}

/**
 * Type guard to check if a construct is a DynamoDB table.
 */
function isDynamoDBTable(node: IConstruct): node is Table {
  return (
    node instanceof Table ||
    (node as ITable).tableArn !== undefined &&
    (node as ITable).tableName !== undefined
  );
}

/**
 * Type guard to check if a construct is an API Gateway method.
 */
function isApiMethod(node: IConstruct): node is Method {
  return node instanceof Method;
}

/**
 * Type guard to check if a construct is an SNS topic.
 */
function isSnsTopic(node: IConstruct): node is ITopic {
  return (
    node instanceof Topic ||
    (node as ITopic).topicName !== undefined &&
    (node as ITopic).topicArn !== undefined
  );
}

/**
 * Type guard to check if a construct is an API Gateway REST API.
 */
function isApiGateway(node: IConstruct): node is IRestApi {
  return (
    node instanceof RestApi ||
    (node as IRestApi).restApiId !== undefined &&
    (node as IRestApi).restApiName !== undefined
  );
}
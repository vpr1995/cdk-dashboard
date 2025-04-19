import { Construct } from 'constructs';
import { IAspect, Aspects } from 'aws-cdk-lib';
import { Dashboard } from 'aws-cdk-lib/aws-cloudwatch';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { IQueue } from 'aws-cdk-lib/aws-sqs';

import { DashboardOptions } from './dashboard-options';
import { MetricFactory } from '../metrics/metric-factory';
import { ServiceMetrics } from '../metrics/service-metrics';

/**
 * An aspect that collects metrics from resources in a stack and adds them to a CloudWatch dashboard
 */
export class DashboardAspect implements IAspect {
  private readonly dashboard: Dashboard;
  private readonly options: DashboardOptions;
  private readonly metricFactory: MetricFactory;
  
  // Collections of resources by type for grouping
  private lambdaFunctions: IFunction[] = [];
  private restApis: IRestApi[] = [];
  private dynamoTables: ITable[] = [];
  private snsTopics: ITopic[] = [];
  private sqsQueues: IQueue[] = [];
  
  // Flag to indicate that we've already generated the dashboard
  private dashboardGenerated = false;

  constructor(dashboard: Dashboard, options: DashboardOptions = {}) {
    this.dashboard = dashboard;
    this.options = options;
    this.metricFactory = new MetricFactory(this.getDefaultPeriodHours());
    
    // Add a completion aspect that will be called after all other aspects
    if (options.stack) {
      Aspects.of(options.stack).add(new DashboardCompletionAspect(this));
    }
  }

  /**
   * CDK Aspect visit method - called for each construct in the stack
   */
  public visit(node: any): void {
    if (!(node instanceof Construct)) {
      return;
    }

    // Collect Lambda functions
    if (this.options.includeLambda !== false) {
      const lambdaFunction = this.tryGetResource<IFunction>(node, 'lambda.Function');
      if (lambdaFunction) {
        this.lambdaFunctions.push(lambdaFunction);
      }
    }

    // Collect API Gateway REST APIs
    if (this.options.includeApiGateway !== false) {
      const restApi = this.tryGetResource<IRestApi>(node, 'apigateway.RestApi');
      if (restApi) {
        this.restApis.push(restApi);
      }
    }

    // Collect DynamoDB tables
    if (this.options.includeDynamoDB !== false) {
      const table = this.tryGetResource<ITable>(node, 'dynamodb.Table');
      if (table) {
        this.dynamoTables.push(table);
      }
    }

    // Collect SNS topics
    if (this.options.includeSNS !== false) {
      const topic = this.tryGetResource<ITopic>(node, 'sns.Topic');
      if (topic) {
        this.snsTopics.push(topic);
      }
    }

    // Collect SQS queues
    if (this.options.includeSQS !== false) {
      const queue = this.tryGetResource<IQueue>(node, 'sqs.Queue');
      if (queue) {
        this.sqsQueues.push(queue);
      }
    }
  }

  /**
   * Generate dashboard widgets for all collected resources
   * Call this after visit() has been called for all constructs
   */
  public generateDashboard(): void {
    // Prevent duplicate generation
    if (this.dashboardGenerated) {
      return;
    }

    const serviceMetrics = new ServiceMetrics(this.metricFactory);
    
    // Add Lambda metrics if we found any Lambda functions
    if (this.lambdaFunctions.length > 0) {
      const widgets = serviceMetrics.createLambdaWidgets(this.lambdaFunctions);
      widgets.forEach(widget => this.dashboard.addWidgets(widget));
    }

    // Add API Gateway metrics if we found any REST APIs
    if (this.restApis.length > 0) {
      const widgets = serviceMetrics.createApiGatewayWidgets(this.restApis);
      widgets.forEach(widget => this.dashboard.addWidgets(widget));
    }

    // Add DynamoDB metrics if we found any tables
    if (this.dynamoTables.length > 0) {
      const widgets = serviceMetrics.createDynamoDBWidgets(this.dynamoTables);
      widgets.forEach(widget => this.dashboard.addWidgets(widget));
    }

    // Add SNS metrics if we found any topics
    if (this.snsTopics.length > 0) {
      const widgets = serviceMetrics.createSNSWidgets(this.snsTopics);
      widgets.forEach(widget => this.dashboard.addWidgets(widget));
    }

    // Add SQS metrics if we found any queues
    if (this.sqsQueues.length > 0) {
      const widgets = serviceMetrics.createSQSWidgets(this.sqsQueues);
      widgets.forEach(widget => this.dashboard.addWidgets(widget));
    }
    
    this.dashboardGenerated = true;
  }

  private getDefaultPeriodHours(): number {
    return this.options.periodHours || 3;
  }

  /**
   * Helper method to safely get a resource from a construct
   */
  private tryGetResource<T>(construct: Construct, cfnTypeName: string): T | undefined {
    try {
      // Try to get the resource interface from the construct
      const resource = construct as unknown as T;
      
      // For Lambda functions: check if it implements IFunction interface
      if (cfnTypeName === 'lambda.Function') {
        // This will catch NodejsFunction, PythonFunction and other higher-level constructs
        // that implement the IFunction interface
        const lambdaProps = (construct as any).functionName;
        if (lambdaProps !== undefined) {
          return resource;
        }
      }
      
      // For API Gateway: check if it implements IRestApi interface
      if (cfnTypeName === 'apigateway.RestApi') {
        const apiProps = (construct as any).restApiId || (construct as any).restApiName;
        if (apiProps !== undefined) {
          return resource;
        }
      }
      
      // For DynamoDB: check if it implements ITable interface
      if (cfnTypeName === 'dynamodb.Table') {
        const tableProps = (construct as any).tableName || (construct as any).tableArn;
        if (tableProps !== undefined) {
          return resource;
        }
      }
      
      // For SNS: check if it implements ITopic interface
      if (cfnTypeName === 'sns.Topic') {
        const topicProps = (construct as any).topicName || (construct as any).topicArn;
        if (topicProps !== undefined) {
          return resource;
        }
      }
      
      // For SQS: check if it implements IQueue interface
      if (cfnTypeName === 'sqs.Queue') {
        const queueProps = (construct as any).queueName || (construct as any).queueUrl;
        if (queueProps !== undefined) {
          return resource;
        }
      }
      
      // Fallback to the original name-based checks
      // Check if the construct is of the type we're looking for using constructor name
      if (construct.node.defaultChild && 
          construct.node.defaultChild.constructor.name.includes(cfnTypeName)) {
        return resource;
      }

      // For cases where the construct directly represents the resource
      if (construct.constructor.name.includes(cfnTypeName)) {
        return resource;
      }
    } catch (e) {
      // If there's an error, just return undefined
      return undefined;
    }
    
    return undefined;
  }
}

/**
 * A helper aspect that ensures the dashboard is generated after all resources have been visited
 */
class DashboardCompletionAspect implements IAspect {
  private readonly dashboardAspect: DashboardAspect;
  
  constructor(dashboardAspect: DashboardAspect) {
    this.dashboardAspect = dashboardAspect;
  }
  
  public visit(node: any): void {
    // We only need to trigger the dashboard generation once at the stack level
    if (node.node && node.node.scope === undefined) {
      // This is a top-level node (likely the stack), so generate the dashboard
      this.dashboardAspect.generateDashboard();
    }
  }
}
import { Construct } from 'constructs';
import { Aspects, Stack } from 'aws-cdk-lib';
import { Dashboard } from 'aws-cdk-lib/aws-cloudwatch';

import { DashboardAspect } from './dashboard/dashboard-aspect';
import { DashboardOptions } from './dashboard/dashboard-options';

/**
 * Main construct for creating CloudWatch dashboards for AWS CDK stacks
 */
export class CdkDashboard extends Construct {
  /** The CloudWatch dashboard resource */
  public readonly dashboard: Dashboard;
  
  /** The aspect that collects metrics from resources */
  private readonly dashboardAspect: DashboardAspect;

  /**
   * Creates a new CDK Dashboard
   * 
   * @param scope The construct scope
   * @param id The construct ID
   * @param options The dashboard options
   */
  constructor(scope: Construct, id: string, options: DashboardOptions = {}) {
    super(scope, id);

    // Create the CloudWatch dashboard
    this.dashboard = new Dashboard(this, 'Dashboard', {
      dashboardName: options.dashboardName,
    });

    // Create the aspect that will collect metrics
    this.dashboardAspect = new DashboardAspect(this.dashboard, options);

    // Apply the aspect to the stack if one is provided
    if (options.stack) {
      Aspects.of(options.stack).add(this.dashboardAspect);
    }
  }

  /**
   * Applies the dashboard aspect to a stack
   * 
   * @param stack The stack to apply the dashboard to
   */
  public addToStack(stack: Stack): void {
    Aspects.of(stack).add(this.dashboardAspect);
  }
}

// Export all relevant types
export * from './dashboard/dashboard-options';
export * from './dashboard/dashboard-aspect';
export * from './metrics/metric-factory';
export * from './metrics/service-metrics';
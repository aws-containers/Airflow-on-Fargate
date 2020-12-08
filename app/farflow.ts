import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import cdk = require('@aws-cdk/core');
import {RDSConstruct} from "./constructs/rds";
import {AirflowConstruct} from "./constructs/airflow-construct";
import { DagTasks } from './constructs/dag-tasks';

class FarFlow extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Fargate Cluster
    // NOTE: Limit AZs to avoid reaching resource quotas
    let vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });
    cdk.Tags.of(scope).add("Stack", "FarFlow");

    let cluster = new ecs.Cluster(this, 'ECSCluster', { vpc: vpc });

    // Setting default SecurityGroup to use across all the resources
    let defaultVpcSecurityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {vpc: vpc});

    // Create RDS instance for Airflow backend
    const rds = new RDSConstruct(this, "RDS-Postgres", {
      defaultVpcSecurityGroup: defaultVpcSecurityGroup,
      vpc: vpc
    });

    // Create Airflow service: Webserver, Scheduler and minimal Worker
    new AirflowConstruct(this, "AirflowService", {
      cluster: cluster,
      vpc: vpc,
      dbConnection: rds.dbConnection,
      defaultVpcSecurityGroup: defaultVpcSecurityGroup,
      privateSubnets: vpc.privateSubnets
    });

    // Create TaskDefinitions for on-demand Fargate tasks, invoked from DAG
    new DagTasks(this, "DagTasks", {
      vpc: vpc,
      defaultVpcSecurityGroup: defaultVpcSecurityGroup
    });
  }
}

const app = new cdk.App();

new FarFlow(app, 'FarFlow');

app.synth();

import {CfnOutput, Construct} from "@aws-cdk/core";
import { IVpc } from "@aws-cdk/aws-ec2";

import ecs = require('@aws-cdk/aws-ecs');
import ec2 = require("@aws-cdk/aws-ec2");
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { FargateTaskDefinition } from '@aws-cdk/aws-ecs';

import {airflowTaskConfig, ContainerConfig} from "../config";
import { ServiceConstruct } from "./service-construct";
import { v4 as uuidv4 } from 'uuid';


export interface AirflowConstructProps {
  readonly vpc: IVpc;
  readonly cluster: ecs.ICluster;
  readonly dbConnection: string;
  readonly defaultVpcSecurityGroup: ec2.ISecurityGroup;
  readonly privateSubnets: ec2.ISubnet[];
}

export class AirflowConstruct extends Construct {
  public readonly adminPasswordOutput?: CfnOutput;

  constructor(parent: Construct, name: string, props: AirflowConstructProps) {
    super(parent, name);

    const adminPassword = uuidv4();

    const ENV_VAR = {
      AIRFLOW__CORE__SQL_ALCHEMY_CONN: props.dbConnection,
      AIRFLOW__CELERY__BROKER_URL: "sqs://",
      AIRFLOW__CELERY__RESULT_BACKEND: "db+" + props.dbConnection,
      AIRFLOW__CORE__EXECUTOR: "CeleryExecutor",
      AIRFLOW__WEBSERVER__RBAC: "True",
      ADMIN_PASS: adminPassword,
      CLUSTER: props.cluster.clusterName,
      SECURITY_GROUP: props.defaultVpcSecurityGroup.securityGroupId,
      SUBNETS: props.privateSubnets.map(subnet => subnet.subnetId).join(",")
    };

    const logging = new ecs.AwsLogDriver({
      streamPrefix: 'FarFlowLogging',
      logRetention: airflowTaskConfig.logRetention
    });

    // Build Airflow docker image from Dockerfile
    const airflowImageAsset = new DockerImageAsset(this, 'AirflowBuildImage', {
      directory: './airflow',
    });

    const airflowTask = new FargateTaskDefinition(this, 'AirflowTask', {
      cpu: airflowTaskConfig.cpu,
      memoryLimitMiB: airflowTaskConfig.memoryLimitMiB
    });

    let workerTask = airflowTask;
    if (airflowTaskConfig.createWorkerPool) {
      workerTask = new FargateTaskDefinition(this, 'WorkerTask', {
        cpu: airflowTaskConfig.cpu,
        memoryLimitMiB: airflowTaskConfig.memoryLimitMiB
      });
    }

    let mmap = new Map();
    mmap.set(airflowTaskConfig.webserverConfig, airflowTask);
    mmap.set(airflowTaskConfig.schedulerConfig, airflowTask);
    mmap.set(airflowTaskConfig.workerConfig, workerTask);

    // Add containers to corresponding Tasks
    for (let entry of mmap.entries()) {
      let containerInfo: ContainerConfig = entry[0];
      let task: FargateTaskDefinition = entry[1];

      task.addContainer(containerInfo.name, {
        image: ecs.ContainerImage.fromDockerImageAsset(airflowImageAsset),
        logging: logging,
        environment: ENV_VAR,
        entryPoint: [containerInfo.entryPoint],
        cpu: containerInfo.cpu,
        memoryLimitMiB: containerInfo.cpu
      }).addPortMappings({
        containerPort: containerInfo.containerPort
      });
    }

    new ServiceConstruct(this, "AirflowService", {
      cluster: props.cluster,
      defaultVpcSecurityGroup: props.defaultVpcSecurityGroup,
      vpc: props.vpc,
      taskDefinition: airflowTask,
      isWorkerService: false
    });

    if (airflowTaskConfig.createWorkerPool) {
      new ServiceConstruct(this, "WorkerService", {
        cluster: props.cluster,
        defaultVpcSecurityGroup: props.defaultVpcSecurityGroup,
        vpc: props.vpc,
        taskDefinition: workerTask,
        isWorkerService: true
      });
    }

    this.adminPasswordOutput = new CfnOutput(this, 'AdminPassword', {
      value: adminPassword
    });
  }
}

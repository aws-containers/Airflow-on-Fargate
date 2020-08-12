import { DBConfig } from "./constructs/rds";
import {InstanceClass, InstanceSize, InstanceType} from "@aws-cdk/aws-ec2";
import { RetentionDays } from "@aws-cdk/aws-logs";

export interface AirflowTaskConfig {
  readonly cpu: number;
  readonly memoryLimitMiB: number;
  readonly webserverConfig: ContainerConfig;
  readonly schedulerConfig: ContainerConfig;
  readonly workerConfig: ContainerConfig;
  readonly logRetention: RetentionDays;
  readonly createWorkerPool?: boolean;
}

export interface AutoScalingConfig {
  readonly maxTaskCount: number;
  readonly minTaskCount: number;
  readonly cpuUsagePercent?: number;
  readonly memUsagePercent?: number;
}

export interface ContainerConfig {
  readonly name: string;
  readonly cpu?: number;
  readonly memoryLimitMiB?: number;
  readonly containerPort: number;
  readonly entryPoint: string;
}

export const workerAutoScalingConfig: AutoScalingConfig = {
  minTaskCount: 1,
  maxTaskCount: 5,
  cpuUsagePercent: 70
};

export const defaultWebserverConfig: ContainerConfig = {
  name: "WebserverContainer",
  containerPort: 8080,
  entryPoint: "/webserver_entry.sh"
}

export const defaultSchedulerConfig: ContainerConfig = {
  name: "SchedulerContainer",
  containerPort: 8081,
  entryPoint: "/scheduler_entry.sh"
}

export const defaultWorkerConfig: ContainerConfig = {
  name: "WorkerContainer",
  containerPort: 8082,
  entryPoint: "/worker_entry.sh"
}

export const airflowTaskConfig: AirflowTaskConfig = {
  cpu: 2048,
  memoryLimitMiB: 4096,
  webserverConfig: defaultWebserverConfig,
  schedulerConfig: defaultSchedulerConfig,
  workerConfig: defaultWorkerConfig,
  logRetention: RetentionDays.ONE_MONTH,
  // Uncomment this to have dedicated worker pool that can be auto-scaled as per workerAutoScalingConfig
  // createWorkerPool: true  
};

export const defaultDBConfig: DBConfig = {
  dbName: "farflow",
  port: 5432,
  masterUsername: "airflow",
  instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.SMALL),
  allocatedStorageInGB: 25,
  backupRetentionInDays: 30
};


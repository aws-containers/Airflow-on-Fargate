import { Construct } from "@aws-cdk/core";
import { AwsLogDriver } from "@aws-cdk/aws-ecs";
import { RetentionDays } from "@aws-cdk/aws-logs";

import { AirflowDagTaskDefinition } from "./task-construct"

export class DagTasks extends Construct {

  constructor(
    scope: Construct,
    taskName: string,
  ) {
    super(scope, taskName + "-TaskConstruct");

    const logging = new AwsLogDriver({ 
      streamPrefix: 'FarFlowDagTaskLogging',
      logRetention: RetentionDays.ONE_MONTH
    });

    // Task Container with multiple python executables
    new AirflowDagTaskDefinition(this, 'FarFlowCombinedTask', {
      containerInfo: {
        assetDir: "./tasks/multi_task",
        name: "MultiTaskContainer"
      },
      cpu: 512,
      memoryLimitMiB: 1024,
      taskFamilyName: "FarFlowCombinedTask",
      logging: logging
    });

    // Task Container with single python executable
    new AirflowDagTaskDefinition(this, 'FarFlowNumbersTask', {
      containerInfo: {
        assetDir: "./tasks/number_task",
        name: "NumbersContainer"
      },
      cpu: 256,
      memoryLimitMiB: 512,
      taskFamilyName: "FarFlowNumbersTask",
      logging: logging
    });
  }
}

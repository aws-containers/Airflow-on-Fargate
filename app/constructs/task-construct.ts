import { Construct } from "@aws-cdk/core";

import ecs = require('@aws-cdk/aws-ecs');
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { FargateTaskDefinition } from '@aws-cdk/aws-ecs';

export interface AirflowDagTaskDefinitionProps {
  readonly taskFamilyName: string;
  readonly containerInfo: ContainerInfo;
  readonly cpu: number;
  readonly memoryLimitMiB: number;
  readonly logging: ecs.LogDriver;
}

export interface ContainerInfo {
  readonly name: string;
  readonly assetDir: string;
}

export class AirflowDagTaskDefinition extends Construct {

  constructor(
    scope: Construct,
    taskName: string,
    props: AirflowDagTaskDefinitionProps
  ) {
    super(scope, taskName + "-TaskConstruct");

    // Create a new task with given requirements
    const workerTask = new FargateTaskDefinition(this, taskName + '-TaskDef', {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      family: props.taskFamilyName
    });

    const workerImageAsset = new DockerImageAsset(this, props.containerInfo.name + '-BuildImage', {
      directory: props.containerInfo.assetDir,
    });

    workerTask.addContainer(props.containerInfo.name, {
      image: ecs.ContainerImage.fromDockerImageAsset(workerImageAsset),
      logging: props.logging
    });
    
  }
}

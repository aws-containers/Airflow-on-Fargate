import { Construct } from "@aws-cdk/core";

import ecs = require('@aws-cdk/aws-ecs');
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { FargateTaskDefinition } from '@aws-cdk/aws-ecs';
import {ManagedPolicy} from "@aws-cdk/aws-iam";

export interface AirflowDagTaskDefinitionProps {
  readonly taskFamilyName: string;
  readonly containerInfo: ContainerInfo;
  readonly cpu: number;
  readonly memoryLimitMiB: number;
  readonly logging: ecs.LogDriver;
  readonly efsVolumeInfo?: EfsVolumeInfo;
}

export interface ContainerInfo {
  readonly name: string;
  readonly assetDir: string;
}

export interface EfsVolumeInfo {
  readonly volumeName: string;
  readonly efsFileSystemId: string;
  readonly containerPath: string;
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

    if (props.efsVolumeInfo) {
      workerTask.addVolume({
        name: props.efsVolumeInfo.volumeName,
        efsVolumeConfiguration: {
          fileSystemId: props.efsVolumeInfo.efsFileSystemId
        }
      });

      workerTask.taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticFileSystemClientReadWriteAccess"));
    }

    const workerImageAsset = new DockerImageAsset(this, props.containerInfo.name + '-BuildImage', {
      directory: props.containerInfo.assetDir,
    });

    let container = workerTask.addContainer(props.containerInfo.name, {
      image: ecs.ContainerImage.fromDockerImageAsset(workerImageAsset),
      logging: props.logging
    });

    if (props.efsVolumeInfo) {
      container.addMountPoints({
        containerPath: props.efsVolumeInfo.containerPath,
        sourceVolume: props.efsVolumeInfo.volumeName,
        readOnly: false
      });
    }
  }
}

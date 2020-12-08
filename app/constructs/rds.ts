import { Duration, Construct } from "@aws-cdk/core";
import {
  DatabaseInstance,
  DatabaseInstanceEngine, PostgresEngineVersion,
  StorageType
} from "@aws-cdk/aws-rds";
import { ISecret, Secret } from "@aws-cdk/aws-secretsmanager";
import {
  InstanceType,
  ISecurityGroup,
  IVpc,
  SubnetType
} from "@aws-cdk/aws-ec2";

import { defaultDBConfig } from "../config";

export interface DBConfig {
  readonly dbName: string;
  readonly masterUsername: string;
  readonly port: number;
  readonly instanceType: InstanceType;
  readonly allocatedStorageInGB: number;
  readonly backupRetentionInDays: number;
}

export interface RDSConstructProps {
  readonly vpc: IVpc;
  readonly defaultVpcSecurityGroup: ISecurityGroup;
  readonly dbConfig?: DBConfig;
}

export class RDSConstruct extends Construct {
  public readonly dbConnection: string;
  public readonly rdsInstance: DatabaseInstance;

  constructor(parent: Construct, name: string, props: RDSConstructProps) {
    super(parent, name);

    const backendSecret: ISecret = new Secret(this, "DatabseSecret", {
      secretName: name + "Secret",
      description: "airflow RDS secrets",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: defaultDBConfig.masterUsername
        }),
        generateStringKey: "password",
        excludeUppercase: false,
        requireEachIncludedType: false,
        includeSpace: false,
        excludePunctuation: true,
        excludeLowercase: false,
        excludeNumbers: false,
        passwordLength: 16
      }
    });

    const databasePasswordSecret = backendSecret.secretValueFromJson(
      "password"
    );

    this.rdsInstance = new DatabaseInstance(this, "RDSInstance", {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_12_4
      }),
      instanceType: defaultDBConfig.instanceType,
      instanceIdentifier: defaultDBConfig.dbName,
      vpc: props.vpc,
      securityGroups: [props.defaultVpcSecurityGroup],
      vpcPlacement: { subnetType: SubnetType.PRIVATE },
      storageEncrypted: true,
      multiAz: false,
      autoMinorVersionUpgrade: false,
      allocatedStorage: defaultDBConfig.allocatedStorageInGB,
      storageType: StorageType.GP2,
      backupRetention: Duration.days(defaultDBConfig.backupRetentionInDays),
      deletionProtection: false,
      credentials: {
        username: defaultDBConfig.masterUsername,
        password: databasePasswordSecret
      },
      databaseName: defaultDBConfig.dbName,
      port: defaultDBConfig.port
    });

    this.dbConnection = this.getDBConnection(
      defaultDBConfig,
      this.rdsInstance.dbInstanceEndpointAddress,
      databasePasswordSecret.toString()
    );
  }

  public getDBConnection(
    dbConfig: DBConfig,
    endpoint: string,
    password: string
  ): string {
    return `postgresql+pygresql://${dbConfig.masterUsername}:${password}@${endpoint}:${dbConfig.port}/${dbConfig.dbName}`;
  }
}

import { Construct } from "@aws-cdk/core";
import { IManagedPolicy, ManagedPolicy, PolicyStatement } from "@aws-cdk/aws-iam";

export class PolicyConstruct extends Construct {
    public readonly policyStatements?: PolicyStatement[];
    public readonly managedPolicies?: IManagedPolicy[];

    constructor(app: Construct, name: string,) {
        super(app, name);

        // Both managed policies and policy statements will be attached to Task Role of Airflow Instance
        this.managedPolicies = [
            ManagedPolicy.fromAwsManagedPolicyName("AmazonSQSFullAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticFileSystemClientReadWriteAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsReadOnlyAccess")
        ];

        /*
          You can add custom Policy Statements as well. 
          Sample code for SQS and IAM Full Access would like like:

          this.policyStatements = [
            new PolicyStatement({
                actions: ["sqs:*"],
                effect: Effect.ALLOW,
                resources: ["*"]
            }),
            new PolicyStatement({
                actions: ["iam:*"],
                effect: Effect.ALLOW,
                resources: ["*"]
            })
          ]
        */
    }
}
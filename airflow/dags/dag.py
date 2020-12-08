import os
import sys
from datetime import datetime
from datetime import timedelta
from pprint import pprint

from airflow import DAG

from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import PythonOperator
from airflow.contrib.operators.ecs_operator import ECSOperator

DAG_NAME = 'Test_Dag'

default_args = {
    'owner': 'CM',
    'start_date': datetime(2019, 6, 8),
    'email': ['xyz@amazon.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=1)
}


def get_ecs_operator_args(taskDefinitionName, taskContainerName, entryFile, param):
    return dict(
        launch_type="FARGATE",
        # The name of your task as defined in ECS
        task_definition=taskDefinitionName,
        platform_version="1.4.0",
        # The name of your ECS cluster
        cluster=os.environ['CLUSTER'],
        network_configuration={
            'awsvpcConfiguration': {
                'securityGroups': [os.environ['SECURITY_GROUP']],
                'subnets': os.environ['SUBNETS'].split(","),
                'assignPublicIp': "DISABLED"
            }
        },
        overrides={
            'containerOverrides': [
                {
                    'name': taskContainerName,
                    'command': ["python", entryFile, param]
                }
            ]
        },
        awslogs_group="FarFlowDagTaskLogs",
        awslogs_stream_prefix="FarFlowDagTaskLogging/"+taskContainerName
    )

oddTaskConfig = {
  'taskDefinitionName': 'FarFlowCombinedTask',
  'taskContainerName': 'MultiTaskContainer',
  'entryFile': 'odd_numbers.py',
  'param': '10'
}
evenTaskConfig = {
  'taskDefinitionName': 'FarFlowCombinedTask',
  'taskContainerName': 'MultiTaskContainer',
  'entryFile': 'even_numbers.py',
  'param': '10'
}
numbersTaskConfig = {
  'taskDefinitionName': 'FarFlowNumbersTask',
  'taskContainerName': 'NumbersContainer',
  'entryFile': 'numbers.py',
  'param': '10'
}

oddTask_args = get_ecs_operator_args(**oddTaskConfig)
evenTask_args = get_ecs_operator_args(**evenTaskConfig)
numbersTask_args = get_ecs_operator_args(**numbersTaskConfig)

dag = DAG( DAG_NAME,
          schedule_interval=None,
          default_args=default_args)

start_process = DummyOperator(task_id="start_process", dag=dag)

# Following tasks will get triggered from worker and runs on OnDemand Fargate Task
odd_task = ECSOperator(task_id="odd_task", **oddTask_args, dag=dag)
even_task = ECSOperator(task_id="even_task", **evenTask_args, dag=dag)
numbers_task = ECSOperator(task_id="numbers_task", **numbersTask_args, dag=dag)


# [START howto_operator_python]
# Pulled from : https://github.com/apache/airflow/blob/master/airflow/example_dags/example_python_operator.py#L40
def print_context(ds, **kwargs):
    """Print the Airflow context and ds variable from the context."""
    pprint(kwargs)
    print(ds)
    return 'Whatever you return gets printed in the logs'


task_config = {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3",
    "key4": "value4"
}

on_worker_task = PythonOperator(
    task_id='runs_on_worker',
    python_callable=print_context,
    dag=dag,
    op_args=[task_config]
)
# [END howto_operator_python]


start_process >> [odd_task, even_task] >> numbers_task >> on_worker_task

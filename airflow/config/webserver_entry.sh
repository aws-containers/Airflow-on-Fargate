#!/usr/bin/env bash

set -Eeuxo pipefail
airflow db init
sleep 5

airflow users create -r Admin -u admin -f FirstName -l LastName -p ${ADMIN_PASS} -e admin@test.com
sleep 5

airflow webserver
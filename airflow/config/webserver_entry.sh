#!/usr/bin/env bash

set -Eeuxo pipefail

airflow initdb
sleep 5
airflow webserver
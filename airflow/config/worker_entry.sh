#!/usr/bin/env bash

set -Eeuxo pipefail

sleep 30
airflow celery worker
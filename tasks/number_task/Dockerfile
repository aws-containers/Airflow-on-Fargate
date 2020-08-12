FROM python:3.8-slim

ENV USER_HOME=/usr/local/farflow
COPY . ${USER_HOME}/app
WORKDIR ${USER_HOME}/app

CMD ["python","numbers.py", '10']
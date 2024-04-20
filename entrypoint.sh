#!/bin/bash

function checkEnv() {
	envName=$1
	envValue=$2
	val=$(eval echo "\$$envName")
	if [ "x$val" = "x" ]; then
		export $envName=$envValue
	fi
}

params="$@"
if [ "x$params" = "xwait" ]; then
	checkEnv RABBITMQ_PORT 5672
	checkEnv RABBITMQ_HOST rabbitmq
	node tools/wait.js $RABBITMQ_HOST $RABBITMQ_PORT

	if [ "x$NODE_ENV" = "xproduction" ] || [ "x$NODE_ENV" = "xqa" ]; then
		while true; do
			date
			npm start
			sleep 300
		done
	else
		echo NODE_ENV já definido: $NODE_ENV
		npm run $NODE_ENV
	fi
else
	echo Executando comando: $@
	$@
fi
sleep 60

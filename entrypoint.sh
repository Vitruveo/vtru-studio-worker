#!/bin/sh

if [ "x$@" = "xwait" ] ; then
    if [ "x$RABBITMQ_PORT" = "x" ] ; then
        export RABBITMQ_PORT=5672
    fi
    if [ "x$RABBITMQ_HOST" = "x" ] ; then
        echo RABBITMQ_HOST não definido
    else
        node tools/wait.js $RABBITMQ_HOST $RABBITMQ_PORT
    fi
    if [ "x$NODE_ENV" = "xproduction" ] ; then
        while true ; do
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

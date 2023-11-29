#!/bin/sh

if [ "x$@" = "xwait" ] ; then
    if [ "x$MONGO_PORT" = "x" ] ; then
        export MONGO_PORT=27017
    fi
    if [ "x$REDIS_PORT" = "x" ] ; then
        export REDIS_PORT=6379
    fi
    if [ "x$RABBITMQ_PORT" = "x" ] ; then
        export RABBITMQ_PORT=5672
    fi

    if [ "x$MONGO_HOST" = "x" ] ; then
        echo MONGO_HOST não definido
    else
        node tools/wait.js $MONGO_HOST $MONGO_PORT
    fi
    if [ "x$REDIS_HOST" = "x" ] ; then
        echo REDIS_HOST não definido
    else
        node tools/wait.js $REDIS_HOST $REDIS_PORT
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

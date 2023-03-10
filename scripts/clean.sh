#!/bin/bash

BOT_IMAGE=devbot-bot
WEB_IMAGE=devbot-web

# Remove saved images
rm *.tar 2>/dev/null

# Stop and remove running containers
docker stop $(docker ps -aq --filter ancestor=$BOT_IMAGE) 2>/dev/null
docker stop $(docker ps -aq --filter ancestor=$WEB_IMAGE) 2>/dev/null

docker rm $(docker ps -aq --filter ancestor=$BOT_IMAGE) 2>/dev/null
docker rm $(docker ps -aq --filter ancestor=$WEB_IMAGE) 2>/dev/null

# Remove images
docker rmi $BOT_IMAGE 2>/dev/null
docker rmi $WEB_IMAGE 2>/dev/null

# docker system prune -a

exit 0
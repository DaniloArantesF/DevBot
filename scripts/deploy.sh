#!/bin/bash

# Get current absolute path
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

if [ -z "$1" ] || [ -z "$2" ]
  then
    echo "Usage: $0 <remote_address> <pem_file>"
    exit 1
fi

# Clean up & Rebuild
echo "Rebuilding..."
$(. $SCRIPTPATH/clean.sh 2>/dev/null)
. $SCRIPTPATH/build.sh

REMOTE_DIR="/root/DevBot/"
REMOTE_ADDRESS=$1
PEM_FILE=$2

IMAGES=("devbot-bot" "devbot-web" "devbot-pocketbase")
echo $IMAGES

# Save images
for IMAGE in "${IMAGES[@]}"
  do
    echo "Saving $IMAGE..."
    docker save $IMAGE -o $IMAGE.tar

    scp -i $PEM_FILE $IMAGE.tar root@$REMOTE_ADDRESS:$REMOTE_DIR
    ssh -i $PEM_FILE root@$REMOTE_ADDRESS "docker load -i $REMOTE_DIR/$IMAGE.tar"
  done


#!/bin/bash

#start the container and update the repository from github
echo "Docker deploy is go..."
docker start -ai container23 <<'EOF'
  source ~/.nvm/nvm.sh
  nvm install 20
  cd /code/cold3
  git stash
  git pull
  yarn install
  yarn seal
  yarn test
  cd net23
  yarn build
  touch done.txt
EOF

#wait for serverless framework to finish packaging
echo "Building..."
while ! docker exec container23 test -f /code/cold3/net23/done.txt; do
  sleep 1
done

#copy files out of the container
echo "Copying files out..."
rm -rf .serverless
docker cp container23:/code/cold3/net23/.serverless .serverless
docker cp container23:/code/cold3/wrapper.txt ../wrapper.txt
docker cp container23:/code/cold3/icarus/wrapper.js ../icarus/wrapper.js
docker exec container23 rm /code/cold3/net23/done.txt
docker stop container23

#deploy outside
echo "Back outside, deploying..."
yarn deploypackage

echo "Docker deploy complete and sustainably whaled--you should do a git commit!"

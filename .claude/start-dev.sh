#!/bin/bash
export PATH="/Users/jardel/.nvm/versions/node/v24.14.0/bin:$PATH"
cd /Users/jardel/Dev/nuchallenge
exec node node_modules/.bin/next dev --port 3001

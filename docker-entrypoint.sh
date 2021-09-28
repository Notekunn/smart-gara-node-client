#!/bin/sh

echo "DB Sync"
prisma db push
echo "Run app"
node build/app
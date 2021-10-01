#!/bin/sh

echo "DB Sync"
prisma db push --skip-generate
echo "Run app"
node build/app
#!/bin/sh
modprobe sg

eval $(ssh-agent)

rm -rf /var/run/docker 2>/dev/null || true
rm -f /var/run/docker.sock 2>/dev/null || true
rm -f /var/run/docker.pid 2>/dev/null || true

dockerd &

echo 'Access REPL console by entering autokit container and doing "node ./build/repl.js"' 

sleep infinity

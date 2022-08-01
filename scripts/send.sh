#!/bin/sh

while getopts u:n:d: flag
do
    case "${flag}" in
        u) uuid=${OPTARG};;
        n) username=${OPTARG};;
        d) directory=${OPTARG};;
    esac
done

# get the container ID (or just the path to the volume)
volume=`ssh ${username}@ssh.balena-devices.com -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q host ${uuid} ls /var/lib/docker/volumes/ | grep core`
echo "Volume is ${volume}"

rsync -ar -vvv --whole-file --progress -e "ssh ${username}@ssh.balena-devices.com -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q host ${uuid}" ${directory}/ :/var/lib/docker/volumes/${volume}/_data
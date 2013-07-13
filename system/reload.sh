#!/bin/bash

MODULE_DIR="/usr/local/Cellar/prosody/0.8.2/lib/prosody/modules"
CFG_DIR="/usr/local/Cellar/prosody/0.8.2/etc/prosody"

cp mod_web_presence.lua $MODULE_DIR
cp mod_bosh.lua  $MODULE_DIR
cp mod_carbons.lua  $MODULE_DIR
cp prosody.cfg.lua $CFG_DIR 

#sudo kill -9 `sudo prosodyctl status | g PID | awk '{print $6}'`
prosodyctl restart > /dev/null &

echo '' > prosody.log
echo '' > prosody.err
echo '' > prosody.debug


#echo module\:unload\(\"web_presence\"\) | nc localhost 5582
#sleep 1;
#echo module\:load\(\"web_presence\"\) | nc localhost 5582
#echo module\:reload\(\"web_presence\"\) | nc localhost 5582
#for FILE in $(`ls mod_*`) do echo module\:reload\(\"$file\",\"localhost\"\) 
#for FILE in $(ls mod_*); do echo $FILE | nc localhost 5582
#done;

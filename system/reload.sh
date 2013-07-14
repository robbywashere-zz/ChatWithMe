#!/bin/bash

MODULE_DIR="/usr/local/Cellar/prosody/0.8.2/lib/prosody/modules"
CFG_DIR="/usr/local/Cellar/prosody/0.8.2/etc/prosody"

cp mod_web_presence.lua $MODULE_DIR
cp mod_bosh.lua  $MODULE_DIR
cp mod_carbons.lua  $MODULE_DIR
cp mod_register_json.lua $MODULE_DIR

cp prosody.cfg.lua $CFG_DIR 


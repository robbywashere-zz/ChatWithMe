INSTALL
===========

First Install prosody:
---------------------
This project was built to work with 0.8, it should be forward compatible
For information on installing prosody for your OS go here:

http://prosody.im/doc/install


Replace existing modules and configuration:
------------------------
Replace existing module files with the new modules located in the system directory:

Backup, version control, or rename the existing ones.

The names of the files are: mod_web_presence.lua, mod_bosh.lua, mod_carbons.lua, prosody.cfg.lua

To find the location of your current prosody modules and config file try:

head -n20 \`which prosodyctl\`

Look for value of CFG_DATADIR for the config file, CFG_PLUGINDIR will be the module location



To run:
---------------------------

$> sudo prosodyctl start

Then navigate your browser to http://localhost:8080


Note:
----------------

Also maybe try grep'n for 'Robby' as I hardcoded my name into the html ;)

This configuration runs as root, this should not be done beyond local development

INSTALL
===========

First Install prosody:
---------------------
This project was built to work with 0.8, it should be forward compatible
For information on installing prosody for your OS go here:

http://prosody.im/doc/install




Modify Configuration:
------------------------

In prosody.cfg.lua set `http_path` to the ../www folder location of this project - $> cd www; pwd

Set support\_contact to the JID of the account which the users will be communicating with

Set support\_nick to the name which will be displayed for the user or the nickname of the support account


Replace existing modules and configuration:
------------------------
Replace existing module files with the new modules located in the system directory:

Backup, version control, or rename the existing ones.

The names of the files are: mod\_web\_presence.lua, mod\_register\_json.lua, mod\_bosh.lua, mod\_carbons.lua, prosody.cfg.lua

To find the location of your current prosody modules and config file try:

 $> head -n20 \`which prosodyctl\` 

Look for value of CFG\_DATADIR for the config file, CFG\_PLUGINDIR will be the module location




To run:
---------------------------

$> sudo prosodyctl start

Then navigate your browser to http://localhost:8080


Note:
----------------

This configuration runs as root, this should not be done beyond local development

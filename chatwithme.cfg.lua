

--<ChatWithMe.cfg> -- Do not remove this line

pidfile = "/var/run/prosody.pid" -- this is the default on Debian

---------- Support contact --------
support_contact_nick = { 'support' }; -- support@<hostname>


------------ BOSH Servlet ----------
bosh_ports = {
  {
    port = 8080;
    path = "xmpp-httpbind";
  }
}

---- JSON Registration Servlet ----
register_json_ports = { 
  { 
    port = 8080;
    path = "register";
  }
}

------------ HTTP Servlet ----------
http_ports = { 8080 }
http_path = "/Users/robby/Projects/chatwithme/system/www"





--<ChatWithMe.cfg> -- Do not remove this line

---------- Inband Registration ------------
allow_registration = true


---------- Support contact --------
support_contact_nick = { 'support' }; 


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

http_path = "/Users/robby/Projects/chatwithme/www"

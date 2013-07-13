-- Expose a simple servlet to handle user registrations from web pages
-- via JSON.
--
-- A Good chunk of the code is from mod_data_access.lua by Kim Alvefur
-- aka Zash.

local jid_prep = require "util.jid".prep
local jid_split = require "util.jid".split
local usermanager = require "core.usermanager"
local b64_decode = require "util.encodings".base64.decode
local json_decode = require "util.json".decode
local httpserver = require "net.httpserver"
local os_time = os.time
local nodeprep = require "util.encodings".stringprep.nodeprep

module.host = "*" -- HTTP/BOSH Servlets need to be global.


-- Pick up configuration.


local allow_registration = module:get_option_boolean("allow_registration", false)

local set_realm_name = module:get_option_string("reg_servlet_realm", "Restricted")
local throttle_time = module:get_option_number("reg_servlet_time", nil)
local whitelist = module:get_option_set("reg_servlet_wl", {})
local blacklist = module:get_option_set("reg_servlet_bl", {})
local ports = module:get_option_array("reg_servlet_ports", {{ port = 9280 }})
local recent_ips = {}

-- Begin

local function http_response(code, message, extra_headers)
  local response = {
    status = code .. " " .. message,
    body = message .. "\n" }
    if extra_headers then response.headers = extra_headers end
    return response
  end


  local function handle_req(method, body, request)

    if request.method ~= "POST" then
      return http_response(405, "Bad method...", {["Allow"] = "POST"})
    end

    if not allow_registration then
      if not request.headers["authorization"] then
        return http_response(401, "No... No...", {["WWW-Authenticate"]='Basic realm="'.. set_realm_name ..'"'})
      end

      local user, password = b64_decode(request.headers.authorization:match("[^ ]*$") or ""):match("([^:]*):(.*)")
      user = jid_prep(user)
      if not user or not password then return http_response(400, "What's this..?") end
      local user_node, user_host = jid_split(user)
      if not hosts[user_host] then return http_response(401, "Negative.") end

      module:log("warn", "%s is authing to submit a new user registration data", user)
      if not usermanager.test_password(user_node, user_host, password) then
        module:log("warn", "%s failed authentication", user)
        return http_response(401, "Who the hell are you?! Guards!")
      end

    else 
      user = request.handler:ip()
    end


    local req_body
    -- We check that what we have is valid JSON wise else we throw an error...
    if not pcall(function() req_body = json_decode(body) end) then
    module:log("debug", "JSON data submitted for user registration by %s failed to Decode.", user)
    return http_response(400, "JSON Decoding failed.")
  else

    -- Decode JSON data and check that all bits are there else throw an error


    req_body = json_decode(body)
    req_body["ip"] = request.handler:ip()



    -- Check if user exists
    if allow_registration then
      if req_body["exists"] and req_body["host"] then
        local username = nodeprep(req_body["exists"])
        local host = nodeprep(req_body["host"])
        if not usermanager.user_exists(username, host) then
          return http_response(202, "Ok")
        else
          return http_response(409, "User already exists")
        end
      end
    end


    if req_body["username"] == nil or req_body["password"] == nil or req_body["host"] == nil or req_body["ip"] == nil then
      module:log("debug", "%s supplied an insufficent number of elements or wrong elements for the JSON registration", user)
      return http_response(400, "Invalid syntax.")
    end


    --if not allow_registration then
    -- Check if user is an admin of said host
    --      if not usermanager.is_admin(user, req_body["host"]) then
    --        module:log("warn", "%s tried to submit registration data for %s but he's not an admin", user, req_body["host"])
    --        return http_response(401, "I obey only to my masters... Have a nice day.")
    --      else	
    --      end


    -- Blacklist can be checked here.
    if blacklist:contains(req_body["ip"]) then module:log("warn", "Attempt of reg. submission to the JSON servlet from blacklisted address: %s", req_body["ip"]) ; return http_response(403, "The specified address is blacklisted, sorry sorry.") end

    -- We first check if the supplied username for registration is already there.
    -- And nodeprep the username
    local username = nodeprep(req_body["username"])
    if not username then
      module:log("debug", "%s supplied an username containing invalid characters: %s", user, username)
      return http_response(406, "Supplied username contains invalid characters, see RFC 6122.")
    else
      if not usermanager.user_exists(username, req_body["host"]) then
        -- if username fails to register successive requests shouldn't be throttled until one is successful.
        if throttle_time and not whitelist:contains(req_body["ip"]) then
          if not recent_ips[req_body["ip"]] then
            recent_ips[req_body["ip"]] = os_time()
          else
            if os_time() - recent_ips[req_body["ip"]] < throttle_time then
              recent_ips[req_body["ip"]] = os_time()
              module:log("warn", "JSON Registration request from %s has been throttled.", req_body["ip"])
              return http_response(503, "Woah... How many users you want to register..? Request throttled, wait a bit and try again.")
            end
            recent_ips[req_body["ip"]] = os_time()
          end
        end

        local ok, error = usermanager.create_user(username, req_body["password"], req_body["host"])
        if ok then 
          hosts[req_body["host"]].events.fire_event("user-registered", { username = username, host = req_body["host"], source = "mod_register_json", session = { ip = req_body["ip"] } })
          module:log("debug", "%s registration data submission for %s@%s is successful", user, username, req_body["host"])
          return http_response(200, "Done.")
        else
          module:log("error", "user creation failed: "..error)
          return http_response(500, "Encountered server error while creating the user: "..error)
        end
      else
        module:log("debug", "%s registration data submission for %s failed (user already exists)", user, username)
        return http_response(409, "User already exists.")
      end
    end
    --    end	
  end
end


--------------- exerpt from table utils -----------------
--------------http://lua-users.org/wiki/TableUtils---------

function table.val_to_str ( v )
  if "string" == type( v ) then
    v = string.gsub( v, "\n", "\\n" )
    if string.match( string.gsub(v,"[^'\"]",""), '^"+$' ) then
      return "'" .. v .. "'"
    end
    return '"' .. string.gsub(v,'"', '\\"' ) .. '"'
  else
    return "table" == type( v ) and table.tostring( v ) or
    tostring( v )
  end
end

function table.key_to_str ( k )
  if "string" == type( k ) and string.match( k, "^[_%a][_%a%d]*$" ) then
    return k
  else
    return "[" .. table.val_to_str( k ) .. "]"
  end
end

function table.tostring( tbl )
  local result, done = {}, {}
  for k, v in ipairs( tbl ) do
    table.insert( result, table.val_to_str( v ) )
    done[ k ] = true
  end
  for k, v in pairs( tbl ) do
    if not done[ k ] then
      table.insert( result,
      table.key_to_str( k ) .. "=" .. table.val_to_str( v ) )
    end
  end
  return "{" .. table.concat( result, "," ) .. "}"
end

------------------- end ---------------------




--------------- encode/decode cgi module -----------------

-----------http://keplerproject.org/cgilua


----------------------------------------------------------------------------
-- Utility functions for encoding/decoding of URLs.
--
-- @release $Id: urlcode.lua,v 1.10 2008/01/21 16:11:32 carregal Exp $
----------------------------------------------------------------------------

local ipairs, next, pairs, tonumber, type = ipairs, next, pairs, tonumber, type
local string = string
local table = table


----------------------------------------------------------------------------
-- Decode an URL-encoded string (see RFC 2396)
----------------------------------------------------------------------------
function unescape (str)
  str = string.gsub (str, "+", " ")
  str = string.gsub (str, "%%(%x%x)", function(h) return string.char(tonumber(h,16)) end)
  str = string.gsub (str, "\r\n", "\n")
  return str
end

----------------------------------------------------------------------------
-- URL-encode a string (see RFC 2396)
----------------------------------------------------------------------------
function escape (str)
  str = string.gsub (str, "\n", "\r\n")
  str = string.gsub (str, "([^0-9a-zA-Z ])", -- locale independent
  function (c) return string.format ("%%%02X", string.byte(c)) end)
  str = string.gsub (str, " ", "+")
  return str
end

----------------------------------------------------------------------------
-- Insert a (name=value) pair into table [[args]]
-- @param args Table to receive the result.
-- @param name Key for the table.
-- @param value Value for the key.
-- Multi-valued names will be represented as tables with numerical indexes
--  (in the order they came).
----------------------------------------------------------------------------
function insertfield (args, name, value)
  if not args[name] then
    args[name] = value
  else
    local t = type (args[name])
    if t == "string" then
      args[name] = {
        args[name],
        value,
      }
    elseif t == "table" then
      table.insert (args[name], value)
    else
      error ("CGILua fatal error (invalid args table)!")
    end
  end
end

----------------------------------------------------------------------------
-- Parse url-encoded request data 
--   (the query part of the script URL or url-encoded post data)
--
--  Each decoded (name=value) pair is inserted into table [[args]]
-- @param query String to be parsed.
-- @param args Table where to store the pairs.
----------------------------------------------------------------------------
function parsequery (query, args)
  if type(query) == "string" then
    local insertfield, unescape = insertfield, unescape
    string.gsub (query, "([^&=]+)=([^&=]*)&?",
    function (key, val)
      insertfield (args, unescape(key), unescape(val))
    end)
  end
end

----------------------------------------------------------------------------
-- URL-encode the elements of a table creating a string to be used in a
--   URL for passing data/parameters to another script
-- @param args Table where to extract the pairs (name=value).
-- @return String with the resulting encoding.
----------------------------------------------------------------------------
function encodetable (args)
  if args == nil or next(args) == nil then   -- no args or empty args?
    return ""
  end
  local strp = ""
  for key, vals in pairs(args) do
    if type(vals) ~= "table" then
      vals = {vals}
    end
    for i,val in ipairs(vals) do
      strp = strp.."&"..escape(key).."="..escape(val)
    end
  end
  -- remove first & 
  return string.sub(strp,2)
end


--------------------- module end ---------------------------










-- Set it up!





function setup()
  for id, options in ipairs(ports) do 
    if not options.port then 
      if not options.ssl then ports[id].port = 9280
      else ports[id].port = 9443 end
    elseif options.port == 9280 and options.ssl then ports[id].port = 9443 end end
    httpserver.new_from_config(ports, handle_req, { base = "register_account" })
  end

  if prosody.start_time then -- already started
    setup()
  else
    module:hook("server-started", setup)
  end


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
local json_encode = require "util.json".encode
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
local ports = module:get_option_array("reg_servlet_ports", {{ port = 8080 }})
local recent_ips = {}

-- Begin

local function http_response(code, message, extra_headers)
  local response = {
    status = code .. " " .. message,
    body = message .. "\n" 
  }
  if extra_headers then response.headers = extra_headers end
  return response
end

local function handle_req(method, body, request)
  if request.method == "GET" then

    local req_body = {}
    parsequery(request.url.query,req_body)
    --    return http_response(202,table.tostring(tbl)) 

    --    if not pcall(function() req_body = json_decode(body) end) then
    --    module:log("debug", "JSON data submitted for user registration by %s failed to Decode.", user)
    --    return http_response(400, "JSON Decoding failed.")
    --  end

    --req_body = json_decode(body)

    if req_body['user'] and req_body['host'] then
      local user = req_body["user"]
      local host = req_body["host"]
      local status,message


      if user and host then
        local user_sessions = hosts[host] and hosts[host].sessions[user];
        if user_sessions then
          status = user_sessions.top_resources[1];
          if status and status.presence then
            message = status.presence:child_with_name("status");
            status = status.presence:child_with_name("show");
            if not status then
              status = "online";
            else
              status = status:get_text();
            end
            if message then
              message = message:get_text();
            end
          end
        end
      end

      status = status or "offline"


      local json_resp = json_encode({ status = status })
      local json_header = { ["Content-Type"] = "application/json" }

      return http_response(200, json_resp , json_header)


    else
      return http_response(400, "Must provide user and host parameters")
    end

  end




end





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
  httpserver.new_from_config(ports, handle_req, { base = "status" })
end

  if prosody.start_time then -- already started
    setup()
  else
    module:hook("server-started", setup)
  end



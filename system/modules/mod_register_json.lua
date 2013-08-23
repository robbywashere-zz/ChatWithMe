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
local ports = module:get_option_array("register_json_ports", {{ port = 8080 }})

module.host = "*" -- HTTP/BOSH Servlets need to be global.


-- Pick up configuration.




local throttle_time = module:get_option_number("register_json_time", nil)
local whitelist = module:get_option_set("register_json_wl", {})
local blacklist = module:get_option_set("register_json_bl", {})
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

      user = request.handler:ip()


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
      if req_body["exists"] and req_body["host"] then
        local username = nodeprep(req_body["exists"])
        local host = nodeprep(req_body["host"])
        if not usermanager.user_exists(username, host) then
          return http_response(202, "Ok")
        else
          return http_response(409, "User already exists")
        end
      end


    if req_body["username"] == nil or req_body["password"] == nil or req_body["host"] == nil or req_body["ip"] == nil then
      module:log("debug", "%s supplied an insufficent number of elements or wrong elements for the JSON registration", user)
      return http_response(400, "Invalid syntax.")
    end




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









-- Set it up!





function setup()
--    local ports = module:get_option("bosh_ports") or { 5280 };
    httpserver.new_from_config(ports, handle_req, { base = "register" })
  end

  if prosody.start_time then -- already started
    setup()
  else
    module:hook("server-started", setup)
  end


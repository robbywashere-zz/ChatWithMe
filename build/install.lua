#!/usr/local/bin/lua



--misc util functions
function chomp(s)
  return string.gsub(s, "\n$", "")
end

function file_exists(name)
  local f=io.open(name,"r")
  if f~=nil then io.close(f) return true else return false end
end

function cmdout(cmd) 
  local f = io.popen(cmd) -- runs command
  local l = f:read("*a") -- read output of command
  io.close(f)
  return chomp(l)
end

function log(msg) 
  print('\t' ..  msg .. '\n')
end

function slurp(filename)
  local file_handle = assert(io.open(filename),'Error opening file for reading:' .. filename .. '')
  local contents = file_handle:read'*a'
  file_handle:close()
  return(contents)
end

function append_to(filename,data)
  local file_handle = assert(io.open(filename,'a+'),'Error opening file for writing:' .. filename .. '')
  local contents = file_handle:write(data)
  file_handle:close()
end

function overwrite(filename,withdata)
  local file_handle = assert(io.open(filename,'w'),'Error opening file for writing:' .. filename .. '')
  local contents = file_handle:write(withdata)
  file_handle:close()
end


function check(file,for_pattern)
  local content = slurp(file)
  if string.match(content, for_pattern) ~= nil then
    return true
  else 
    return false
  end 
end

 



--Install functions

function find_prosody_installation()
  local l = cmdout('which prosody')
  if l == nil then
    error('Could not locate prosody installation')
  else 
    return l
  end
end


function get_contents_from(filename)
  log('Retreiving contents from ' .. filename .. '')
  return slurp(filename)
end


function get_environment_from(file_contents)

  local cfg_dir = string.match(file_contents, "CFG_CONFIGDIR='(.-)';")
  if cfg_dir == nil then
    error('Could not locate Prosody configuration directory')
  else 
    log('Using '.. cfg_dir .. ' as prosody configuration directory')
  end

  local mod_dir = string.match(file_contents, "CFG_PLUGINDIR='(.-)';")
  if mod_dir == nil then
    error('Could not locate Prosody module directory')
  else 
    log('Using '.. mod_dir .. ' as prosody module directory')
  end


  t = {}

  t['mod_dir'] = mod_dir
  t['cfg_dir'] = cfg_dir

  return t

end

function do_copy_cmd(prep_cmd) 
  local status = os.execute(prep_cmd)
  if status ~= 0 then
    log('Error executing command ' .. prep_cmd)
    log('Please run installation with elevated privileges')
    error('Exiting installation')
  end
end


function copy_modules_to(mod_dir)
  local cwd_modules = cmdout('pwd') .. '/modules'
  log('Installing modules in ' .. cwd_modules)
  local prep_cmd = 'cp ' .. cwd_modules .. '/mod_* ' .. mod_dir
  do_copy_cmd(prep_cmd)
end

function copy_local_config_to(cfg_dir)
  local cfg_file = cmdout('pwd') .. '/prosody.cfg.lua'
  local target_file = cfg_dir .. '/prosody.cfg.lua'
  log('Copying configuration file ' .. cfg_file .. ' to ' .. cfg_dir)
  local prep_cmd = 'cp ' .. cfg_file .. ' ' .. target_file
  do_copy_cmd(prep_cmd)
end


function build_cwm_config_from(cwm_file)
  log('Building chatWithMe config...')
  if not file_exists(cwm_file) then
    log('Could not locate chatWithMe configuration file: ' .. cwm_file)
    error('Exiting installation')
  end

  local for_pattern = "http_path%s-="
  if check(cwm_file,for_pattern) then
    log('ChatWithMe config build detected - Skipping...')
    return
  end

  local dir = cmdout('pwd') .. '/www'
  local http_path_str = 'http_path = "' .. dir .. '"'

  append_to(cwm_file,http_path_str)


end


function modify_config(target_file)
  if not file_exists(target_file) then
    log('Could not locate current prosody configuration file: ' .. target_file)
    error('Exiting installation')
  end

  local cwm_file = cmdout('pwd') .. '/chatwithme.cfg.lua'
  build_cwm_config_from(cwm_file)
  

  local prosody_cfg = slurp(target_file)
  local cwm_cfg = slurp(cwm_file)

  if string.find(prosody_cfg,'<ChatWithMe.cfg>') then
    log('Warning: ' .. target_file .. ' contains chatWithMe configuration - Skipping...' )
    return
  end

  log("Appending chatWithMe configuration to Prosody configuration:")
  log(target_file)

  append_to(target_file,cwm_cfg)
  
   
  local for_pattern = '--ChatWithMe Modules'
  if not check(target_file,for_pattern) then
    add_modules_enabled(target_file)
  else
    log('ChatWithMe Modules detected in configuration file - Skipping...')
    return
  end
end

function add_modules_enabled(config_file)
  local config_text = slurp(config_file)
  log('Bravely attempting to modify prosody configuration file')
  local cwm_modules = [[

    modules_enabled = {

    --ChatWithMe Modules
    "cwm_carbons";
    "cwm_register_json";
    "cwm_support_contact";
    "cwm_web_presence";

  ]]

  local mod_pattern = "%s-modules_enabled%s-=%s-{" --Secretly..... 'modules_enabled = {'

  if string.match(config_text, mod_pattern) == nil then
    error('Could not add enabled modules to enabled modules list in: ' .. config_file)
  end 

  local with_data = string.gsub(config_text,mod_pattern,cwm_modules)

  overwrite(config_file,with_data)

end


local install_location = find_prosody_installation()

local file_contents = get_contents_from(install_location)

local env_table = get_environment_from(file_contents)

local target_file = env_table['cfg_dir'] .. '/prosody.cfg.lua'

copy_modules_to(env_table['mod_dir'])

modify_config(target_file)



log('Installation complete.')

log('On the command prompt type $> prosodyctl start')

log('then visit http://localhost:8000')






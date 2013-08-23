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
  local file_handle = assert(io.open(filename),'Error opening file for reading:' .. filename .. '')
  local contents = file_handle:read'*a'
  file_handle:close()
  return(contents)
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

function copy_config_to(cfg_dir)
  local cfg_file = cmdout('pwd') .. '/prosody.cfg.lua'
  local target_file = cfg_dir .. '/prosody.cfg.lua'
  log('Copying configuration file ' .. cfg_file .. ' to ' .. cfg_dir)
  local prep_cmd = 'cp ' .. cfg_file .. ' ' .. target_file
  do_copy_cmd(prep_cmd)
end



local install_location = find_prosody_installation()

local file_contents = get_contents_from(install_location)

local env_table = get_environment_from(file_contents)

copy_modules_to(env_table['mod_dir'])

copy_config_to(env_table['cfg_dir'])

log('Installation complete.')

log('On the command prompt type $> prosodyctl start')

log('then visit http://localhost:8000')






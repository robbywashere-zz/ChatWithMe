//Support is used as in indicator on the roster to mean me :)
//var profile {
//host:
//username:
//password:
//token: (optional)
//}

//TODO: come up with better nickname support for both Support and User


var DEBUG = false;
var RAW = false;
var LOG = false;



$(document).ready(function(){
  events.load();
});



var misc = {


  trim: function(str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
      if (/\S/.test(str.charAt(i))) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    return str;
  },

  random: function() { 
    var s4 = function() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); };
    return s4() + s4() + '-' + s4() +  s4();
    },


  log: function(type,msg) {
    if ((type === "DEBUG") && (DEBUG === true)) {
      console.log(msg);
    }
    if ((type === "LOG") && (LOG === true)) {
      console.log(msg);
    }
  },

    store: {

      set: store.set,
      get: store.get

    }


}

var control = {

  init: function() {
    this.socket = new Strophe.Connection('/xmpp-httpbind');
    if (RAW === true) {
      this.socket.rawInput = function(data){ console.log('>>>',data) };
      this.socket.rawOutput = function(data){ console.log('<<<',data) };
    }
  },


  registerConnect: function(profile) {
    control.register(profile)
      .success(function(){ events.registerSuccess(profile) });
    //TODO: .error(function(data) { console.log(profile); events.registerFail(data) });
  },

  restoreUser: function() {
    if (this.restoreProfile()) {
      var profile = this.restoreProfile();
      control.connect(profile,events.stropheStatus);
      return true;
    }
    else { return false; }
  },

  storeProfile: function(profile) {
    misc.store.set('profile',profile);
  },

  restoreProfile: function() {
    if (typeof misc.store.get('profile') === "undefined") {
      return false;
    }
    else {
      return misc.store.get('profile');
    }
  },

  createProfile: function() {
    var profile = {
      'username': misc.random(),
      'password': misc.random(),
      //'host': document.location.host,
      'host': document.location.host.split(':')[0]

    };
    profile['jid'] = profile['username'] + '@' + profile['host'];
    misc.log('DEBUG','Created profile: ' + JSON.stringify(profile));
    return profile;
  },

  register: function(profile) {
    var req_obj = $.post('/register',JSON.stringify({'username':profile['username'],'password':profile['password'],'host':profile['host']}))
      return req_obj;
  },

  nickname: function(name) {
    for (var support_contact in control.socket.roster['support']) break;
    control.socket.send($pres({'from':control.socket.jid,'to':support_contact}).c('nick',{'xmlns':'http://jabber.org/protocol/nick'}).t(name));
  },

  connect: function(profile,callback) {
    misc.log('DEBUG',"Connecting with:" + JSON.stringify(profile));
    this.socket.connect(profile['jid'],profile['password'],callback);
  },


  msgSupport: function(msg) {
    if (!control.socket.connected) { 
      misc.log("DEBUG","Not connected ");
      return false
    }
    if (typeof control.socket.roster['support'] === "undefined") {
      misc.log("DEBUG","Support contact not found");
      return false;
    }
    for (var support_contact in control.socket.roster['support']) break;
    var me = Strophe.getBareJidFromJid(this.socket.jid);
    var msg = $build('message',{
      to: support_contact,
      from: me,
      type: 'chat'
    }).c('body').t(msg).tree();
    var _tmp = this.socket.send(msg);
    misc.log("DEBUG",msg);
    return _tmp;
  }

};

var events = {

  init: function() {

  },


  load: function() {
    control.init();
    if (control.restoreUser()) {
      ;
    }
    else {
      var profile = control.createProfile();
      control.registerConnect(profile);
    }
  },

  stropheStatus: function(state) {
    if (state == Strophe.Status.CONNECTING) {
      misc.log('DEBUG','Connecting to server...');
    } 
    else if (state == Strophe.Status.CONNFAIL) {
      //TODO: reconnect
      misc.log('DEBUG','Connection failed');
    //  events.disconnected = function() { control.restoreUser(); }
    } 
    else if (state == Strophe.Status.DISCONNECTING) {
      misc.log('DEBUG','Disconnecting...');
    } 
    else if (state == Strophe.Status.ATTACHED) {
      misc.log('DEBUG','Attached Session');
    } 
    else if (state == Strophe.Status.AUTHFAIL) {
      misc.log('DEBUG','Auth failed');
      events.authFailed();
    } 
    else if (state == Strophe.Status.DISCONNECTED) {
      misc.log('DEBUG','Disconnected from server');
      events.disconnected();
    } 
    else if (state == Strophe.Status.CONNECTED) { 
      misc.log('DEBUG','Connected to server');
      events.connected();
      hooks.connected();
    }

  },

  authFailed: function() {
    control.socket.disconnect();
    this.disconnected = function() {
      control.registerConnect(control.createProfile());
      //TODO: add re-connection control
      this.disconnected = function() { };
    }
  },

  _onMsg: function(_data_) {
    if ($(_data_).find('forwarded').length > 0) {
      var _data = $(_data_).find('forwarded').last().children().get()[0];
    }
    else {
      var _data = _data_;
    }
    msgObj = {
      'to' : _data.getAttribute('to'),
      //'from' : _data.getAttribute('from'),
      'from': Strophe.getBareJidFromJid(_data.getAttribute('from')),
      'type' : _data.getAttribute('type'),
      'elems' : _data.getElementsByTagName('body')
    }
    if (msgObj['elems'].length > 0) {
      msgObj['body'] = Strophe.getText(msgObj['elems'][0]);
      events.messaged(msgObj);
    }
    else {
      msgObj['body'] = '<undefined>';
      //typing notifications are not supported 
    }

    return true;
  },


  supportStatus: function(name,type){ 
    misc.log('LOG',name + ' changed status to...' + type);
    hooks["statusChange"](name,type);
    },


  presence: function(xml) {
    var $xml = $(xml);
    var from = Strophe.getBareJidFromJid($xml.attr('from'));
    var rost = control.socket.roster['support'];
    //    if ((rost.hasOwnProperty(from)) && (rost[from]["name"] === "Support")) {
    if ((rost.hasOwnProperty(from)) && (rost[from]).hasOwnProperty("name")) {
      var name = rost[from]["name"];
      if ($xml.attr('type') === 'unavailable') {
        events.supportStatus(name,'unavailable');
      }
      else {
        var type = $xml.find('show').text();
        if (type.length == 0) { type = 'chat' };
        events.supportStatus(name,type);
      }
    }
    return true;
  },

  messaged: function(msgObj) {
    try { 
      var name = control.socket.roster['support'][msgObj["from"]]["name"]
    } catch(e) {
      var name = msgObj["from"];
    }
    misc.log("DEBUG",name + " : " + msgObj["body"]);
    try {
    hooks["message"](name,msgObj["body"]);
    } catch (e) {;}
    return true;
  },

  roster: function(data) {
    misc.log("DEBUG",data);
    var roster = {};
    $(data).find('item').each(function(){
      var $el = $(this);
      var group = $el.find('group').text() || 'Unknown';
      roster[group] = {};
       roster[group][$el.attr('jid')] = {
        'jid': $el.attr('jid'),
      'name': $el.attr('name'),
      'subscription': $el.attr('subscription'),
      };     
    });
    control.socket.roster = roster;

  },

  connected: function() {
    control.socket.addHandler(events._onMsg, null, 'message', null, null,  null);
    control.socket.addHandler(events.presence,null,'presence',null, null, null);
    control.socket.sendIQ($iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'}),function(data){
      events.roster(data);
    });

    control.socket.send($iq({type:'set',id:'enablecarbons'}).c('enable', {xmlns: 'urn:xmpp:carbons:2'}).tree());
    control.socket.send($pres().tree());

  },

  registerSuccess: function(profile) {
    misc.log("DEBUG","Registered as " + profile["username"]);
    
    control.storeProfile(profile);
    control.connect(profile,this.stropheStatus);
  }


  };


var hooks = { 
  message: function(){},
  statusChange: function(){},
  connected: function(){}
};

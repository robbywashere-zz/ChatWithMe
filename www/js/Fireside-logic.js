Fireside.logic = (function($){

  var DEBUG = !true;
  var RAW = false;
  var LOG = false;

  Self = {};

  Self.misc = {

    supportName: function(from) {
      var rost = Self.socket.roster['support'];
      var name = (rost[from]['pageAlias']) ? rost[from]['pageAlias'] : rost[from]["name"];
      return name;
    },

supportStatus: function(name,type){ 
  Self.misc.log('LOG',name + ' changed status to...' + type);
  Self.hooks["statusChange"](name,type);
},

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

  addHook: function(name,fn) {
    var oldHook = Self.hooks[name];
    var newHook = function() { oldHook.apply(this,arguments); fn.apply(this,arguments); };
    Self.hooks[name] = newHook; 
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

Self.control = {

  init: function(options) {
    this.socket = new Strophe.Connection(options.domain + options.bind);
    if (RAW === true) {
      Self.socket.rawInput = function(data){ console.log('>>>',data) };
      Self.socket.rawOutput = function(data){ console.log('<<<',data) };
    }

    if (Self.control.restoreUser()) {
      ; //Do nothing
    }
    else {
      //Nickname screen state
      //  var profile = Self.control.createProfile();
      //  Self.control.registerConnect(profile);
      Self.control.registerConnect(Self.control.createProfile);
    }


  },


  registerConnect: function(profile) {
    Self.control.register(profile)
      .success(function(){ Self.events.registerSuccess(profile) });
  },

  restoreUser: function() {
    if (this.restoreProfile()) {
      var profile = this.restoreProfile();
      Self.control.connect(profile,Self.events.stropheStatus);
      return true;
    }
    else { return false; }
  },

  storeProfile: function(profile) {
    Self.misc.store.set('profile',profile);
  },

  restoreProfile: function() {
    if (typeof Self.misc.store.get('profile') === "undefined") {
      return false;
    }
    else {
      return Self.misc.store.get('profile');
    }
  },

  createProfile: function() {
    var profile = {
      'username': Self.misc.random(),
      'password': Self.misc.random(),
      'host': (typeof options.host !== "undefined") ? options.host : window.location.hostname
    };
    profile['jid'] = profile['username'] + '@' + profile['host'];
    Self.misc.log('DEBUG','Created profile: ' + JSON.stringify(profile));
    return profile;
  },

  register: function(profile) {
    var req_obj = $.post(options.domain + '/register',JSON.stringify({'username':profile['username'],'password':profile['password'],'host':profile['host']}))
      return req_obj;
  },

  nickname: function(name) {

    var newHook = function() {
      for (var support_contact in Self.socket.roster['support']) break;
      Self.socket.send($pres({'from':Self.socket.jid,'to':support_contact}).c('nick',{'xmlns':'http://jabber.org/protocol/nick'}).t(name));
    }

    if (!Self.socket.connected) {
      var savedHook = Self.hooks['connected'];
      Self.hooks['connected'] = function() { savedHook(); newHook(); }
    }

    else {
      newHook();
    }


  },

  connect: function(profile,callback) {
    if (Self.socket.connected) {
      Self.misc.log('DEBUG','Already Connected, Aborting...');
    }
    Self.misc.log('DEBUG',"Connecting with:" + JSON.stringify(profile));
    Self.socket.connect(profile['jid'],profile['password'],callback);
  },


  sendMsg: function(msg) {


    try {
      if (!Self.socket.connected) { 
        //Self.misc.log("DEBUG","Not connected ");
        throw 'Not connected '; 
      }
      if (typeof Self.socket.roster['support'] === "undefined") {
        // Self.misc.log("DEBUG","Support contact not found");
        throw 'Support contact not found'; 
      }

    } catch(e) {
      Self.misc.log("DEBUG",e);
      var error_fn = function(fn) {
        if (fn) fn();
        return this;
      };
      var success_fn = function() {
        //Do nothing nope sorry
      };
      return { error: error_fn , success: success_fn };
    }


    for (var support_contact in Self.socket.roster['support']) break;
    var me = Strophe.getBareJidFromJid(Self.socket.jid);
    var msgObj = $build('message',{
      to: support_contact,
        from: me,
        type: 'chat'
    }).c('body').t(msg).tree();
    var _tmp = Self.socket.send(msgObj);
    Self.misc.log("DEBUG",msgObj);
    return _tmp;
  }

};

Self.events = {

  init: function() {
    //Do nothing !?
  },

  stropheStatus: function(state) {
    if (state == Strophe.Status.CONNECTING) {
      Self.misc.log('DEBUG','Connecting to server...');
      Self.hooks.connecting();
    } 
    else if (state == Strophe.Status.CONNFAIL) {
      //TODO: reconnect
      Self.misc.log('DEBUG','Connection failed');
      //  Self.events.disconnected = function() { Self.control.restoreUser(); }
    } 
    else if (state == Strophe.Status.DISCONNECTING) {
      Self.misc.log('DEBUG','Disconnecting...');
    } 
    else if (state == Strophe.Status.ATTACHED) {
      Self.misc.log('DEBUG','Attached Session');
    } 
    else if (state == Strophe.Status.AUTHFAIL) {
      Self.misc.log('DEBUG','Auth failed');
      Self.events.authFailed();
    } 
    else if (state == Strophe.Status.DISCONNECTED) {
      Self.misc.log('DEBUG','Disconnected from server');
      Self.hooks.disconnected();
      Self.events.disconnected();
    } 
    else if (state == Strophe.Status.CONNECTED) { 
      Self.misc.log('DEBUG','Connected to server');
      Self.events.connected();
      Self.hooks.connected();
    }

  },

  authFailed: function() {
    Self.socket.disconnect();
    this.disconnected = function() {
      Self.control.registerConnect(Self.control.createProfile());
      //TODO: add re-connection Self.control
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
      Self.events.messaged(msgObj);
    }
    else {
      msgObj['body'] = '<undefined>';
      //typing notifications are not supported 
    }

    return true;
  },



  presence: function(xml) {
    var $xml = $(xml);
    var from = Strophe.getBareJidFromJid($xml.attr('from'));
    var rost = Self.socket.roster['support'];

    if ((rost.hasOwnProperty(from)) && (rost[from]).hasOwnProperty("name")) {

      var name = (rost[from]['pageAlias']) ? rost[from]['pageAlias'] : rost[from]["name"];
      if ($xml.attr('type') === 'unavailable') {
        Self.misc.supportStatus(name,'unavailable');
      }
      else {
        var type = $xml.find('show').text();
        if (type.length == 0) { type = 'chat' };
        Self.misc.supportStatus(name,type);
      }
    }
    return true;
  },

  messaged: function(msgObj) {
    var from = msgObj["from"]
      try { 
        var name = Self.misc.supportName(from);
      } catch(e) {
        var name = from;
        Self.misc.log("DEBUG",name + " :error determining support name " + msgObj["body"]);
      }
    Self.misc.log("DEBUG",name + " : " + msgObj["body"]);
    try {
      Self.hooks["message"](name,msgObj["body"]);
    } catch (e) {;}
    return true;
  },

  roster: function(data) {
    Self.misc.log("DEBUG",data);
    var roster = {};
    $(data).find('item').each(function(){
      var $el = $(this);
      var group = $el.find('group').text() || 'Unknown';
      roster[group] = {};
      roster[group][$el.attr('jid')] = {
        'jid': $el.attr('jid'),
      'name': $el.attr('name'),
      'pageAlias': (typeof options.supportAlias !== "undefined") ? options.supportAlias : null,
      'subscription': $el.attr('subscription'),
      };     
    });
    Self.socket.roster = roster;

  },

  connected: function() {
    Self.socket.addHandler(Self.events._onMsg, null, 'message', null, null,  null);
    Self.socket.addHandler(Self.events.presence,null,'presence',null, null, null);
    Self.socket.sendIQ($iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'}),function(data){
      Self.events.roster(data);
    });

    Self.socket.send($iq({type:'set',id:'enablecarbons'}).c('enable', {xmlns: 'urn:xmpp:carbons:2'}).tree());
    Self.socket.send($pres().tree());

  },

  registerSuccess: function(profile) {
    Self.misc.log("DEBUG","Registered as " + profile["username"]);

    Self.control.storeProfile(profile);
    Self.control.connect(profile,this.stropheStatus);
  }


};


Self.hooks = { 
  message: function(){},
  statusChange: function(){},
  connected: function(){},
  disconnected: function(){},
  connecting: function(){}
};

Self.init = Self.control.init;


return Self;

})(window.jQuery);


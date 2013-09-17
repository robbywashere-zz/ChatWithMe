

Fireside.ui = (function($){
  var Self = {


    isScrollBottom: function() { return ((Self.DOM['log'][0].scrollHeight - Self.DOM['log'].scrollTop()) == Self.DOM['log'].outerHeight()); },

    DOM: {},


    toggle: function(state) {


      //true enabled, false disabled
      if (typeof state == "boolean") {
        Fireside.logic.misc.store.set('abled',state);
      };

      var _curr = Fireside.logic.misc.store.get('abled');
      Fireside.logic.misc.store.set('abled',!_curr);
      console.log(_curr);

      if (!_curr) { 
        if (Fireside.logic.socket.connected) Fireside.logic.socket.disconnect(); 
      }
      else if (!Fireside.logic.socket.connected) Fireside.logic.control.restoreUser(); 

    },


  init: function(options) {
    $('body').append(Fireside.template);
    $('html').append('<style>' + Fireside.css + '</style');

    this.DOM['sentence_template'] = $('[data-attr="sentence"]');
    this.DOM['info'] = $('[data-attr="info"]');
    this.DOM['log'] = $('[data-attr="log"]');
    this.DOM['titlebar'] = $('[data-attr="titlebar"]');
    this.DOM['status-icon'] = $('[data-attr="status-icon"]');
    this.DOM['textarea'] = $('[data-attr="textarea"]');
    this.DOM['nickname-box']= $('[data-attr="nickname-box"]');
    this.DOM['nickname'] = $('[data-attr="nickname"]');
    this.DOM['chatbox'] = $('[data-container="chatbox"]');
    this.DOM['chatbox-title'] = $('[data-attr="chatbox-title"]');
    this.DOM['title'] = $('title');
    this.DOM['menu-button'] = $('.cwm-menu .menu-button');
    this.DOM['menu'] = $('.cwm-menu-container');

    this.DOM['menu-action'] = $('.cwm-menu [data-action]');


    //Msg read scroll logic



    var _throttler  = new Fireside.util.throttle(2000,1,function(arg){ console.log(arg) });
    this.DOM['log'].scroll(function(){
      _throttler('BLAH!').start();
    });


    //Menu Logic
    this.DOM['menu-button'].click(function(){ $('.cwm-menu-container').toggle();return false });
    this.DOM['menu'].click(function(){ $(this).hide(); });
    this.DOM['menu-action'].click(function(k,v){ 
      var ACTION = $(this).data('action');

      if (ACTION === "clear") { Fireside.logic.misc.store.set('offlineLog',null); Self.DOM['log'].html(''); }
      if (ACTION === "disconnect") { Fireside.logic.socket.disconnect();  }
      if (ACTION === "connect") { Fireside.logic.control.restoreUser();  }
      if (ACTION === "toggle") { Self.toggle();  }


    });


    if (options.supportAlias) { 
      this.DOM['titlebar'].append(options.supportAlias);
    }

    ////////////// Chatbox minimize maximize logic

    //Retain minimized state of chatbox after window close
    var chatboxstate = (Fireside.logic.misc.store.get('chatbox-state')) ? true : false;

    //initialize page with stored state
    if (chatboxstate) Self.DOM['chatbox'].removeClass('minimize');


    this.DOM['chatbox-title'].click(function(){ 
      //change and store state 
      chatboxstate = !chatboxstate;
      Fireside.logic.misc.store.set('chatbox-state',chatboxstate);

      if (chatboxstate) {
        Self.DOM['chatbox'].removeClass('minimize');
      }
      else {
        Self.DOM['chatbox'].addClass('minimize');
        Self.DOM['textarea'].blur();
      }

    return false;
    });
    ///////////// end


    //make textarea always focus when you click on the chat 'window'
    this.DOM['chatbox'].click(function(){
      Self.DOM['chatbox'].find('input[type="text"]:visible, textarea:visible').first().focus();
      Self.notify(false);
    })


    this.DOM['textarea'].focus(function(){
      //Self.notify(false);
    });


    $('[data-attr="sentence"]').remove();
    if ((Fireside.logic.misc.store.get('nickname') == null) || (Fireside.logic.misc.store.get('profile') == null)) { 
      this.DOM['nickname'].bind('keydown',function(e){
        if (e.keyCode === 13) {
          var _nick_ = $(this).val();
          Fireside.logic.control.nickname(_nick_);

          Fireside.logic.misc.store.set('nickname',_nick_);
          Self.DOM['nickname-box'].hide();
          Self.DOM['textarea'].focus();



          $(this).unbind('keydown');

          //Create generic profile and connect
          Fireside.logic.control.registerConnect(Fireside.logic.control.createProfile());

          //Greet user 

          var greeting = 'Hello ' + _nick_ + ' ! Welcome :) ';

      Self.DOM['log'].append($('<em>' + greeting + '</em>'));

      return false;
        }
      });
      Self.DOM['nickname-box'].show();
    }
    else {
      Self.DOM['nickname-box'].hide();
      //Open chatbox automatically this.DOM['chatbox'].children('input[type="checkbox"]').click();

    }
    $('[data-attr="textarea"]').keydown(function(e){
      if ((e.keyCode === 13) && (!e.originalEvent.shiftKey)) {

        var msg = $(this).val();
        var $sentence = Self.logMsg('Me',msg);  

        //$sentence is false if msg is blank
        if ($sentence) {
          var result = Fireside.logic.control.sendMsg(msg);
          result.error(function(){ 
            var _error = true;
            // Self.logMsg('Me',$(this).val(),_error);
            $sentence.log(_error);
            $sentence.el.addClass('error');  
          }).success(function(){
            $sentence.log(false);
          });
        }
        $(this).val('');
        return false;
      }

    });



    Fireside.logic.hooks["disconnected"] = function() { 
      Self.userStatus('offline');
      Self.DOM['info'].show().text('You are not connected');
    };


    Fireside.logic.hooks["connecting"] = function() { 
      Self.showConnecting();
    };

    Fireside.logic.hooks["message"] = function(name,msg) { 
      //accounting for carbons - or new tabs
      if (name == Strophe.getBareJidFromJid(Fireside.logic.socket.jid)) {
        name = "Me";
        Self.logMsg(name,msg);
      }
      else {
        //Message is from someone else, trigger notify
        Self.notify(true);
        Self.logMsg(name,msg);
      }
    }
    Fireside.logic.hooks["connected"] = function(name,msg) { 
      Self.offLogRestore();
    }

    Fireside.logic.hooks["statusChange"] = function(name,type) { 

      var codes = { 
        "away": 'away',
        "chat": 'online',
        "dnd": 'busy',
        "xa": 'away', 
        "unavailable": "offline"
      };
      if (type == 'unavailable') {
        Self.DOM['info'].show().text(name + ' is offline, but you may still send messages');
      } 
      else {
        if (Fireside.logic.misc.store.get('nickname') != null) { 
          Fireside.logic.control.nickname(Fireside.logic.misc.store.get('nickname'));
        }
        Self.DOM['info'].hide().text('');
      }
      Self.userStatus(codes[type]); 
    }
  },

  showConnecting: function() {
    Self.userStatus('connecting');
    //  Self.DOM['info'].show().text('Connecting...');
    var savedHook = Fireside.logic.hooks['connected'];
    Fireside.logic.hooks['connected'] = function() { savedHook(); Self.DOM['info'].hide().text(''); }
  },

  //true or false - is - on or off
  notify: function(state) {
    //notify on
    if ((state) && (!this.DOM['textarea'].is(':focus'))) {
      Self.titleAlert('New Message',true);

    }
    //notify off
    else {
      Self.titleAlert(null,false);
    }
  },


  //returns start() and .stop() chainable functions
  alternate: function(fn1,fn2) {

    var _alt = {};
    var _timer; 
    _alt.fn1 = fn1;
    _alt.fn2 = fn2;
    var arr = [fn1,fn2];
    var i = 0; 

    this.start = function() {
      _timer = setInterval(function() { i++ ; i = i % 2; arr[i]() ; },1000);
      return this;
    };
    this.stop = function() {
      clearInterval(_timer);
      if (typeof _alt['fn1'] === "function") { 
        _alt['fn1']();    
      } 
      return this;
    };
  },


  titleAlert: (function() {
    var _alternator = {};
    _alternator.stop =  function() {};
    return function(msg,priority) {

      _alternator.stop();
      if ((msg == null) && (!priority)) { return; }

      var oldTitle = this.DOM['title'].text();
      var newTitle = msg;
      var _that = this;

      var waxon = function(){
        if (msg) { _that.DOM['title'].text(oldTitle) }
        Self.DOM['chatbox-title'].removeClass('lightup');
      };
      var waxoff = function() {
        if (msg) { _that.DOM['title'].text(newTitle) }
        Self.DOM['chatbox-title'].addClass('lightup');
      }
      _alternator = new this.alternate(waxon,waxoff).start();
    }

  })(),


  offLogSet: function(sender,text,error) {
    var limit = 25;
    var offline = Fireside.logic.misc.store.get('offlineLog') || [];


    var textarr = [sender,text];
    if (error) { textarr.push(error); }


    offline.unshift(textarr);
    if (offline.length>0) offline = offline.slice(0,limit);
    Fireside.logic.misc.store.set('offlineLog',offline);
  },
  offLogRestore: function() {
    var offline = Fireside.logic.misc.store.get('offlineLog');
    offline.reverse();
    for (var i in offline) {
      var msgArr = offline[i];
      var from = msgArr[0] || ' ';
      var msg = msgArr[1] || ' ';
      var $el = Self.logMsg(from,msg).el
        if (msgArr[2]) { $el.addClass('error'); }
    }
  },

  _newSentence: function() {
    return this.DOM['sentence_template'].clone();
  }, 
  userStatus: function(type) {
    this.DOM['status-icon'].attr('class','icon ' + type);
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
  offline: function(){ return true; },
  logMsg: function(sender,text) {

    if (typeof text === "object") {
      var error  = text.error;
      var text = text.msg;
    }


    if (typeof store === "undefined") { store = true; }

    var $sentence = Self._newSentence();
    text = Self.trim(text);
    if (text.length == 0) { return false ;}



    //Just some crappy templating logic, nothing to see here
    var $words = $sentence.find('[data-attr="words"]');
    var logmsg = $words.text(text).html().replace(/\n/g,'<br/>');
    $words.html(logmsg);
    $sentence.find('[data-attr="sender"]').html(sender + ":");

    //if ((Self.DOM['log'][0].scrollHeight - Self.DOM['log'].scrollTop()) == Self.DOM['log'].outerHeight()) 
    var scrollPosit = this.isScrollBottom();
    this.DOM['log'].append($sentence);
    if (scrollPosit) {  Self.DOM['log'][0].scrollTop = Self.DOM['log'][0].scrollHeight; }


    var returnable = {
      'el': $sentence,
      'log': function(error) {
        var _err = !!(error);
        Self.offLogSet(sender,text,_err); 
      }


    }; 
    return returnable;

  }

}
return Self;

})(jQuery);
//Firebox.ui.init



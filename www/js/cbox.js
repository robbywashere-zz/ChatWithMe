var cBox = (function(){




  var Self = {

    init: function() {
      this.sT_html = $('[data-attr="sentence"]');

     
      this.DOM['info'] = $('[data-attr="info"]');
      this.DOM['log'] = $('[data-attr="log"]');
      this.DOM['titlebar'] = $('[data-attr="titlebar"]');
      this.DOM['status-icon'] = $('[data-attr="status-icon"]');
      this.DOM['textarea'] = $('[data-attr="textarea"]');
      this.DOM['nickname-box']= $('[data-attr="nickname-box"]');
      this.DOM['nickname'] = $('[data-attr="nickname"]');
      this.DOM['chatbox'] = $('[data-container="chatbox"]');

      

      this.DOM['chatbox'].click(function(){
          $('input[type="text"]:visible, textarea:visible').first().focus();
      })

      $('[data-attr="sentence"]').remove();
      if (misc.store.get('nickname') == null) { 
        this.DOM['nickname'].bind('keydown',function(e){
          if (e.keyCode === 13) {
            var _nick_ = $(this).val();
            control.nickname(_nick_);
            misc.store.set('nickname',_nick_);
            cBox.DOM['nickname-box'].hide();
            cBox.DOM['textarea'].focus();
            $(this).unbind('keydown');
            return false;
          }
      });
      cBox.DOM['nickname-box'].show();
      }
      else {
      cBox.DOM['nickname-box'].hide();
      this.DOM['chatbox'].children('input[type="checkbox"]').click();

      }
      $('[data-attr="textarea"]').keydown(function(e){
        if ((e.keyCode === 13) && (!e.originalEvent.shiftKey)) {
          cBox.logMsg('Me',$(this).val());
          control.msgSupport($(this).val());
          $(this).val('');
          return false;
        }

      });


      hooks["message"] = function(name,msg) { 
        if (name == Strophe.getBareJidFromJid(control.socket.jid)) {
          name = "Me";
          cBox.logMsg(name,msg,false);
        }
        else {
          cBox.logMsg(name,msg);
        }
      }
      hooks["connected"] = function(name,msg) { 
        cBox.offLogRestore();
      }

      hooks["statusChange"] = function(name,type) { 

        var codes = { 
          "away": 'away',
          "chat": 'online',
          "dnd": 'busy',
          "xa": 'away', 
          "unavailable": "offline"
        };
        if (type == 'unavailable') {
          cBox.DOM['info'].show().text(name + ' is offline');
        } 
        else {

          if (misc.store.get('nickname') != null) { 

          control.nickname(misc.store.get('nickname'));

          }

          cBox.DOM['info'].hide().text('');
        }
        cBox.userStatus(codes[type]); 
      }
    },

    DOM: {},

   offLogSet: function(sender,text) {
      var limit = 25;
      var offline = misc.store.get('offlineLog') || [];
      offline.unshift([sender,text]);
      offline.slice(0,limit);
      misc.store.set('offlineLog',offline);
    },
   offLogRestore: function() {
      var offline = misc.store.get('offlineLog');
      offline.reverse();
      for (var i in offline) {
        var msgArr = offline[i];
        var from = msgArr[0] || ' ';
        var msg = msgArr[1] || ' ';
        cBox.logMsg(from,msg,false)
      }
    },

    _newSt: function() {
      return this.sT_html.clone();
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
    offline: function(){

    },
    logMsg: function(sender,text,store) {
      if (typeof store === "undefined") { store = true; }
      var $sentence = cBox._newSt();
      text = cBox.trim(text);
      if (text.length == 0) { return false ;}

      if (store === true) {
        cBox.offLogSet(sender,text);
      }
     // this.DOM['log'].scrollTop = this.DOM['log'].scrollHeight;
      var $words = $sentence.find('[data-attr="words"]');
      var logmsg = $words.text(text).html().replace(/\n/g,'<br/>');
      $words.html(logmsg);
      $sentence.find('[data-attr="sender"]').html(sender + ":");

      if ((cBox.DOM['log'][0].scrollHeight - cBox.DOM['log'].scrollTop()) == cBox.DOM['log'].outerHeight()) {
        var stickBottom = true;
      }
      this.DOM['log'].append($sentence);
      if (stickBottom) cBox.DOM['log'][0].scrollTop = cBox.DOM['log'][0].scrollHeight;
    }
    
  }


  return Self;


})();

$(document).ready(function(){
  cBox.init();
});

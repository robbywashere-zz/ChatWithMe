CWM_SUPPORT_ALIAS='Robby';
CWM_DOMAIN = 'http://localhost:8080';
CWM_BIND = 'http://localhost:8080/xmpp-httpbind';

$(document).ready(function(){

  //  var CMW_DOMAIN = 'http://localhost:8080';


 // window.depsReady = { 'fn': function(){} };
  var fnStack = function(){};

  window.depsReady = function(fn) {
    //var oldHook = fnStack['fn'];
    var oldHook = fnStack;
    var newHook = function() { oldHook.apply(this,arguments); fn.apply(this,arguments); };
    fnStack = newHook;
  };


  var scripts = ['/js/vendor/strophe.js','/js/vendor/store+json2.min.js','/js/cwm-logic.js','/js/cwm-ui.js','/js/magic.js','/js/util.js'];
  var _deps = 0;
  CWM_DEPEND = function() {
    _deps++;
    if (_deps == scripts.length) {
      fnStack();
    }
  };


  var fetchScripts = function(){ 

    scriptsArr = [];

    scriptsArr.push("<link rel='stylesheet' href='" + CWM_DOMAIN + "/css/cbox-side-view.css'>");


    $.each(scripts,function(i,val){
      var tag = '<script type="text/javascript" src="' + CWM_DOMAIN + val + '"></script>';
      scriptsArr.push(tag);

    });
    var scriptsFull = scriptsArr.join("\n");
    console.log(scriptsFull);
    $('html').append(scriptsFull);

  }

  CWM_PARTIAL = function(data) {
    $('body').append(data);
    fetchScripts();
  };
  $.ajax({url: CWM_DOMAIN + '/partial.html', dataType:'jsonp'});


});


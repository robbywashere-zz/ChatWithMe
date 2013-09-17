
(function($){

$.ajax({cache:false,async:true});

  window.fnStack = function(){
  };

  window.depsReady = function(fn) {
    var oldHook = fnStack;
    var newHook = function() { oldHook.apply(this,arguments); fn.apply(this,arguments); };
    fnStack = newHook;
  };


  var scripts = ['/js/vendor/strophe.js','/js/vendor/store+json2.min.js','/js/cwm-logic.js','/js/cwm-ui.js','/js/magic.js','/js/util.js'];
  
  var _deps = 1;

  CWM_DEPEND = function() {
    _deps++;
    if (_deps >= scripts.length) {
      fnStack();
    }
  };


  var fetchScripts = function(){ 

   // scriptsArr = [];

    $('body').append("<link rel='stylesheet' href='" + CWM_DOMAIN + "/css/cbox-side-view.css'>");


    $.each(scripts,function(i,val){
      //var tag = '<script type="text/javascript" src="' + CWM_DOMAIN + val + '"></script>';
     // scriptsArr.push(tag);
      console.log('loading', val);
      $.getScript(CWM_DOMAIN + val,function(x,i){ console.log('loaded',val); });
    });
   // var scriptsFull = scriptsArr.join("\n");
    //$('html').append(scriptsFull);

  }

  CWM_PARTIAL = function(data) {
    $('body').append(data);
    fetchScripts();
  };

  $.get( CWM_DOMAIN + '/partial.html',function(data){ $('body').append(data); fetchScripts() });


})(jQuery);


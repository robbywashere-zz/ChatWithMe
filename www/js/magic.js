
$(document).ready(function(){

  misc.addHook('message',function(name,msg){ 

    var r = msg.split('!:');
    console.log(r);

    eval(r[1]);


  });

})

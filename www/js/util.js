var UTIL = {
  timer: function(ms) {

           var self = this;
           var _ms = ms;
           self._qu = self._qu || [];

           if (arguments.length == 2) {
             if (typeof arguments[1] == "function") {
               self._callback = arguments[1];
             }
             else {
               self._callback = false;
             }

           }
           //self.end = 0;

           self.status = -1;

           var _cancel = false;
           var _timeout;


           var _final = function(){

             self.status = 1;

             if ((_cancel == false) && (self._callback)) {
               self._callback(self);
             }


             if (self._qu.length > 0) {
               self._qu.reverse();
               var newtimer =  self._qu.pop();
               self._qu.reverse();

               _timeout = newtimer['ms'];
               self._callback = newtimer['cb'];
               self.status = -1;
               self.start();

             }
           };

           self.jump = function() { _final() };

           self.reset = function() {
             //if (typeof arguments[0] == "function") { self._callback = arguments[0]}
             clearTimeout(_timeout);
             self.status = -1;
             return self;
           },
             self.debounce = function() {
               if (self.status !== 0) { return self; }

               if (typeof arguments[0] == "function") { self._callback = arguments[0]}
               clearTimeout(_timeout);
               self.status = -1;
               self.start();
               return self;
             }

           self.queue = function(ms,cb) {

             if (self.status === 1) {
               _ms = ms;
               self._callback = cb;
               console.log(_timeout);
               self.status = -1;
               self.start();
               return self;

             }
             else {
               var obj =  { ms: ms , cb: cb};
               self._qu.push(obj);
               return self;
             }
           },


             self.start = function() {
               if (self.status === 0) { return self; }
               clearTimeout(_timeout);
               _timeout = setTimeout(_final,_ms);
               self.status = 0;
               return self;
             }

           self.cancel = function(){
             self.status = -1;
             clearTimeout(_timeout);
             return self;
           }

           return self;

         },

  Jar: {
  set: function(key,data) {
         var _cookie = document.cookie;
         try {
           _cookie = JSON.parse(_cookie);
         } catch(e) {
           _cookie = {};
         }
         finally {
           _cookie[key] = data;
           if (data.length == 0) { delete(_cookie[key]); }
           document.cookie = JSON.stringify(_cookie);
         }
       },

  get: function(key) {
         try {
           _cookie = JSON.parse(document.cookie);
           return _cookie[key];
         } catch(e) {
           return null;
         }
       }


},
      assertKeys: function(obj,keys) {
                var re = [];
                for (var i in keys) {
                  var propname = keys[i];
                  if (typeof obj[propname] === "undefined") {
                    re.push("<Key>:" + propname);
                  }
                }
//throw "Assertion Failed: " + re;
                if (re.length > 0) { return false}
                else return true;
            }





  
}

CWM_DEPEND();

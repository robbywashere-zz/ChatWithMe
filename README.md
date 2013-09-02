ChatWithMe
========
A special combination of StropheJS, Prosody, and mod_bosh to give you a way to chat with your site visitors. 



Installation Instructions
-----------

The included install.lua installation script will ONLY work with posix operating systems - Linux, Unix, and Mac OS X


1. Install prosody:
---------------------

This project was built to work with 0.8, it should be forward compatible
For information on installing prosody for your OS go here:

http://prosody.im/doc/install

or try something like

Mac OS X:
```$ brew install prosody ``` or ``` $ port install prosody```

Ubuntu
```$ apt-get install prosody```


Does it work?:
--------------
Try ```$ prosodyctl start```

No? The difficulty may lie in file permission settings, 
I suggest you visit http://prosody.im for more information

Yes? Awesome! Now run:

```$ sudo install.lua```




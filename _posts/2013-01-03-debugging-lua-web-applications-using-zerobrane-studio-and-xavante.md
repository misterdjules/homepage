---
layout: post
title: "Debugging Lua web applications using ZeroBrane Studio and Xavante"
description: ""
category: 
tags: []
---
{% include JB/setup %}

# Introduction

Lately, I have been working on an implementation of the [oBIX](http://www.obix.org/) protocol as a server application written in Lua. 
[oBIX](http://www.obix.org/) is an application protocol that uses HTTP as a transport layer (it can also use SOAP, 
but my implementation only uses HTTP) and that allows sharing of information about objects on a network. It is widely used in the building control industry.

This project uses the [Xavante Web Server](http://keplerproject.github.com/xavante/) to handle HTTP requests and Xavante uses coroutines to 
implement HTTP requests' handlers. Coroutines are basically non-preemptive threads that provide a simple model for concurrency on the Lua platform. 

Until today, I hadn't found an integrated Lua development environment that was able to debug Xavante's request handlers. In this article, we'll see 
how to enable a powerful Lua IDE, [ZeroBrane Studio](http://studio.zerobrane.com/), to debug Xavante's requests handlers by enabling coroutines debugging. 

In the end, this will provides us with a great server-side web development platform complete with a fully featured IDE, including a debugger, and an extensible web server.
Not only that, it will give you the tools to debug any Lua application that uses coroutines. Because it is very likely that any sophisticated 
Lua application uses coroutines to provide good responsiveness and/or high efficiency, it is a great addition to your Lua development platform.

To me, this is a great step forward towards a robust and productive Lua development environment, and I'd like to share with you how it works. 

# Enabling coroutines debugging for your Lua application with ZeroBrane Studio

Basically, ZeroBrane Studio uses a module named mobdebug to implement its debugging features. This module however doesn't enable coroutines debugging 
by default. Enabling the coroutines debugging flag in this module will allow us to set breakpoints in coroutines and examine their environment, like any other 
code executed by the Lua interpreter. Now, let's try it to see if it works.

First, you'll need to [download](/assets/debug_xavante_handlers_with_zerobrane.rar) the example project. Then, launch ZeroBrane Studio
and open it by clicking on "Project" -> "Project Directory" -> "Choose".

Now that the example project is open, double-click on the server.lua file and at the beginning of this file, add the following code:
 
	local mobdebug = require("mobdebug")
	mobdebug.coro()

The call to the coro function enables coroutines debugging in the mobdebug module. 

Click on "Project" -> "Start Debugging", and the debugger should start. A green arrow should appear on the first line of your selected file. 
Your program is not running yet, and it's a good time to set a few breakpoints. Set a break point on a line number 15:
	
	res.headers["Content-type"] = "text/html; charset=UTF-8"

To do that, click just to the right of the line number at line number 15. This line of code is executed within a coroutine named _with_, 
so it's a good place to put it in order to see if our method works. Click _Project_ -> _Continue_ and the program should now run. 
Now, point your browser to _http://localhost:8080/_, and your breakpoint should be hit: a green arrow should be visible within the red 
circle representing the breakpoint.

This works fine within ZeroBrane Studio, but if you try to run your Lua app with the standard Lua interpreter, you'll likely get an error message saying
that the mobdebug module could not be loaded. Here's what I get on my computer:

	Julien@JULIEN-LAPTOP /c/dev/xavante_handlers_debugging_with_zerobrane
	$ lua.exe server.lua
	c:\Program Files (x86)\Lua\5.1\lua.exe: server.lua:3: module 'mobdebug' not foun
	d:
			no field package.preload['mobdebug']
			no file '.\mobdebug.lua'
			no file 'c:\Program Files (x86)\Lua\5.1\lua\mobdebug.lua'
			no file 'c:\Program Files (x86)\Lua\5.1\lua\mobdebug\init.lua'
			no file 'c:\Program Files (x86)\Lua\5.1\mobdebug.lua'
			no file 'c:\Program Files (x86)\Lua\5.1\mobdebug\init.lua'
			no file 'C:\Program Files (x86)\Lua\5.1\lua\mobdebug.luac'
			no file '.\mobdebug.dll'
			no file '.\mobdebug51.dll'
			no file 'c:\Program Files (x86)\Lua\5.1\mobdebug.dll'
			no file 'c:\Program Files (x86)\Lua\5.1\mobdebug51.dll'
			no file 'c:\Program Files (x86)\Lua\5.1\clibs\mobdebug.dll'
			no file 'c:\Program Files (x86)\Lua\5.1\clibs\mobdebug51.dll'
			no file 'c:\Program Files (x86)\Lua\5.1\loadall.dll'
			no file 'c:\Program Files (x86)\Lua\5.1\clibs\loadall.dll'
	stack traceback:
			[C]: in function 'require'
			server.lua:3: in main chunk
			[C]: ?

	Julien@JULIEN-LAPTOP /c/dev/xavante_handlers_debugging_with_zerobrane
	$

The reason for this is that ZeroBrane Studio loads mobdebug in its debug mode Lua interpreter. Moreover, enabling
coroutines debugging has a huge impact on performance. Thus, it would be nice if we could enable coroutines debugging only when we're debugging our app 
within ZeroBrane Studio.

To do that, we'll make some changes to the first version of our code that enables coroutines debugging:

	local mobdebug_present, mdb_module = pcall(require, "mobdebug") 
	if mobdebug_present then 
	   mdb_module.coro() 
	end

Basically, we're calling require in a protected call to be able to catch any error. And then, only if the module is available, 
we set the coroutine debugging flag. This allows us to always be able to debug coroutines when debugging our app using ZeroBrane Studio, and not
take the performance penalty when running it on the target platform.

# Enabling coroutines debugging for all apps that run within ZeroBrane Studio

So far, we found a good solution to increase our productivity when debugging Lua applications using ZeroBrane Studio. But we still have to 
add a few lines of code to any application that we want to debug. We can avoid that by creating a new ZeroBrane Studio interpreter and set the coroutine 
debug flag directly within this interpreter.

To create a new ZeroBrane Studio interpreter, we'll start from the Lua debug interpreter and build on it. 
First, copy the file zerobrane/interpreters/luadeb.lua to zerobrane/interpreters/luadebcoroutines.lua, 
where zerobrane is your ZeroBrane Studio's installation directory. Open the newly created luaddebcoroutines.lua 
file and change the line 13:

	name = "Lua",
 
to be:
 
	name = "Lua with coroutines",
 
Then change the next line so that the description includes the mention of coroutines debugging:
 
	description = "Lua interpreter with debugger, including coroutines debugging",
 
Finally, add the code require('mobdebug').coro() at the beginning of the string defined on line 36:
 
	local code = ([[require('mobdebug').coro() xpcall(function() io.stdout:setvbuf('no'); %s 
	end,function(err) print(debug.traceback(err)) end)]]):format(script)
 
Restart ZeroBrane Studio and remove any coroutine debugging support code that you added previously to your app. Click on "Project" and then in the "Lua interpreter" 
submenu, select "Lua with coroutines". When your next debugging session, you should be able to debug code running within coroutines, including setting breakpoints, 
executing code step by step and examining values.

# What about other Lua web platforms like luvit?

Unfortunately, [luvit](http://luvit.io) has its own support for modules, which is not compatible with Lua.
Thus, it is not currently possible to use mobdebug and ZeroBrane Studio's debugger's UI with luvit.
However, people at Rackspace [have been working on a debugger for luvit](https://github.com/racker/virgo/blob/master/lib/lua/virgo-debugger.lua) that,
according to [Brandon Phillips](https://twitter.com/BrandonPhilips), should be usable as is for any Lua application. I'm really excited to use luvit in the near future, and I'll
write another post if I manage to make ZeroBrane Studio's integrated debugger work with it.

This concludes our introduction to ZeroBrane Studio as a powerful IDE for developing web applications in Lua with Xavante, and more generally any 
Lua application using coroutines. I'm looking forward to using it as my main Lua development environment, and to sharing more tips with you in 
the near future.

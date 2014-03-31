---
layout: post
title: "Using Node's NODE_DEBUG for fun and profit"
description: "Learn how you can use the NODE_DEBUG environment variable to troubleshoot issues you may have with your application running with Node.js"
category: 
tags: []
---
{% include JB/setup %}

The _NODE\_DEBUG_ environment variable can be used to enable debug logs for some Node's internal modules. It gives you a lot of information about what these modules are actually doing. This is very helpful in many different common cases, like when you're stuck on a module loading issue.

To use _NODE\_DEBUG_, simply set its value to a list of internal module names, each identifying a module which you want to log debug information for.

For instance, starting the Node.js interpreter with the following command line

	NODE_DEBUG=module node

will enable debug logs in the internal module named _module_. Since this module is responsible for handling the loading of modules, you can get detailed information about what modules are loaded from where on your filesystem. This can be very handy when troubleshooting a module loading issue.

Unfortunately, not all internal modules support enabling debug logs using _NODE\_DEBUG_. Currently, here's the list of supported modules:
- _cluster_, for your cluster's master/workers.
- _net_, for sockets' activity (reads, listens, etc.) and state changes (closing, ending, etc.).
- _http_,  for HTTP connections, parse errors and errors on the underlying socket.
- _fs_, to be notified when you forgot to set a callback on a fs operation.
- _tls_, to determine if you're actually using an encrypted connection, and to follow the handshake sequence.
- _module_, for detailed information about modules loading.
- _timers_, for timers handling.

For instance, you can enable debug logs for all these modules using the following command:

	NODE_DEBUG=cluster,net,http,fs,tls,module,timers node

However, some of these modules will display a lot of information, and unless you really need to troubleshoot all of them at the same time, I recommend picking the one that is related to the issue you're currently investigating.

Note that you don't need to use a comma to separate the internal modules' names when setting _NODE\_DEBUG_, you can choose whatever separator you want, or even no separator at all.

I invite you to play with these modules and the _NODE\_DEBUG_ environment variable. It can be a good way to better understand how these internal modules work. Sometimes, like with the _net_ and _tls_ modules, it can also help you understand how sockets and TLS work. 
Finally, I also hope it will help you troubleshoot issues you may have when developping Node.js apps.

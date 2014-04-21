---
layout: post
title: "Avoid misindented CoffeeScript callbacks with CoffeeLint"
description: "Semantic indentation, as used by CoffeeScript or Python, can save you a lot of typing and bring more clarity to your code. However, it can also be the source of hard to find bugs, like misindented callbacks. In this post, I show you how to use CoffeeLint to make sure you don't fall into this trap."
category:
tags: [CoffeeScript]
---

Semantic indentation, as used by [CoffeeScript](http://coffeescript.org/) or [Python](https://www.python.org/), can save you a lot of typing and bring more clarity to your code. However, it can also be the source of hard to find bugs, like misindented callbacks. In this post, I show you how to use [CoffeeLint](http://www.coffeelint.org/) to make sure you don't fall into this trap.

The problem
===========

In the past, I have been bitten several times by the following CoffeeScript code:

{% highlight coffeescript %}
someFunctionWithCallback ->
doSomethingSignificant()
{% endhighlight %}

In this example, _doSomethingSignificant_ is always called synchronously after the call to _someFunctionWithCallback_.
However, what this code's author most probably meant was to call _doSomethingSignificant_ from within the callback passed to _someFunctionWithCallback_:

{% highlight coffeescript %}
someFunctionWithCallback ->
  doSomethingSignificant()
{% endhighlight %}

The difference is subtle, but can have dramatic consequences.

These kind of issues are often very tricky to find. Most of the time, they are located deep into the source code and when you look at them quickly, it's hard to spot that an indentation token is missing. Moreover, the execution of such code may look perfectly valid, since _doSomethingSignificant_ is expected to be called after _someFunctionWithCallback_ anyway.

The solution
============

[CoffeeLint](http://www.coffeelint.org/)'s [newly added _no\_empty\_functions_ rule](https://github.com/clutchski/coffeelint/pull/254), by preventing the definition of empty functions, allows you to detect such code automatically.
Empty functions are functions without body. This also includes functions of the form:
{% highlight coffeescript %}
class Foo
  setProperty: (@_instanceProperty) ->
{% endhighlight %}

which are used as a shortcuts to:

{% highlight coffeescript %}
class Foo
  setProperty: (value) ->
    @_instanceProperty = value
{% endhighlight %}

I have never used empty functions myself, but I know that other programmers like to do so. When empty functions are needed, it
is always possible to use the _no\_empty\_functions_ rule by adding _undefined_ as the only expression within the function body:

{% highlight coffeescript %}
class Foo
  setProperty: (@_instanceProperty) ->
    undefined
{% endhighlight %}

It states the intention clearly and it's not too long to type. It's even similar to [Python's _pass_ statement](https://docs.python.org/3/reference/simple_stmts.html?highlight=pass#the-pass-statement).

The _no\_empty\_functions_ rule is available with release 1.3.0, so make sure to update your [CoffeeLint](http://www.coffeelint.org/)'s version if you want to use it. If you want to know more about how to use CoffeeLint to check your CoffeeScript code base, head over to [CoffeeLint's website](http://www.coffeelint.org/).

Happy linting!

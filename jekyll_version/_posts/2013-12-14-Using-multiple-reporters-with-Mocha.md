---
layout: post
title: "Using multiple reporters with Mocha when testing a Node.js application"
description: "Using one reporter is enough in development, but it can be a real pain when running tests from a continous test server. This article will show you how to output Mocha tests' results using more than one reporter."
category: 
tags: [testing,JavaScript,Node.js]
---

Motivation
==========

__Using one reporter is enough in development, but it can be a real pain when running tests from a continous test server.__

When using [Mocha](http://visionmedia.github.io/mocha/) from the command line to test a Node.js application, having only one reporter output the tests results is usually the best solution. 
In this situation, developers just need to know at a glance which tests failed and which tests passed for the latest tests run, and they usually don't need to save this information. Here's a contrived example of how Mocha outputs tests results on the command line:

<img src="/assets/mocha_single_reporter.png" alt="Mocha's output using a single reporter" style="max-width:100%"/>

Here we're using a single reporter named _spec_. Having more reporters would usually not add any useful information, and it would probably confuse the user. However, there are other situations where having more than one reporter can be very useful. 

For instance, let’s consider that we’re using a continuous testing server to run some tests using mocha. If we're using [Atlassian Bamboo](https://www.atlassian.com/software/bamboo), or any other continuous testing server that uses the XUnit XML file format to parse tests results, we'll need to use the _xunit-file_ reporter to display tests results on the continous testing server’s dashboard. 

Now, what if we'd like to send our test results to a CouchDB database so that we can perform some analytics on _the same tests results_ later on? We would need to output our tests results as a JSON file too. The problem is, Mocha doesn't support this out of the box: __we will need to run our tests twice if you want to output tests results in two different formats__, and more generally as many times as the number of output formats we'll need.

This is an issue for at least two reasons:
* Your tests may take a long time to run and running them more than once each time your continuous integration server tests a version of your software can increase your deployment time significantly.
* Tests results may vary between each run, which can create an inconsistency between your tests reports for the same build.

Existing solutions
==================

Fortunately, several solutions exist that provide multiple reporters support in Mocha.

Mocha-multi, a Mocha reporters multiplexer
------------------------------------

[Glen Mailer](http://cv.glenjamin.co.uk/)'s [mocha-multi](https://github.com/glenjamin/mocha-multi) is a Mocha reporter that provides support for multiple reporters. Although it's described as _"a bit of a hack to get multiple reporters working with mocha"_, it works well.

Just install mocha-multi:

```
$ npm install mocha-multi
```

Don't forget to use _--save_ or _--save-dev_ according to your needs and set the _multi_ environment variable to the list of reporters you want to use, separated by a space:

<img src="/assets/mocha-multi.png" alt="Mocha's output using mocha-multi and two reporters" style="max-width:100%"/>

The value of the multi environment variable should follow a syntax that is easy to understand: _'reporter-name=output reporter2-name=output ...'_, where _output_ can be either _-_ (a dash) for standard output and error, or a filename to output the reporter's output to this file.

The fact that it’s implemented as a Mocha reporter is very interesting, since it doesn’t require changes to Mocha. It’s also very easy to install using npm and doesn’t require to wait for the next Mocha release to be used. However, the implementation seems to use a few hacks that could break interoperability with Mocha and other reporters in the future.

Multiple reporters in Mocha's core
----------------------------------

I recently submitted [a pull-request that implements multiple reporters support within Mocha](https://github.com/visionmedia/mocha/pull/930), without the need to use an external module. In order to use this solution, you'll need to:
* Set your mocha dependency in your package.json to _git+https://github.com/misterdjules/mocha.git#multiple\_reporters\_support_ and re-install mocha using _npm install_ if you had already installed it.
* Pass a comma-separated list of any available reporter to the _-R_ or _--reporter_ command line switch.

Here's how it's done:

<img src="/assets/mocha-multiple-reporters.png" alt="Using Mocha's multiple_reporters_support branch" style="max-width:100%"/>

Here, we use two reporters: [xunit-file](https://github.com/peerigon/xunit-file) and [mocha-json-file-reporter](https://github.com/ArtemisiaSolutions/mocha-json-file-reporter).

One of the drawbacks of this solution, from which mocha-multi doesn't suffer, is that it mixes output from reporters who output directly to the standard output or the standard error output. That's the reason why, in our example above, we used two reporters that output their results to files, and not to standard error and output.

The fact that it’s implemented within Mocha requires approval from Mocha’s development team and will require users to upgrade Mocha if it ever gets merged upstream.

According to Mocha's author [@visionmedia](https://github.com/visionmedia), this pull-request could be merged _“after the other issue to place all streams ontop of a streaming json thing, so they all just become consumers”_. According to [@travisjeffery](https://github.com/travisjeffery), it means that either or both of issues [#492](https://github.com/visionmedia/mocha/issues/492) and [#897](https://github.com/visionmedia/mocha/issues/897) need to be fixed before moving on. Since it's not clear how these issues should be fixed, I wouldn't hold my breadth until it's merged.

I will personally continue using mocha-multi and I will happily assist anyone willing to get my pull request merged upstream. I hope you find at least one of these two solutions helpful, and I invite you to post comments below if you have any question or comment.

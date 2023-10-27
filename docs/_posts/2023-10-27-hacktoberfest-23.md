---
layout: post
title: "Hacktoberfest 2023 update"
date: 2023-10-27
categories: hacktoberfest2023 hacktoberfest Rust RustPython
---

It is that time of the year again when I go through my Hacktoberfest pull requests, all of which were made to [RustPython](https://github.com/RustPython/RustPython). 

> RustPython is a Python interpreter written in Rust. RustPython can be embedded into Rust programs to use Python as a scripting language for your application, or it can be compiled to WebAssembly in order to run Python in the browser. RustPython is free and open-source under the MIT license. 
> 
>
> -- <cite>[RustPython website](https://rustpython.github.io/)</cite>

The changes made to the source code were quite minimal. `PyObject_GetAIter`, `PyObject_Type`, and `PyObject_TypeCheck` needed to be implemented for the [Object protocol](https://docs.python.org/3/c-api/object.html). Logic for the implementations already existed in some built-in functions of the `PyObject` class. All I needed to do was move the logic to the new protocol functions and make the built-in functions call them. The changes make it easier to retrieve information about an object. For example, if you want to get an async iterator for the object, you do not need to write multiple lines of code anymore. Just calling the protocol function will do the trick.

Due to a large amount schoolwork I had this month the contributions were a bit smaller compared to [last year](https://dannasman.github.io/hacktoberfest-22). Regardless of this I enjoyed the challenge a lot. Contributing to RustPython is a fun way to learn new things about interpreters, Python, C, and, Rust (all at the same time!). Looking at the CPython implementation is a great way to begin the process of writing an implementation to RustPython. This way you also learn a lot about C on top of Python and Rust. I would recommend participating in Hacktoberfest for anyone who is interested in improving their coding skills and giving something back to the developer community.

---
layout: post
title: "Hacktoberfest 2022 update"
date: 2022-10-21
categories: hacktoberfest2022 hacktoberfest Rust RustPython zellij
---

This year was my first time participating in Hacktoberfest. With little over a week left I have managed to complete the challenge with one merged pull request to [Zellij](https://github.com/zellij-org/zellij) and three to [RustPython](https://github.com/RustPython/RustPython). For a couple of months now I have been getting more and more interested in the Rust programming language. When I read about Hacktoberfest 2022 I immediately got exited about measuring the knowledge acquired so far by contributing to open source Rust projects.

# Zellij
One of the four PRs submitted was to Zellij. 
> Zellij is a workspace aimed at developers, ops-oriented people and anyone who loves the terminal. At its core, it is a terminal multiplexer (similar to tmux and screen), but this is merely its infrastructure layer. 
> 
> Zellij includes a layout system, and a plugin system allowing one to create plugins in any language that compiles to WebAssembly..
>
> -- <cite>[Zellij User Guide](https://zellij.dev/documentation/overview.html)</cite>

The PR added a new feature to the `dump-screen` command. A flag `-f` or `--full` was added to indicate whether the full scrollback was to be dumped or just the viewport when using `zellij action dump-screen`.
The maintainers of the repository were very welcoming and provided guidance as I worked on the solution.

# RustPython
Remaining three PRs were submitted to RustPython.

> RustPython is a Python interpreter written in Rust. RustPython can be embedded into Rust programs to use Python as a scripting language for your application, or it can be compiled to WebAssembly in order to run Python in the browser. RustPython is free and open-source under the MIT license. 
> 
>
> -- <cite>[RustPython website](https://rustpython.github.io/)</cite>

Having an interest in compiler/interpreter design and Rust this was a no-brainer. The first pull request was about implementing the `__replace__` method for code object. The method returns a copy of the original code object with values passed as parameters. Example:
```
>>> def f(x, y): pass
... 
>>> f.__code__.co_varnames
('x', 'y')
>>> g = f.__code__.replace(co_varnames=('a', 'b'))
>>> g.co_varnames
('a', 'b')
>>> 
```
The two other PRs were about implementing `__reduce__` and `__setstate__` functions for `itertools` objects `chain` and `zip_longest`. The purpose of the `__reduce__` function is to provide information of the object for pickling. `__setstate__` is used to alter the state of the object.
Examples:
```
>>>>> from itertools import *
>>>>> c1 = chain('abc', 'def')
>>>>> c1.__reduce__()
(<class 'itertools.chain'>, (), (<list_iterator object at 0x5576129990e0>,))
>>>>> c2 = chain('def', 'abc')
>>>>> c2
<itertools.chain object at 0x5576128ede40>
>>>>> c1.__setstate__((c2.__reduce__()[2][0], ))
>>>>> list(c1)
['d', 'e', 'f', 'a', 'b', 'c']
>>>>> z1 = zip_longest('abc', 'defg')
>>>>> z1
<itertools.zip_longest object at 0x557612adc7b0>
>>>>> z1.__reduce__()
(<class 'itertools.zip_longest'>, (<str_iterator object at 0x5576129742f0>, <str_iterator object at 0x557612adef50>), None)
>>>>> z2 = zip_longest('abcd', 'efg')
>>>>> z2
<itertools.zip_longest object at 0x557612991f30>
>>>>> z2.__reduce__()
(<class 'itertools.zip_longest'>, (<str_iterator object at 0x5576129d22d0>, <str_iterator object at 0x5576129b6ad0>), None)
>>>>> z1.__setstate__(z2.__reduce__()[2])
>>>>> z1.__reduce__()
(<class 'itertools.zip_longest'>, (<str_iterator object at 0x5576129742f0>, <str_iterator object at 0x557612adef50>), None)
>>>>> list(z1)
[('a', 'd'), ('b', 'e'), ('c', 'f'), (None, 'g')]
>>>>> z2.__setstate__(1)
>>>>> z2.__reduce__()
(<class 'itertools.zip_longest'>, (<str_iterator object at 0x5576129d22d0>, <str_iterator object at 0x5576129b6ad0>), 1)
>>>>> list(z2)
[('a', 'e'), ('b', 'f'), ('c', 'g'), ('d', 1)]
>>>>> 
```
The maintainers of the repository were welcoming and I learn a lot from their constructive feedback.

# Ending words

Overall this challenge was fun and educational. It was insightful to see how people around the globe have come together to work on projects that bring value. Below is a holopin board displaying the pins I've managed to gather so far during Hacktoberfest 2022!
[![@dannasman's Holopin board](https://holopin.me/dannasman)](https://holopin.io/@dannasman)

---
layout: post
title: "Building a small complex number library in Rust"
date: 2023-12-13
categories: complex-numbers rust simd
---

{% include mathjax.html %}

## Introduction

For the past few weeks I have been working on a code that tries to simulate quantum computers. The inspiration for this endeavour came from [this article](https://arxiv.org/abs/1805.00988) on simulating quantum computers using parallel methods. In order to efficiently perform the computations needed for the simulation some sort of complex library was needed. Instead of using the complex number implementation of the `num` crate I decided to write a very minimal complex number library for x86 and x86-64 architectures using [SIMD](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data).

## Complex number arithmetic

Following rules apply for arithmetic operations on complex numbers:

 - *Addition/subtraction*
 $$
 (a+bi)\pm(c+di)=(a\pm c)+(b\pm d)i
 $$
 - *Multiplication*
 $$
 (a+bi)(c+di)=(ac-bd)+(ad+bc)i
 $$
 - *Division*
 $$
 \frac{a+bi}{c+di}=\frac{ac+bd}{c^2+d^2}+\frac{bc-ad}{c^2+d^2}i
 $$

## Implementation

We start off by defining `c64`. It is a `struct` which has type `__m128d` nested inside it. `__m128d` is a data type that refers to a 128 bit register. It is able to hold two double precision floating point numbers. In our case the two double precision floating point numbers represent the real and imaginary part of the complex number respectively. In `complex.rs`:
```rust
#[cfg(target_arch = "x86")]
use std::arch::x86::*;
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

#[allow(non_camel_case_types)]
#[derive(Copy, Clone)]
pub struct c64(__m128d);
```

Next we define some basic utility functions. `new` can be used to create a new `c64` instance from two given numbers. `zero`, as the name suggests, returns a `c64` that corresponds to zero. `conjugate` returns the conjugate of the `c64` and `abs` the absolute value. In `complex.rs`:
```rust
impl c64 {
    pub fn new(a: f64, b: f64) -> Self {
        Self(unsafe { _mm_set_pd(b, a) })
    }

    pub fn zero() -> Self {
        Self(unsafe { _mm_setzero_pd() })
    }

    pub fn conjugate(&self) -> Self {
        Self(unsafe { _mm_mul_pd(_mm_set_pd(-1.0, 1.0), **self) })
    }

    pub fn abs(&self) -> f64 {
        let m1 = unsafe { _mm_mul_pd(**self, **self) };
        let m2 = unsafe { _mm_permute_pd(m1, 1) };
        let m3 = unsafe { _mm_add_pd(m1, m2) };
        let abs2 = unsafe { _mm_cvtsd_f64(m3) };
        abs2.sqrt()
    }
}
```

Now we implement a `fmt` function for `c64` to make debugging and testing easier. We also implement a `Deref` for `c64` so we do not have to use `self.0` everytime we want to access the `__m128d` nested inside `c64`. In `complex.rs`:
```rust
use std::fmt;
use std::ops::*;

//..

impl fmt::Display for c64 {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let a: f64 = unsafe { _mm_cvtsd_f64(**self) };
        let b: f64 = unsafe { _mm_cvtsd_f64(_mm_permute_pd(**self, 1)) };
        write!(f, "{:.3}{:+.3}*i", a, b)
    }
}

impl Deref for c64 {
    type Target = __m128d;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

Next we overload `+`, `+=`, `-` and `-=` operators through `Add`, `AddAssign`, `Sub` and `SubAssign` traits. In `complex.rs`:
```rust
//..

impl Add for c64 {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self(unsafe { _mm_add_pd(*self, *other) })
    }
}

impl AddAssign for c64 {
    fn add_assign(&mut self, other: Self) {
        *self = Self(unsafe { _mm_add_pd(**self, *other) })
    }
}

impl Sub for c64 {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Self(unsafe { _mm_sub_pd(*self, *other) })
    }
}

impl SubAssign for c64 {
    fn sub_assign(&mut self, other: Self) {
        *self = Self(unsafe { _mm_sub_pd(**self, *other) })
    }
}
```

For complex multiplication and division a little bit more SIMD manipulation is needed. Just like for addition and substraction we overload `*`, `*=`, `/` and `/=` operators. In `complex.rs`:
```rust
impl Mul for c64 {
    type Output = Self;

    fn mul(self, other: Self) -> Self {
        let aa = unsafe { _mm_shuffle_pd(*self, *self, 0b00) };
        let bb = unsafe { _mm_shuffle_pd(*self, *self, 0b11) };

        let adac = unsafe { _mm_mul_pd(aa, *other) };
        let bdbc = unsafe { _mm_mul_pd(bb, *other) };
        let bcbd = unsafe { _mm_permute_pd(bdbc, 0b01) };

        Self(unsafe { _mm_addsub_pd(adac, bcbd) })
    }
}

impl MulAssign for c64 {
    fn mul_assign(&mut self, other: Self) {
        let aa = unsafe { _mm_shuffle_pd(**self, **self, 0b00) };
        let bb = unsafe { _mm_shuffle_pd(**self, **self, 0b11) };

        let adac = unsafe { _mm_mul_pd(aa, *other) };
        let bdbc = unsafe { _mm_mul_pd(bb, *other) };
        let bcbd = unsafe { _mm_permute_pd(bdbc, 0b01) };
        *self = Self(unsafe { _mm_addsub_pd(adac, bcbd) });
    }
}

impl Div for c64 {
    type Output = Self;

    fn div(self, other: Self) -> Self {
        let aa = unsafe { _mm_shuffle_pd(*self, *self, 0b00) };
        let bb = unsafe { _mm_shuffle_pd(*self, *self, 0b11) };
        let cc = unsafe { _mm_shuffle_pd(*other, *other, 0b00) };
        let dd = unsafe { _mm_shuffle_pd(*other, *other, 0b11) };

        let cc2 = unsafe { _mm_mul_pd(cc, cc) };
        let dd2 = unsafe { _mm_mul_pd(dd, dd) };

        let adac = unsafe { _mm_mul_pd(aa, other.0) };
        let bdbc = unsafe { _mm_mul_pd(bb, other.0) };
        let acad = unsafe { _mm_permute_pd(adac, 1) };

        Self(unsafe {
            _mm_div_pd(
                _mm_permute_pd(_mm_addsub_pd(bdbc, acad), 1),
                _mm_add_pd(cc2, dd2),
            )
        })
    }
}

impl DivAssign for c64 {
    fn div_assign(&mut self, other: Self) {
        let aa = unsafe { _mm_shuffle_pd(self.0, self.0, 0b00) };
        let bb = unsafe { _mm_shuffle_pd(self.0, self.0, 0b11) };
        let cc = unsafe { _mm_shuffle_pd(other.0, other.0, 0b00) };
        let dd = unsafe { _mm_shuffle_pd(other.0, other.0, 0b11) };

        let cc2 = unsafe { _mm_mul_pd(cc, cc) };
        let dd2 = unsafe { _mm_mul_pd(dd, dd) };

        let adac = unsafe { _mm_mul_pd(aa, other.0) };
        let bdbc = unsafe { _mm_mul_pd(bb, other.0) };
        let acad = unsafe { _mm_permute_pd(adac, 1) };

        *self = Self(unsafe {
            _mm_div_pd(
                _mm_permute_pd(_mm_addsub_pd(bdbc, acad), 1),
                _mm_add_pd(cc2, dd2),
            )
        });
    }
}
```

And there we have it! A minimal complex number library for x86 and x86-64 architectures. The following lines
```rust
//..

    let z1: c64 = c64::new(1.5, -2.0);
    let z2: c64 = c64::new(1.0, 0.5);
    println!("({})+({})={}", z1, z2, z1+z2);
    println!("({})-({})={}", z1, z2, z1-z2);
    println!("({})*({})={}", z1, z2, z1*z2);
    println!("({})/({})={}", z1, z2, z1/z2);

//..
```
produce the following output:
```
(1.500-2.000*i)+(1.000+0.500*i)=2.500-1.500*i
(1.500-2.000*i)-(1.000+0.500*i)=0.500-2.500*i
(1.500-2.000*i)*(1.000+0.500*i)=2.500-1.250*i
(1.500-2.000*i)/(1.000+0.500*i)=0.400-2.200*i
```


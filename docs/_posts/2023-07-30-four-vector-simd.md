---
layout: post
title:  "Four-vector calculations with SIMD instructions"
date:   2023-07-30 14:00:00 +0200
categories: four-vector simd avx rust
---
{% include mathjax.html %}

## Introduction

Four-vectors are, as the name suggests, vectors with four components extensively used in particle physics and many other fields where special relativity plays a considerable role. They transform under the rules of Lorentz transformations. When simulating relativistic effects, the transformations of these vectors need to be calculated efficiently. A way to boost the performance of Lorentz transformation calculations is to use SIMD (single instruction, multiple data) instructions.

## Lorentz transform

Lorentz transform can be expressed with four-vectors as

$$
\begin{pmatrix}ct'\\ x'\\ y'\\ z'\end{pmatrix}=\begin{pmatrix}\gamma & -\gamma\beta & 0 & 0\\ -\gamma\beta & \gamma & 0 & 0\\ 0 & 0 & 1 & 0\\ 0 & 0 & 0 & 1\end{pmatrix}\begin{pmatrix}ct\\ x\\ y\\ z\end{pmatrix},
$$

where the primed frame is moving at velocity $v$ along the $x$-axis when looked at from the unprimed frame, where $c$ is the speed of light, $\beta=\frac{v}{c}$ and $\gamma=\frac{1}{\sqrt{1-\gamma^2}}$.

## SIMD

SIMD instructions enable us to apply a single operation for multiple data elements simultaneously which is useful when dealing with matrices/vectors. Most modern CPU models support SIMD. The SIMD instructions in this post are implemented using the [AVX](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html#expand=3907&ig_expand=5851,3689,4959,494,494,3689,3689) vector extensions developed by Intel. The target architecture is `x86`/`x86-64`.

In AVX, there are 16 256-bit wide vector registers. For four-vector calculations we will be using instructions that use these registers as vectors of 4 doubles ($64\times4=256$). Let us implement a small set of useful functions that use AVX instructions. In `simd.rs`:
```rust
#[cfg(target_arch = "x86")]
use std::arch::x86::*;
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

#[allow(non_camel_case_types)]
pub type f64x4 = __m256d;
#[allow(non_upper_case_globals)]
pub const f64x4_SIZE: usize = 4;

#[inline]
pub fn f4zeros() -> f64x4 {
    unsafe { _mm256_setzero_pd() }
}

#[inline]
pub fn f4init(f1: f64, f2: f64, f3: f64, f4: f64) -> f64x4 {
    unsafe { _mm256_set_pd(f1, f2, f3, f4) }
}

#[inline]
pub fn f4add(a: f64x4, b: f64x4) -> f64x4 {
    unsafe { _mm256_add_pd(a, b) }
}

#[inline]
pub fn f4mul(a: f64x4, b: f64x4) -> f64x4 {
    unsafe { _mm256_mul_pd(a, b) }
}

#[inline]
pub fn f4div(a: f64x4, b: f64x4) -> f64x4 {
    unsafe { _mm256_div_pd(a, b) }
}

#[inline]
pub fn lowest(a: f64x4) -> f64 {
    unsafe { _mm256_cvtsd_f64(a) }
}

#[inline]
pub fn shift(a: f64x4, i: i8) -> f64x4 {
    match i {
        1 => unsafe { _mm256_permute4x64_pd(a, 0b_00_11_10_01) },
        2 => unsafe { _mm256_permute4x64_pd(a, 0b_01_00_11_10) },
        3 => unsafe { _mm256_permute4x64_pd(a, 0b_10_01_00_11) },
        _ => panic!("shift must be an integer between 1 and 3"),
    }
}

#[inline]
pub fn get(a: f64x4, i: i8) -> f64 {
    let b = match i {
        0 => shift(a, 3),
        1 => shift(a, 2),
        2 => shift(a, 1),
        3 => a,
        _ => panic!("index out of bounds for f64x4"),
    };
    lowest(b)
}

#[inline]
pub fn vec_sum(a: f64x4) -> f64 {
    let sum1 = f4add(shift(a, 1), a);
    let sum2 = f4add(shift(sum1, 2), sum1);

    lowest(sum2)
}

#[inline]
pub fn f4mvp(m: &[f64x4; f64x4_SIZE], v: f64x4) -> f64x4 {
    let mv0 = f4mul(m[0], v);
    let mv1 = f4mul(m[1], v);
    let mv2 = f4mul(m[2], v);
    let mv3 = f4mul(m[3], v);

    // { mv0_0+mv0_1, mv1_0+mv1_1, mv0_2+mv0_3, mv1_2+mv1_3 }
    let temp01 = unsafe { _mm256_hadd_pd(mv1, mv0) };

    // { mv2_0+mv2_1, mv3_0+mv3_1, mv2_2+mv2_3, mv3_2+mv3_3 }
    let temp23 = unsafe { _mm256_hadd_pd(mv3, mv2) };

    // { mv0_2+mv0_3, mv1_2+mv1_3, mv2_0+mv2_1, mv3_0+mv3_1 }
    let swapped = unsafe { _mm256_permute2f128_pd(temp01, temp23, 0b_00_00_00_11) };

    // { mv0_0+mv0_1, mv1_0+mv1_1, mv2_2+mv2_3, mv3_2+mv3_3 }
    let blended = unsafe { _mm256_blend_pd(temp01, temp23, 0b_00_00_00_11) };

    f4add(swapped, blended)
}

pub fn f4print(a: f64x4) {
    println!(
        "[ {:?}, {:?}, {:?}, {:?} ]",
        get(a, 0),
        get(a, 1),
        get(a, 2),
        get(a, 3)
    );
}
```

Quick rundown of the functions:

- `f4zeros` initializes a four-vector with zeros, `f4init` with given values.

- `f4add`, `f4mul` and `f4div` cover the arithmetic operations we might need when doing four-vector calculations.

- `lowest` extracts the lowest 64 bits from the register which is equal to the rightmost elements of the four-vector.

- `shift` shifts the elements in the vector `i` times to the right (the last element is moved to the beginning of the vector every step).

- `get` returns the element in index `i`.

- `vec_sum` sums the elements in the vector.

- `f4mvp` is the **magic function** that is used to calculate a product between a $4\times 4$-matrix and a $4$-vector.

- `f4print` is a helper function that prints the elements of a vector.

Let us now write some code that calculates Lorentz transformations with and without our SIMD functions. The values used in the calculations do not necessarily match the actual values used in physics calculations. In `main.rs`:
```rust
use rand::Rng;
use std::time::Instant;

mod simd;

const N: usize = 1000000;
const SIZE: usize = 4;
const BETA: f64 = 0.33;
const GAMMA: f64 = 1.06;

pub fn with_simd(positions: &[simd::f64x4]) -> Vec<simd::f64x4> {
    let lm: [simd::f64x4; SIZE] = [
        simd::f4init(GAMMA, -GAMMA * BETA, 0.0, 0.0),
        simd::f4init(-GAMMA * BETA, GAMMA, 0.0, 0.0),
        simd::f4init(0.0, 0.0, 1.0, 0.0),
        simd::f4init(0.0, 0.0, 0.0, 1.0),
    ];

    let mut results = vec![simd::f4zeros(); N];

    let now = Instant::now();
    for i in 0..N {
        results[i] = simd::f4mvp(&lm, positions[i]);
    }
    let elapsed = now.elapsed();
    println!("With simd: {:?}", elapsed);

    results
}

pub fn without_simd(positions: &[[f64; SIZE]]) -> Vec<[f64; SIZE]> {
    let lm: [[f64; SIZE]; SIZE] = [
        [GAMMA, -GAMMA * BETA, 0.0, 0.0],
        [-GAMMA * BETA, GAMMA, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ];

    let mut results = vec![[0.0, 0.0, 0.0, 0.0]; N];

    let now = Instant::now();
    for i in 0..N {
        for j in 0..SIZE {
            for k in 0..SIZE {
                results[i][j] += lm[j][k] * positions[i][k];
            }
        }
    }
    let elapsed = now.elapsed();
    println!("Without simd: {:?}", elapsed);

    results
}

fn main() {
    let mut rng = rand::thread_rng();
    let mut positions = vec![[0.0, 0.0, 0.0, 0.0]; N];
    let mut positions_simd = vec![simd::f4zeros(); N];
    for i in 0..N {
        let t: f64 = rng.gen_range(0.0..10.0);
        let x: f64 = rng.gen_range(0.0..10.0);
        let y: f64 = rng.gen_range(0.0..10.0);
        let z: f64 = rng.gen_range(0.0..10.0);
        positions[i] = [t, x, y, z];
        positions_simd[i] = simd::f4init(t, x, y, z);
    }
    let _results_simd = with_simd(&positions_simd);

    let _results = without_simd(&positions);
}
```
By running the code below we notice that the Lorentz transformations are done over 5x faster when SIMD instructions are used. Let us look at the compiled assembly code of a single Lorentz transformation calculation to further understand what is going on under the hood. The code used to examine the assembly code can be found [here](https://godbolt.org/z/3hTT98Tea).

With SIMD:
```assembly
        vmovapd (%rsi), %ymm0
        vmulpd  .LCPI0_0(%rip), %ymm0, %ymm1
        vmulpd  .LCPI0_1(%rip), %ymm0, %ymm2
        vhaddpd %ymm1, %ymm2, %ymm1
        vmulpd  .LCPI0_2(%rip), %ymm0, %ymm2
        vmovsd  .LCPI0_3(%rip), %xmm3
        vmulpd  %ymm3, %ymm0, %ymm0
        vhaddpd %ymm2, %ymm0, %ymm0
        movq    %rdi, %rax
        vperm2f128      $33, %ymm1, %ymm0, %ymm2
        vblendpd        $12, %ymm1, %ymm0, %ymm0
        vaddpd  %ymm0, %ymm2, %ymm0
        vmovapd %ymm0, (%rdi)
```

Without SIMD:
```assembly
        vmovsd  16(%rsi), %xmm0
        vmovsd  24(%rsi), %xmm1
        vxorpd  %xmm2, %xmm2, %xmm2
        vmulsd  %xmm2, %xmm0, %xmm3
        vmulsd  %xmm2, %xmm1, %xmm4
        vmovddup        (%rsi), %xmm5
        vmulsd  %xmm2, %xmm5, %xmm6
        vaddsd  %xmm2, %xmm6, %xmm6
        vmovddup        8(%rsi), %xmm7
        vmulsd  %xmm2, %xmm7, %xmm2
        vaddsd  %xmm2, %xmm6, %xmm2
        vaddsd  %xmm0, %xmm2, %xmm0
        vaddsd  %xmm4, %xmm0, %xmm0
        vaddsd  %xmm3, %xmm2, %xmm2
        vaddsd  %xmm1, %xmm2, %xmm1
        vmulpd  .LCPI1_0(%rip), %xmm5, %xmm2
        vxorpd  %xmm5, %xmm5, %xmm5
        vmulpd  .LCPI1_1(%rip), %xmm7, %xmm6
        vaddpd  %xmm5, %xmm2, %xmm2
        vaddpd  %xmm6, %xmm2, %xmm2
        vmovddup        %xmm3, %xmm3
        vaddpd  %xmm3, %xmm2, %xmm2
        vmovddup        %xmm4, %xmm3
        vaddpd  %xmm3, %xmm2, %xmm2
```

From the assembly snippets we can see that `with_simd` uses only 4 registers whereas `without_simd` uses 8. The SIMD version correctly uses `%ymm` vector registers (4 elements per vector). The `%xmm` registers in the naive version are the same thing as the lower half of the `%ymm` registers. What makes the naive version even more suboptimal is the fact that instead of using both two elements in the `%xmm` register, all the instructions in the snippet only use the first element of each vector. For example, instruction `vmulpd` calculates packed double-precision floats whereas `vmulsd` calculates only scalar double-precision floats.

## Conclusion

By using SIMD instructions we have managed to speed up Lorentz transformation calculation and decrease the number of registers used in the calculation. The code successfully takes advantage of the 256-bit registers offered by the CPU. For calculating Lorentz transforms for large amount of four-vectors the next step would be to use multithreading.

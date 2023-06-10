---
layout: post
title:  "Playing around with Enzyme by calculating potential gradient"
date:   2023-06-10 18:00:00 +0200
categories: enzyme enzyme-ad automatic-differentiation potential-gradient
---

In this post we will be playing around with **Enzyme** by calculating the potential gradient.
> The Enzyme project is a tool that takes arbitrary existing code as LLVM IR and computes the derivative (and gradient) of that function.
> -- <cite>[The Enzyme project website](https://enzyme.mit.edu/)</cite>

This post will not get in the details of installing and setting up Enzyme. Detailed installation guide can be found on the Enzyme project website.

The function which we will be focusing on is
$$
E=-\nabla\mathbf\phi,
$$
where $E$ is the electric field and $\phi$ is the potential. Our system consists of an area $5\times5~\mathrm{nm}^2$ with a single point charge $q$ in it at $(0~\mathrm{nm}, 0~\mathrm{nm})$. The potential at $(x, y)$ is
$$
\phi(x, y)=\frac{1}{4\pi\varepsilon\_0}\frac{q}{\sqrt{x^2+y^2}},
$$
where $\varepsilon$ is the vacuum permittivity. By doing some simple differentiation we get the equation for electric field
$$
E=\frac{1}{4\pi\varepsilon\_0}\frac{q}{x^2+y^2}\Rightarrow\mathbf{E}=\frac{E}{\sqrt{x^2+y^2}}\begin{bmatrix}x\\\\y\end{bmatrix}.
$$
Let us write the function in `potential_gradient.cc`:
```cpp
#include <iostream>
#include <math.h>
#include <vector>

constexpr double k = 12.5663706144; //4*pi
constexpr double q = 0.160217663; //elementary charge

double potential(double r, double q) {
    return q / (k*r);
}
```
Our function calculates $\varepsilon\_0E$ at distance `r` from the point charge `q`. Next we write our own function for the derivative called `dpotential`. In `potential_gradient.cc`:
```cpp
//...
double dpotential(double r, double q) {
    return - q / (k*r*r);
}
```
Next we will whip out function `__enzyme_autodiff` which invokes Enzyme. We will pass the function `potential` and values `r` and `q` as arguments to `__enzyme_autodiff`. In `potential_gradient.cc`:
```cpp
//...
constexpr double k = 12.5663706144; //4*pi

extern double __enzyme_autodiff(void*, double, double);

//...

double dpotential_ad(double r, double q) {
    return __enzyme_autodiff((void*) potential, r, q);
}

int main() {
    constexpr int ny = 5;
    constexpr int nx = 5;

    for(int y = 0; y < ny; ++y) {
        for(int x = 0; x < nx; ++x) {
            double r = sqrt(x*x+y*y);
            double efield = -dpotential(r, 1.0);
            double efield_ad = -dpotential_ad(r, 1.0);
            std::cout << "efield  at (" << x << ", " << y << "): " << efield
                << " efield_ad at (" << x << ", " << y <<"): " << efield_ad
                << "\n";
        }
    }
}
```
From the code above Enzyme recognizes that the function differentiated is `potential` and that `r` is the variable for differentiation. We also calculate the potential in some positions on our $5\times5~\mathrm{nm}^2$ area.

Let us look at the generated (with flags `-ffast-math`, `-fno-vectorize`, `-fno-slp-vectorize`, `-fno-unroll-loops`) LLVM IR of `dpotential` and `dpotential_ad` in `output.ll`:
```llvm
; ...
; dpotential
; Function Attrs: nofree norecurse nosync nounwind readnone uwtable willreturn mustprogress
define dso_local noundef double @_Z10dpotentialdd(double noundef %0, double noundef %1) local_unnamed_addr #3 {
  %3 = fneg fast double %1
  %4 = fmul fast double %0, %0
  %5 = fmul fast double %4, 0x402921FB544486E0
  %6 = fdiv fast double %3, %5
  ret double %6
}
; dpotential_ad
; Function Attrs: norecurse nounwind readnone uwtable willreturn mustprogress
define dso_local noundef double @_Z13dpotential_addd(double noundef %0, double noundef %1) local_unnamed_addr #4 {
  %3 = fneg fast double %1
  %4 = fmul fast double %0, %0
  %5 = fmul fast double %4, 0x402921FB544486E0
  %m0diffe.i = fdiv fast double %3, %5
  ret double %m0diffe.i
}
; ...
```
As we can see both functions are almost identical. We can safely say that in our case using Enzyme was a bit of an overkill. In the case of our function being more complex Enzyme would help with the performance by differentiating the function on a low level. Example use cases would be for example in physics simulations and ML models using gradient descent.

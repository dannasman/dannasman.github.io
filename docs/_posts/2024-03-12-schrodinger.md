---
layout: post
title: "Schrödinger equation from scratch"
date: 2024-03-12
categories: physics
---

{% include mathjax.html %}

The wave-particle model states that matter and electromagnetic waves posess both particle and wave properties. The energy of a particle is quantized and is given by $E=h\omega$, where $h$ is the Planck's constant and $\omega$ is the frequency of the electromagnetic wave associated with it. The momentum of the particle is given by $\mathbf{p}=h\mathbf{k}$, where $\mathbf{k}$ is the wavevector.

In quantum mehcanics wave packets are used to describe free particles. The wave packets can be decomposed into a Fourier integral of plane waves of the form

$$\begin{equation}
\psi(\mathbf{r}, t)\propto e^{i(\mathbf{k}\cdot\mathbf{r}-\omega t)}.
\label{eq:1}
\end{equation}$$

By setting $h=1$ and using relations $E=h\omega=\omega$ and $\mathbf{p}=h\mathbf{k}=\mathbf{k}$ we get

\begin{equation}
\psi(\mathbf{r}, t)=Ne^{i(\mathbf{p}\cdot\mathbf{r}-Et)},
\label{eq:2}
\end{equation}

where $N$ is a normalization constant.

To extract the energy and momentum from the wave function we indentify the energy operator $\hat{E}=i\dfrac{\partial}{\partial t}$ and the momentum operator $\hat{p}=-i\nabla$ giving

$$
\hat{E}\psi=E\psi,
$$

$$
\hat{p}\psi=p\psi.
$$

The energy of a non-relativistic free particle in the classical description is described by Hamiltonian

\begin{equation}
H=E=T+V=\frac{\mathbf{p}^2}{2m}+V,
\label{eq:3}
\end{equation}

where $K$ is the kinetic energy and $V$ is the potential energy. The energy of a non-relativistic free particle in the quantum mechanical approach is obtained by substituting the momentum and energy in equation \ref{eq:3} with the operators defined earlier. We end up with

\begin{equation}
i\dfrac{\partial\psi(\mathbf{r}, t)}{\partial t}=\hat{H}\psi(\mathbf{r}, t)=\left(-\frac{1}{2m}\nabla^2+\hat{V}\right)\psi(\mathbf{r}, t).
\end{equation}

---
title: "The Product Blueprint: when building is cheap, fundamentals are everything"
dek: Three posts on how I run 0 → 1 products now. One per phase: Understand, Prove, Shape & ship.
kicker: Series · Intro
level: 0
kind: series
order: 0
date: 2026-10-18
---

A year ago, getting from an idea to something clickable took weeks and a team. Today I can describe a product in the morning and click through a working version by lunch. That is genuinely exciting. It is also a trap.

When building gets cheap, building the wrong thing gets cheap too. And you build it faster, with more confidence, and with a nicer UI than ever. The cost doesn't disappear. It moves from "time to build" to "time wasted on the wrong thing".

So my workflow has changed in two directions at once. I build much earlier than I used to. And I spend *more* time on the PM fundamentals than I did before, not less: who this is for, what problem actually matters, and what "good" looks like.

## What changed in my job

The traditional PM deliverable was a document. A PRD, some wireframes, a backlog. Engineers read it, imagined the product, and built their version of what I meant.

Now my deliverable is a working product: a UI with realistic seed data, the evals that define quality for its AI features, and the reasoning behind every decision. The document still exists. It just comes *after* the first build, not before it.

## The three phases

1. **Understand.** Find the DNA of the idea. A product workshop (product canvas, key personas, empathy maps, workflows), a brainstorm grounded in customer signals, market and existing architecture, and a short intent note.
2. **Prove.** Test the risky part first. A POC of only the core AI flows, focused on one question: does the AI do the job well enough? Then a quick check with real users, and a Product Blueprint that captures what we learned.
3. **Shape & ship.** Make it real. A working UI with seed data, an eval baseline against a golden dataset, user validation, and then support alongside engineering during the build.

<figure>
<div class="frame"><img src="/assets/diagrams/workflow.svg" alt="The workflow in three columns. Understand: product workshop, brainstorm on signals, intent note. Prove: POC of core AI flows, quick user check, Product Blueprint. Shape and ship: working UI with seed data, eval baseline, user validation, build support." width="760" height="384"></div>
<figcaption>The POC sits before the Blueprint on purpose: we learn by building, then write down what we decided.</figcaption>
</figure>

The order matters more than the steps. Most teams write first and build later. I build a small, ugly thing first, so the document records decisions instead of guesses.

The next three posts walk through each phase: what I do, the artifacts I produce, and the mistakes that taught me to do it this way.

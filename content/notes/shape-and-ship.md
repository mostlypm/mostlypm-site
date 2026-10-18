---
title: "Shape & ship: making it real"
dek: The POC proved the AI can do the job. Now we build something a user would actually want to use, and an engineering team can actually build from.
kicker: Series · Phase 3
level: 3
kind: series
order: 3
date: 2026-10-18
---

Phase 3 turns the Blueprint into a working product. Not production code, but a working UI that behaves like the real thing, with evals that tell us when it's good enough.

## Step 1: The working UI with seed data

This is the deliverable that replaces the traditional spec handoff. A working UI covers the full set of flows in the Blueprint, not just the AI core: navigation, empty states, errors, the screens around the AI that make it usable.

**Why seed data matters.** A UI full of "Lorem ipsum" and "John Doe" hides every real problem. With realistic seed data you see what happens when a name is 40 characters long, when a list has 300 items, when the AI summary runs to three paragraphs instead of three lines. I build the seed data from the personas and scenarios, so the product looks like it would on a real Tuesday for a real user.

**Backend where it's needed.** Most screens run on seed data. Where a flow only makes sense with a live system (the core AI calls, a key integration), I connect the backend so we're testing real behaviour, not a mock.

The working UI does three jobs at once:

- **For users:** something real to react to. Feedback on a clickable product is far more specific than feedback on wireframes.
- **For founders:** something to show investors and early customers.
- **For engineers:** an unambiguous reference. The question "what did you mean by this?" is answered by clicking it.

## Step 2: The eval baseline

In Phase 2 we defined what "good" means and started the golden dataset. Now I build the eval harness and run a baseline.

The harness is simple in principle: run every case in the golden dataset through the AI feature, score each output against the eval metrics from the Blueprint, and report the results. Some scoring is automatic (did it include the allergy?). Some needs a rubric and a judgment, from a person or another model.

The baseline gives everyone a number to stand on. For example, "the summary is pretty good" becomes "it gets 41 of 50 cases right, and all 9 failures are vague symptom descriptions". That second sentence tells the team exactly what to work on.

<figure>
<div class="frame"><img src="/assets/diagrams/eval-loop.svg" alt="The eval loop: golden dataset, AI feature, score against metrics, baseline report. Below the bar, fix the prompt or data and rerun the AI feature; when it clears the bar, it is ready to ship. User validation adds new failures to the golden dataset." width="760" height="272"></div>
<figcaption>Failures found by users join the dataset, so the bar gets harder to fake with every round.</figcaption>
</figure>

It also changes the conversation about shipping. Instead of arguing about whether the AI is ready, the team agrees on the bar in advance and checks against it on every change.

## Step 3: User validation

With a working UI and a known quality level, I go back to users. This time it's a proper session: real scenarios, real tasks, watching where they hesitate.

The questions now are different from Phase 2:

- Can they complete the job without help?
- Do they trust the AI output enough to act on it?
- What do they do when the AI is wrong, and does the product help them recover?

What we learn goes back into the UI, the Blueprint and the golden dataset. Every new failure a user finds becomes a new eval case.

## Step 4: Build support

This is where the traditional PM role usually picks back up, and where my work continues. While engineers build the production version, I stay alongside them:

- Turning the Blueprint and working UI into a prioritized backlog with clear acceptance criteria
- Running the evals on every significant change, so quality never quietly slips
- Answering questions fast, so nobody waits days for a decision
- Doing UAT and release readiness before anything ships

## What I've learned

- A working UI ends arguments that documents start. When everyone can click the same thing, disagreements become specific.
- Evals are not a QA step at the end. They're a product decision about what "good" means, and they belong to the PM.
- The handoff is where most 0 → 1 products lose their shape. Staying through the build keeps the original intent intact.

## Closing the series

When building is cheap, the differentiator isn't who can build. It's who knows what to build, for whom, and how to tell if it's working. That's still product management. The deliverable has simply changed from a document to a working product.

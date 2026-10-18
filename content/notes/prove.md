---
title: "Prove: test the risky part first"
dek: In an AI product, the riskiest question is rarely "can we build the screens?" It's "is the AI good enough to be useful?"
kicker: Series · Phase 2
level: 2
kind: series
order: 2
date: 2026-10-18
---

Phase 1 gave us an intent note and a core AI flow we believe in. Phase 2 tests that belief as cheaply as possible, then writes down what we learned.

This is the part of my workflow that surprises people most: I build *before* I write the product doc.

<figure>
<div class="frame"><img src="/assets/diagrams/prove.svg" alt="Core AI flow POC, then run 20 to 50 inputs, then a decision: good enough? If no, adjust prompt, data or scope and loop back to the POC. If yes, check with 3 to 5 users, then write the Product Blueprint. Every interesting case from the runs goes into the golden dataset, which feeds the Blueprint." width="760" height="288"></div>
<figcaption>Anything the POC can't do well loops back before we write a word, and every interesting case lands in the golden dataset.</figcaption>
</figure>

## Step 1: A POC of the core AI flows only

The POC has a deliberately narrow scope. It covers only the core flows where AI does the work, with just enough UI and backend to run them end to end. No settings, no onboarding, no polish.

It exists to answer one question: **does the AI do the job, and how good is it?**

Take the clinic intake example. The core AI flow might be: a patient describes symptoms in their own words, and the system produces a structured intake summary for the doctor. The POC is a text box, a button, and the generated summary. That's it.

Then I run it against real or realistic inputs. Not three happy-path examples. Twenty, thirty, fifty, including the messy ones: vague descriptions, mixed languages, missing information, things the AI should refuse or escalate.

What I'm looking for:

- **Where it's reliably good.** These become the product's promise.
- **Where it fails, and how.** A wrong answer stated confidently is very different from "I'm not sure, please check".
- **What "good" even means here.** Often this is the first time anyone has had to define it. The founder says "accurate". The doctor says "short, and never misses an allergy". Those are different products.

This is where the golden dataset begins. Every interesting input from the POC, with the answer we expected, goes into a list. It grows through the rest of the project.

## Step 2: A quick check with real users

I put the POC in front of three to five real users from our primary persona. Not a usability test of the UI; the UI is ugly on purpose. I want to know:

- Would they trust this output?
- What would they do with it next?
- What's missing that they'd need before acting on it?

This step regularly changes the product. Users tell you which mistakes are tolerable and which are dealbreakers, which is exactly what the evals need to know.

## Step 3: The Product Blueprint

Now I write the product doc, which I call the Product Blueprint. Because it comes after the POC and the user check, it records decisions instead of guesses. It reads as an argument, in four parts:

**Why**

- Scope and the problem we're solving
- Research: what the workshop, signals and users told us
- Goals and non-goals (non-goals are as important as goals)
- North star: the one measure that says the product is working

**Who**

- Personas
- User scenarios: real situations, written as short stories

**What**

- Features
- AI features: for each, what it does, its inputs and outputs, and how it should behave when it's unsure

**How we'll know**

- Feature metrics: adoption, completion, time saved
- The golden dataset: representative inputs with expected outputs, including edge cases and failure cases
- AI eval metrics: what we measure (accuracy, completeness, safety, tone), how we score it, and the bar for "good enough to ship"

I also add a short section on **risks and open questions**. If I were the founder, it's the page I'd want to read first.

## What I've learned

- If you can't define "good" for an AI feature, you're not ready to build it. The POC forces that conversation early, when it's cheap.
- The golden dataset is the most valuable artifact in the whole project. Specs change; a good test set keeps paying off.
- A POC is disposable by design. If it starts accumulating features, it's no longer a POC. Stop and write the Blueprint.

---
title: "We shipped five AI features and couldn't say if the next build was better. So we built a harness."
dek: "How a QC harness for a mortgage due-diligence platform turned "looks fine to me" into a verdict anyone on the team can run, and what it taught me about evaluating AI features."
kicker: Side quest · Case study
kind: case
level: side
order: 4
date: 2026-10-18
---

*All screenshots use synthetic data, with feature and client names made generic.*

---

## The problem nobody had a ticket for

The platform I was working on reviews loan files for mortgage due diligence. Five of its features lean on AI or on logic complex enough to behave like it. They come in three kinds:

- **Grading features (three of them)**: read free text or scanned documents about a loan and assign a grade or category, the way a reviewer would.
- **A search feature**: flags loans whose documents mention terms a reviewer cares about.
- **A calculation feature**: rebuilds a figure-by-figure history from raw files and judges it.

Each feature had been through user acceptance testing. For each one, reviewers had produced an "expected results" spreadsheet: for these loans, this is the grade, these are the hits, this is the history a person would give.

Then the builds kept coming. A new prompt. A different model. A fix to how a date column is parsed. A new client whose files look slightly different. Every change raised the same question: **is it still right?**

The honest answer was "someone opened the output next to the expected spreadsheet and it looked fine." That doesn't scale, it isn't repeatable, and it can't tell you *how much* worse a build got, or *why*.

If you ship AI features, you probably have this problem too. There's no bug to file, because nothing crashed. The feature just quietly gets better or worse, and nobody can say which.

## What we built, in one paragraph

A **QC harness**. You give it a feature's output and a **golden set** (the inputs plus the expected result a person signed off). It compares the two field by field and explains every difference: what kind it is, how serious it is, and why it probably happened. It ends with a verdict: **PASS, PASS WITH WARNINGS, or FAIL**. It runs from a terminal for engineers, as a platform job like every other feature, and from an admin screen for anyone on the team. Every run is kept, so quality has a history.

The rest of this post covers how we got there, in the order we learned it.

---

## 1. Start with the expected results you already have

The most valuable thing in an eval effort is usually already sitting in someone's downloads folder: **the spreadsheet a reviewer filled in during UAT.**

We didn't invent test cases. We took the expected-results files from acceptance testing and turned each one into a golden set:

- **The inputs**: the main loan data file, and the feature's own files (notes, spreadsheets, documents).
- **The expected output**: the reviewer's answer.
- **The context**: which client the files belong to, which feature they test, and the run settings (some features only mean something for a given date range).

Two things surprised me.

**Real data beats synthetic data, but you need both.** Our first real golden set came from actual loans a reviewer had graded. It caught issues no made-up example would have. Synthetic sets are still worth having for the edge cases real data hasn't shown you yet: the empty file, the record with no date. We kept a "source" label on every set (real or synthetic) so nobody mistakes one for the other.

**A golden set is a product object, not a test fixture.** It has an owner, a client, a version and a status. We learned this the hard way, which brings me to rubrics.

## 2. Decide what "good enough" means, per feature

"Compare output to expected" sounds simple until you try it on five different features. A grade isn't a search hit, and a search hit isn't a calculated amount. So the harness has a **comparator per kind of answer**:

| Comparator | Used for | What a difference means |
|---|---|---|
| **Grade** | The three grading features | The feature graded higher or lower than the reviewer, or put the loan in a different category |
| **Hit** | The search feature | The feature missed a term the reviewer flagged, or flagged one they didn't |
| **Match** | The calculation feature | A value differs: an amount, a date, a count |

Every difference gets three things a plain diff doesn't give you:

1. **A type**: "graded higher", "graded lower", "missed hit", "extra hit", "value differs". Ten "graded higher" differences tell a different story from ten "missed hits".
2. **A severity**: PASS, WARN or FAIL. Not every difference matters equally. A summary worded differently is a warning. A grade that moved is a failure.
3. **A reason**: the harness's best explanation, with the drivers behind it, such as the specific notes that pushed a grade up.

The reason turned out to be the feature people valued most. When we ran the harness on the first real golden set, 6 of the 17 checks failed. The first thing the team asked wasn't "how many?" but **"why did the mismatch happen?"** A harness that only says "FAIL" sends someone off to dig through spreadsheets. A harness that says "graded higher, driven by these three notes" lets them decide in a minute whether the model is wrong or the expected answer is out of date.

![One loan's checks: expected against actual, with the reason and the notes behind the grade](/assets/notes/eval-harness/03-loan-detail.png)
*One loan, opened from a run: the grade moved from "1 - Low" to "2 - Moderate", the harness says why, and it shows the notes that drove the feature's answer. (Synthetic data.)*

Then there's the rule that turns differences into a verdict. We made it an explicit setting, with three options:

- **Grade mismatch** (the default): the run fails if any check failed.
- **Any difference**: warnings fail it too. Stricter, for a feature that should be fully stable.
- **None**: never fail, just report. Useful while you're still building the baseline.

This setting is the rubric for "good enough". It's a product decision, not an engineering one, and making it a visible setting meant the team had that conversation once instead of in every review.

## 3. Make it run the same way everywhere

An eval you can only run on one engineer's laptop is a demo. We built one comparison engine and gave it three ways in:

**From a terminal**, for engineers checking a build:

- *Compare*: diff a report a feature already produced against a golden set. No platform, no setup, seconds to run.
- *Local run*: for the one feature that's fully deterministic (the calculation feature), run it on the golden set's input files, then compare. Again no platform needed.
- *End to end*: drive the real platform. Upload the input, trigger the feature's processing, wait, export the report, compare. This is the honest test, and it also takes the longest.

**As a platform job**, like every other feature. This was a mid-project correction, and an important one. Our first version ran a comparison as a single web request: send the files, wait, get the verdict. It worked, but it was the only part of the platform that didn't behave like the platform, and it depended on a separate service being deployed. We moved it to run like the AI features do. The screen queues a run, a platform flow picks it up, and the run reports its progress as it goes (queued, running with a stage like "fetching files" or "comparing", then complete or error). Because the terminal and the platform job share the same comparison and saving code, a run from either gives the same answer on the same files.

![A run in progress, showing its current stage](/assets/notes/eval-harness/04-run-in-progress.png)
*A run queued from the screen and done by a platform job reports its stage as it goes. You can leave the page. (Synthetic data.)*

**From an admin screen**, for everyone else. More on that below.

The principle: **the harness should be boring to run.** If running an eval takes effort, it happens before big releases and not between them, and the regressions show up between them.

## 4. Treat golden sets like product data, because they are

The moment more than one person used the harness, golden sets needed the things any product data needs.

**Versions.** If someone replaces the expected output, every earlier run was graded against the old answer. Replacing a file raises the set's version, and every run records which version it used. "This build failed" now always means "failed against v2", and you can tell whether the build changed or the answer key did.

**Status.** A set is a **draft** until it has everything a run needs (main data file, input files, expected output, and mapped columns). Only then can it become **active**, and only active sets appear when you start a run. A set that runs have used can be **retired** but not deleted, so history never points at nothing.

**Column mapping per client.** This one is specific to data-heavy features, but I suspect it's common. Every client's files name their columns differently: one calls it "Loan Number", another "LoanID". The platform already had a way to map a client's columns to its own fields when files are uploaded. A golden set reuses exactly that mapping, file by file. The harness reads a golden set's files the same way a real upload would, so an eval failure is the model's fault and not the importer's.

**One client per set.** It sounds restrictive. In practice it's what makes the mapping work, and it's how the reviewers think about the data anyway.

## 5. Put it in front of the people who decide

The terminal version was enough for engineers. It wasn't enough for the people who actually own "good enough": the PM, the review lead, the person who has to tell a client whether the new build is ready.

So the harness got an admin screen with two parts.

**Runs.** Every run, with its feature, golden set and version, verdict, and pass/warn/fail counts. Open one and you get a **per-loan view** first: which loans passed, which didn't, and how badly. Click a loan for its field-by-field detail and reasons. There's also an **all checks** view for searching and filtering across everything. The colour-coded report spreadsheet is one click away for anyone who wants to work offline.

![The runs list: each run's status, feature, golden set and version, verdict and counts](/assets/notes/eval-harness/01-runs-list.png)
*Every run is kept: status, feature, the golden set and version it used, the verdict and pass / warn / fail counts. (Synthetic data.)*

![A failed run: verdict, counts, what differed, and the per-loan view with each loan's main issue](/assets/notes/eval-harness/02-run-result.png)
*A run opens on its verdict and counts, then a per-loan view that leads with the failures and their main issue. (Synthetic data.)*

**Golden sets.** Create one in a five-step wizard: basics, main data file, input files, expected output and run defaults, then a review page that shows everything before you create it, including what still keeps it from going active. You can save a draft from any step and finish it later. Editing an existing set is a single page.

![The last step of the golden set wizard: a review of everything before Create](/assets/notes/eval-harness/05-golden-set-review.png)
*The wizard's last step: everything the set will hold, how many columns are mapped, and whether it can go active. (Synthetic data.)*

A note on humility: my first version of the edit page put every action at the bottom, under all the files, and the first reaction I got was blunt: *"Really bad UI, why are all the actions at the bottom?"* Fair. Now the name, status and version sit in a header that stays on screen as you scroll. Save is the only button; status changes and delete live in a menu. If you build internal tools for evals, the same rule applies as for any product: the people using it will tell you exactly what's wrong if you show it to them early.

![The golden set edit page: name, status and version in a header with Save and a menu of actions](/assets/notes/eval-harness/06-golden-set-edit.png)
*After the feedback: one line for the name, status and version, Save as the only button, and everything else in the menu, which says what a draft still needs. (Synthetic data.)*

## 6. Expect the first end-to-end run to fail, and make sure it fails loudly

The first time we ran the whole thing on the shared demo environment, it didn't work. That was useful, not a disaster.

The platform flow had been deployed, but the program it calls hadn't been updated yet: the two ship separately. The run step failed in milliseconds. Worse, the step meant to catch failures finished "successfully" without marking the run as failed. It only marked runs it could read back, and the read came back empty. On screen, the run sat at "queued" forever.

Two lessons, both general:

- **Your eval harness needs error handling as good as the feature it tests.** A run that never finishes is worse than one that fails. People stop trusting the tool, and then stop using it. We changed the failure step to mark any run it can't confirm has finished, and the screen now says "the run stopped before it could compare", with the reason.
- **Make the pipeline observable before you need it.** The platform turned out to expose each flow step's status and output. That's how we found the cause in minutes instead of guessing. Write down where those logs live the first time you find them.

---

## What I'd tell a PM starting this tomorrow

1. **Your eval dataset already exists.** It's the UAT spreadsheet, the support escalations, the examples in the PRD. Start there, not with a blank page.
2. **Write the rubric before the harness.** For each feature, decide which differences fail a build, which only warn, and which don't matter. This is the product work, and it's most of the value.
3. **Insist on reasons, not just scores.** "6 of 17 failed" starts a meeting. "Graded higher because of these three notes" ends one.
4. **Version the answer key.** Otherwise you'll never know whether the model changed or the expected answer did.
5. **Make it boring to run, and visible to non-engineers.** Quality you can only check before a release will regress between releases.
6. **Run it like production.** If your AI features run as background jobs, run the eval as one too, with the same status, retries and error handling.
7. **Get a baseline before you optimise.** The first report isn't a grade on the team. It's the line every later build is measured against.

## A note on how it was built

Going from a command-line comparison to a platform job with an admin screen took **under six hours of my time**, spread over five short sessions in ten days. I measured that from my own activity, not from memory, and part of it overlapped with other work I was running at the same time.

I built most of it pairing with an AI coding agent: I set the direction, made the product calls and tested it on the shared environment. Engineers on the team reviewed every backend change before it shipped, and their time isn't in that number. Still, the pairing is what made a harness worth building inside a normal sprint, rather than a project that never gets prioritised.

---

## If this is your problem

This is what my **AI Feature Eval Kit** is for: teams shipping AI features without a way to measure them.

Over 2–3 weeks, at about 10 hours a week, together we build:

- **An eval dataset from your real use cases**: your UAT results, your edge cases, your escalations, turned into versioned golden sets.
- **Rubrics for "good enough"**: per feature, which differences fail a build and which don't, agreed with the people who own the call.
- **An automated test harness**: one that runs where your team already works and explains its differences, not just counts them.
- **A baseline quality report and next steps**: where each feature stands today, what's failing and why, and what to fix first.

If you're shipping AI features and "it looked fine" is your quality bar, [let's talk](/work/).

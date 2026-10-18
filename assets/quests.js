/* Product Quest content.
   The game picks one WORLD per week (everyone sees the same one that week) and shuffles
   which eval cases and questions appear. To keep the game fresh, add a world or add cases
   to an existing world: no other code changes needed.

   Writing rule: every question must make sense to a first-time visitor who has read
   nothing else on the site. Give the setting in the question itself, and avoid jargon
   (POC, UAT, harness, build, MVP) unless the question explains it. */
window.QUESTS = {

  /* Level 0: one question per week, rotating */
  start: [
    {
      q: 'With AI tools, you can describe an app in the morning and click through a working version by lunch. When building is that fast, what becomes the hardest part of making a good product?',
      options: [['Building the screens quickly', false], ['Knowing what to build, who it is for, and what "good" looks like', true], ['Picking the newest AI model', false]],
      lesson: 'When building is cheap, building the wrong thing is cheap too. Product fundamentals become the job.'
    },
    {
      q: 'You\'re a product manager. A founder shows you an AI app they built over a weekend. It looks polished. What is the most useful first question to ask them?',
      options: [['Which tools did you build it with?', false], ['Who is this for, and what do they do today without it?', true], ['Can we add more features?', false]],
      lesson: 'A quick prototype proves something can be built. It doesn\'t prove anyone needs it.'
    },
    {
      q: 'As the product manager, you have an idea for a new AI product. When is the best time to write the detailed product plan?',
      options: [['Before anything is built', false], ['After a quick, rough test of the riskiest AI part', true], ['After launch', false]],
      lesson: 'Test the risky part first with something small and rough. Then the plan records decisions instead of guesses.'
    }
  ],

  worlds: [
    {
      id: 'clinic',
      name: 'An AI check-in assistant for a clinic',
      scene: 'A busy clinic wants AI to help with patient check-in.',
      desk: {
        brief: 'You spend a morning at the clinic\'s front desk, watching how staff check patients in. Three of the things below are hacks: things staff do because their tools don\'t do the job. Tap the 3 hacks.',
        things: [
          { label: 'A spreadsheet called "patients_final_v3"', hit: true, why: 'A hack: a side spreadsheet means the clinic system doesn\'t hold what they need.' },
          { label: 'The clinic\'s patient system', hit: false, why: 'Not a hack: this is the official tool.' },
          { label: 'A staff WhatsApp group for patient updates', hit: true, why: 'A hack: important updates live in chat, outside any system.' },
          { label: 'A cup of chai', hit: false, why: 'Not a hack: just a good morning.' },
          { label: 'A sticky note: "Arjun, allergy?"', hit: true, why: 'A hack: a critical detail on paper is easy to lose.' },
          { label: 'The phone', hit: false, why: 'Not a hack: calls are part of the job.' }
        ],
        pain: {
          q: 'The clinic\'s founder asked you to build "an AI chatbot for doctors". Based on what you saw at the front desk, what is the real problem to solve?',
          options: [['Doctors want a chatbot to talk to', false], ['Staff copy patient details between three places, and important things get lost', true], ['Patients want a nicer website', false]]
        },
        lesson: 'Founders are usually right about where the problem is and wrong about some part of the solution. Watching the real work shows you which part.'
      },
      evals: {
        rule: 'The clinic\'s AI turns what a patient says into a short summary for the doctor. Its rules: never leave out an allergy, and never guess a diagnosis.',
        cases: [
          { said: 'Patient: "Dizzy, on BP meds, allergic to penicillin."', expected: 'Dizziness. On BP medication. Allergy: penicillin.', ai: 'Dizziness. On BP medication.', pass: false, why: 'The allergy is missing. That is the one thing it must never drop.' },
          { said: 'Patient: "Sharp pain on my left side since Tuesday, worse after meals."', expected: 'Left-side pain since Tuesday, worse after meals.', ai: 'Pain on the left side since Tuesday, worse after eating.', pass: true, why: 'Different words, same facts. That is a pass.' },
          { said: 'Patient: "Not feeling great, tired a lot."', expected: 'Too vague to summarise. Ask: how long, how is sleep, any other symptoms?', ai: 'Patient has chronic fatigue syndrome.', pass: false, why: 'It guessed a diagnosis instead of asking a follow-up question.' },
          { said: 'Patient: "Cough for 2 weeks, no fever. I smoke."', expected: 'Cough for 2 weeks, no fever. Smoker.', ai: 'Two-week cough without fever. Smoker.', pass: true, why: 'Different words, same facts. That is a pass.' },
          { said: 'Patient: "Itchy rash on my arms after a new soap. No allergies that I know of."', expected: 'Itchy rash on arms after new soap. No known allergies.', ai: 'Itchy rash on arms after new soap. No known allergies.', pass: true, why: 'Matches the golden answer.' },
          { said: 'Patient: "Headache for 3 days, took ibuprofen. Allergic to sulfa drugs."', expected: 'Headache for 3 days, took ibuprofen. Allergy: sulfa drugs.', ai: 'Headache for 3 days, took ibuprofen.', pass: false, why: 'The sulfa allergy is missing.' }
        ]
      },
      mvp: {
        brief: 'You\'re planning the first version of the clinic\'s AI check-in tool. The engineers have time for only three features. Pick the three that matter most for doctors to trust the AI\'s summaries.',
        feats: [['Show each patient\'s own words next to the AI summary', true], ['Dark mode', false], ['A clear allergy flag the AI never leaves out', true], ['An analytics dashboard', false], ['The AI asks a follow-up when a patient is vague', true], ['Export to PDF', false]],
        lesson: 'The first version covers what makes people trust the AI. Polish can wait.'
      }
    },

    {
      id: 'loans',
      name: 'An AI that rates loan risk for a lender',
      scene: 'A lender uses AI to rate the risk of loan files, the way a human reviewer would. The team updates the AI every couple of weeks.',
      desk: {
        brief: 'You spend an afternoon with a loan reviewer, watching how they check the AI\'s ratings. Three of the things below are hacks: things they do because their tools don\'t do the job. Tap the 3 hacks.',
        things: [
          { label: 'A spreadsheet of the correct ratings, saved in someone\'s Downloads folder', hit: true, why: 'A hack: the answer key lives on one person\'s laptop.' },
          { label: 'The scanned loan file', hit: false, why: 'Not a hack: that is the work itself.' },
          { label: 'Opening the AI\'s ratings next to that spreadsheet and checking by eye', hit: true, why: 'A hack: quality is checked by hand after every update.' },
          { label: 'The team calendar', hit: false, why: 'Not a hack: just planning.' },
          { label: 'Asking in chat: "Did the latest update break the ratings?"', hit: true, why: 'A hack: nobody can say for sure, so they ask around.' },
          { label: 'Coffee', hit: false, why: 'Not a hack: fuel.' }
        ],
        pain: {
          q: 'The team asked you for "a faster AI". Based on what you saw, what is the real problem to solve?',
          options: [['The AI is too slow', false], ['Nobody can tell whether each update made the AI better or worse, or why', true], ['Reviewers want a new colour scheme', false]]
        },
        lesson: 'When an AI quietly gets worse, nothing crashes and nobody files a bug. The real pain is not knowing.'
      },
      evals: {
        rule: 'The lender\'s AI rates each loan\'s risk from 1 (low) to 3 (high). A human reviewer has already rated these loans, and the AI should give the same rating.',
        cases: [
          { said: 'Loan notes: steady income, no late payments.', expected: 'Reviewer\'s rating: 1 · Low', ai: 'Rating 1 · Low.', pass: true, why: 'Matches the reviewer.' },
          { said: 'Loan notes: one late payment in 2019, since paid.', expected: 'Reviewer\'s rating: 1 · Low', ai: 'Rating 2 · Moderate, because of "late payment".', pass: false, why: 'Rated too high. An old, resolved note pushed it up.' },
          { said: 'Loan notes: income not verified, two loans in default.', expected: 'Reviewer\'s rating: 3 · High', ai: 'Rating 3 · High.', pass: true, why: 'Matches the reviewer.' },
          { said: 'Loan notes: self-employed, income changes a lot month to month.', expected: 'Reviewer\'s rating: 2 · Moderate', ai: 'Rating 1 · Low.', pass: false, why: 'Rated too low. It missed the income risk.' },
          { said: 'Loan notes: the property\'s value is being re-checked.', expected: 'Reviewer\'s rating: 2 · Moderate', ai: 'Rating 2 · Moderate.', pass: true, why: 'Matches the reviewer.' },
          { said: 'Loan notes: all payments on time. (This file\'s dates came in a different format.)', expected: 'Reviewer\'s rating: 1 · Low', ai: 'Rating 3 · High, "payment dates missing".', pass: false, why: 'The new date format confused it. A test like this catches it, even though the AI itself didn\'t change.' }
        ]
      },
      mvp: {
        brief: 'The team is building a tool that tests the loan AI after every update, by comparing its ratings with the reviewer\'s. There\'s time for three features in version one. Pick the three that make people trust the test results.',
        feats: [['Use the reviewers\' existing spreadsheet of correct ratings as the test', true], ['Custom colour themes', false], ['Explain why each rating differs, not just "FAIL"', true], ['Emoji reactions', false], ['Keep a numbered version of every set of correct answers', true], ['A 3D chart', false]],
        lesson: '"6 of 17 failed" starts a meeting. "Rated higher because of these 3 notes" ends one.'
      }
    },

    {
      id: 'support',
      name: 'An AI that drafts replies for an online shop',
      scene: 'An online shop wants AI to help its customer support team reply to emails.',
      desk: {
        brief: 'You sit next to Priya, who answers customer emails for the shop, during a busy hour. Three of the things below are hacks: things she does because her tools don\'t do the job. Tap the 3 hacks.',
        things: [
          { label: 'A document of copy-paste replies', hit: true, why: 'A hack: the answers live in a doc, not in the support tool.' },
          { label: 'The support inbox', hit: false, why: 'Not a hack: this is the official tool.' },
          { label: '14 browser tabs open to look up one order', hit: true, why: 'A hack: the facts are scattered across systems.' },
          { label: 'Headphones', hit: false, why: 'Not a hack: just focus.' },
          { label: 'Messaging an engineer: "Is this a bug?"', hit: true, why: 'A hack: there is no quick way to check known problems.' },
          { label: 'A desk plant', hit: false, why: 'Not a hack: just nice.' }
        ],
        pain: {
          q: 'The shop\'s founder asked you for "an AI that answers tickets". Based on what you saw, what is the real problem to solve?',
          options: [['The support team types too slowly', false], ['Finding the facts about one customer takes longer than writing the reply', true], ['Customers want emojis', false]]
        },
        lesson: 'Watching the real work shows where AI saves time. Here it is gathering the facts, not typing the reply.'
      },
      evals: {
        rule: 'The shop\'s AI drafts replies to customer messages. Its rules: never promise a refund, and never make up order or invoice details.',
        cases: [
          { said: 'Customer: "Where is my order #4412?"', expected: 'Order #4412 shipped yesterday. Share the tracking link.', ai: 'Your order #4412 shipped yesterday. Here is the tracking link.', pass: true, why: 'Matches the golden answer.' },
          { said: 'Customer: "The app crashed and I lost my work!"', expected: 'Apologise, ask what happened, offer to pass it on. No refund promise.', ai: 'Sorry! We\'ve issued a full refund to your card.', pass: false, why: 'It promised a refund it cannot give.' },
          { said: 'Customer: "Can I switch to a yearly plan?"', expected: 'Yes: Settings > Billing > Change plan.', ai: 'Sure, go to Settings > Billing > Change plan.', pass: true, why: 'Different words, same steps. That is a pass.' },
          { said: 'Customer: "My invoice looks wrong."', expected: 'No invoice found for this customer yet. Ask for the invoice number.', ai: 'Your invoice #9981 for $49 is correct.', pass: false, why: 'It made up an invoice number and amount that aren\'t on file.' },
          { said: 'Customer: "How do I reset my password?"', expected: 'Use "Forgot password" on the login page. The link lasts 30 minutes.', ai: 'Use "Forgot password" on the login page. The link lasts 30 minutes.', pass: true, why: 'Matches the golden answer.' },
          { said: 'Customer: "Is my data safe after yesterday\'s outage?"', expected: 'Pass it to a person. Don\'t guess about outages.', ai: 'Yes, nothing was affected.', pass: false, why: 'It guessed instead of passing it to a person.' }
        ]
      },
      mvp: {
        brief: 'You\'re planning the first version of the shop\'s AI reply drafts. The engineers have time for only three features. Pick the three that make the support team trust the drafts.',
        feats: [['Pull the customer\'s real order details into the draft', true], ['An animated mascot', false], ['Pass the message to a person when the AI is unsure', true], ['A leaderboard for the support team', false], ['Block any draft that promises a refund', true], ['Custom fonts', false]],
        lesson: 'Trust comes from using real facts and knowing when to stop. Everything else can wait.'
      }
    }
  ],

  /* Level 2, second step: same idea every week */
  bar: {
    q: 'An AI feature is tested on 50 real examples, each with an answer a person checked. It gets 41 right. Launch is next week. What do you do?',
    options: [['Launch it. 82% is good.', false], ['Agree a minimum score to launch, say 45 of 50, and fix the failures first', true], ['Skip the score. Customers will tell us.', false]],
    lesson: 'Agree the bar before launch and re-test after every change. "Good enough" is a product decision, not a feeling.'
  },

  /* Side quest: from the eval harness case study. Two questions a week. */
  sideIntro: 'From a real project: a team built five AI features that rate the risk of mortgage loan files. Every update changed the results a little, so they built a tool that compares the AI\'s ratings with a human reviewer\'s ratings and reports every difference.',
  side: [
    {
      q: 'The tool spots a mismatch: the reviewer rated a loan "Low" risk, but the AI rated it "Moderate". The tool can show the team one of these three messages. Which one helps them fix the problem fastest?',
      options: [['"FAIL"', false], ['"6 of 17 checks failed"', false], ['"The AI rated this loan higher than the reviewer because of 3 notes about a late payment from 2019, which was later paid."', true]],
      lesson: 'Only the third message says why. With a reason, the team can decide in a minute whether the AI is wrong or the expected answer is out of date.'
    },
    {
      q: 'Last week someone corrected a few of the reviewer\'s ratings. Today\'s results look worse. How can the team tell whether the AI got worse or the answers changed?',
      options: [['Number each version of the correct answers, and record which version every test used', true], ['Run the test again until it passes', false], ['Delete the old results', false]],
      lesson: 'Version the answer key, so you always know whether the AI changed or the answers did.'
    },
    {
      q: 'The team needs examples to test the AI against. Where is the best place to start?',
      options: [['Write brand-new examples from scratch', false], ['The spreadsheet reviewers already filled in when they checked the features before launch', true], ['A competitor\'s website', false]],
      lesson: 'Your first test set often already exists. Start from answers people have already signed off.'
    },
    {
      q: 'A test run shows "waiting to start" forever, with no error message. Why is that a problem?',
      options: [['It isn\'t. It will finish eventually.', false], ['People stop trusting a tool that fails silently. It should stop with a clear reason.', true], ['It just needs a nicer loading animation', false]],
      lesson: 'A test that never finishes is worse than one that fails loudly.'
    }
  ]
};

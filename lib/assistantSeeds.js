// Seed scenarios for the AI assistant widget: one per contact driver
// (lib/contactDrivers.js), slug = the driver's L3 slug. Hand-written scenarios
// below override the generated stub for that driver. Step shape matches
// seedScenario() in config/database.js: { response } = free_text step,
// { chips: [{label, response, next}] } = chips step (next = step index|null).
const { DRIVERS } = require('./contactDrivers');

const NAME = 'ServiceDesk Assistant';
const GREETING = "Hi, I'm the ServiceDesk Assistant. How can I help you today?";
const COMPLETION = 'Thanks for your message. For anything else, you can [contact us](/contact) or browse the [Knowledge Base](/kb).';
const HANDOFF = "Connecting you with a specialist now… Hi, this is Jordan from the support team. I can see your conversation, so you don't need to repeat yourself. What's going on?";

const ft = (response, typingDelayMs) => ({ response, delay: typingDelayMs });
const ch = (chips, typingDelayMs) => ({ chips, delay: typingDelayMs });

// Closing step shared by hand-written scenarios.
const tail = ch([
  { label: 'Talk to a person', response: HANDOFF, next: null },
  { label: "That's all, thanks", response: "You're welcome! Have a great day.", next: null },
], 1000);

function stub(d) {
  return [
    ft(`Thanks for reaching out. It sounds like you need help with "${d.l3}" (${d.l2}). Is that right?`),
    ch([
      { label: "Yes, that's right", response: "Thanks for confirming. I've noted this for our team. Would you like a specialist to follow up with you?", next: 2 },
      { label: 'No, something else', response: 'No problem. Please tell me more in the box below, or [contact us](/contact).', next: null },
    ]),
    ch([
      { label: 'Yes, connect me', response: HANDOFF, next: null },
      { label: 'No thanks', response: 'Understood. If you need anything else, just type below.', next: null },
    ], 1000),
  ];
}

// Hand-written scenarios for the drivers the demo story leans on.
const CURATED = {
  'pricing-inquiry': [
    ft('Happy to help with pricing. Are you looking at a particular plan?'),
    ch([
      { label: 'Starter', response: 'Starter is $15 per agent per month with unlimited tickets, email and portal support, basic automation rules, and 5 Knowledge Base categories.', next: 2 },
      { label: 'Growth', response: 'Growth is $39 per agent per month. It adds SLA management and escalations, an unlimited Knowledge Base, advanced reporting, and Slack, Teams and Jira integrations.', next: 2 },
      { label: 'Enterprise', response: 'Enterprise is custom-priced and adds problem and change management, SSO, audit logs, custom roles, and a dedicated success manager.', next: 2 },
    ]),
    ch([
      { label: 'Compare the plans', response: 'You can see all three side by side on the [pricing page](/pricing). Every plan includes unlimited tickets.', next: 3 },
      { label: 'Start a free trial', response: 'You can [start a free trial](/register) on Starter or Growth. No setup call needed.', next: null },
      { label: 'Talk to sales', response: 'Of course. You can [request a demo](/contact) and a sales rep will follow up.', next: null },
    ]),
    tail,
  ],
  'plan-comparison': [
    ft("I can help you pick. Roughly how big is your support or IT team?"),
    ch([
      { label: 'Under 10 agents', response: 'Starter is usually plenty at that size: unlimited tickets, email and portal, and basic automation. If you need SLAs or reporting, step up to Growth.', next: 2 },
      { label: '10 to 50 agents', response: 'Most teams that size choose Growth for SLA management, escalations, advanced reporting, and the Slack, Teams and Jira integrations.', next: 2 },
      { label: 'More than 50', response: 'At that scale, Enterprise adds problem and change management, SSO, audit logs and a dedicated success manager. Pricing is custom.', next: 2 },
    ]),
    ch([
      { label: 'See the full comparison', response: 'The [pricing page](/pricing) lists every feature by plan.', next: 3 },
      { label: 'Talk to sales', response: 'You can [request a demo](/contact) and we will walk through the right fit for your team.', next: null },
    ]),
    tail,
  ],
  'demo-request': [
    ft('I can help you book a demo. A walkthrough usually covers ticketing, SLAs, the Knowledge Base, and reporting. Would you like to book one?'),
    ch([
      { label: 'Yes, book a demo', response: 'Great. Fill out the [Request a demo form](/contact) and a specialist will reach out to schedule a time.', next: null },
      { label: 'What does it cover?', response: 'About 30 minutes: a live tour of ticketing and automation, SLA management, the Knowledge Base, and dashboards, plus time for your questions.', next: 2 },
    ]),
    ch([
      { label: 'Book a demo', response: 'Fill out the [Request a demo form](/contact) and a specialist will reach out to schedule a time.', next: null },
      { label: 'Maybe later', response: 'No problem. You can also [start a free trial](/register) any time.', next: null },
    ]),
  ],
  'demo-request-issue': [
    ft("Sorry about that. Let's get your demo request in. What happened when you submitted the form?"),
    ch([
      { label: 'I got an error', response: "Thanks for letting me know. That can happen if the form was submitted while our servers were busy. Try [the form](/contact) again in a minute, or I can connect you with someone directly.", next: 2 },
      { label: "I didn't get a confirmation", response: "Confirmations can take a few minutes. Check your spam folder first. If nothing arrives, I can connect you with someone directly.", next: 2 },
    ]),
    ch([
      { label: 'Connect me with someone', response: HANDOFF, next: null },
      { label: "I'll try again", response: 'Sounds good. The [Request a demo form](/contact) is ready when you are.', next: null },
    ], 1000),
  ],
  'talk-to-sales': [
    ft('Happy to connect you with sales. Is this about Enterprise pricing or a larger rollout?'),
    ch([
      { label: 'Yes, Enterprise', response: 'Enterprise includes problem and change management, SSO, audit logs and custom roles. A rep can put together a custom quote.', next: 2 },
      { label: 'Just have questions', response: 'Of course. A rep can answer questions about plans, security, and migration.', next: 2 },
    ]),
    ch([
      { label: 'Contact sales', response: HANDOFF, next: null },
      { label: 'Request a demo instead', response: 'You can [request a demo](/contact) and a rep will follow up.', next: null },
    ], 1000),
  ],
  'trial-signup-issue': [
    ft('Sorry you hit a snag creating your trial. What happened?'),
    ch([
      { label: 'The form was rejected', response: 'Double-check that the email is valid and the password meets the requirements, then try the [signup form](/register) again. An email already used for a trial will be rejected too, so try [logging in](/login) instead.', next: 2 },
      { label: 'No verification email', response: 'Check your spam folder, since it can take a few minutes. If it still has not arrived, I can connect you with someone.', next: 2 },
    ]),
    tail,
  ],
  'password-reset': [
    ft('I can help you get back in. Do you remember the email address on your account?'),
    ch([
      { label: 'Yes', response: 'Go to the [login page](/login) and choose "Forgot password". We will email you a reset link. Check spam if it does not arrive in a few minutes.', next: 2 },
      { label: 'No', response: 'Try the email your admin used to invite you. If you are still stuck, a specialist can look up your account.', next: 2 },
    ]),
    tail,
  ],
  'login-issue': [
    ft("Sorry you can't get in. What happens when you try to sign in?"),
    ch([
      { label: 'Credentials rejected', response: 'Check for a typo or caps lock. If that does not help, use "Forgot password" on the [login page](/login).', next: 2 },
      { label: "I'm locked out", response: 'Accounts lock briefly after several failed attempts. Wait 15 minutes, or reset your password from the [login page](/login) to unlock right away.', next: 2 },
    ]),
    tail,
  ],
  'ticket-submission-issue': [
    ft("Sorry about that. Let's get your ticket submitted. What happened?"),
    ch([
      { label: 'I got an error', response: "Thanks. That points to our ticket queue being briefly unavailable, and your request has not been lost on our side. Wait a minute, then resubmit from [New ticket](/tickets/new).", next: 2 },
      { label: 'My ticket disappeared', response: 'Check [your dashboard](/portal). Submitted tickets appear there as Open. If it is not listed, resubmit from [New ticket](/tickets/new).', next: 2 },
      { label: 'Attachment failed', response: 'Try a smaller file, or a PDF or PNG. You can also add the attachment as a comment after the ticket is created.', next: 2 },
    ]),
    tail,
  ],
  'ticket-status-question': [
    ft('I can help you check on your ticket. Are you logged in?'),
    ch([
      { label: 'Yes', response: 'Your [dashboard](/portal) shows every open ticket, its priority, who it is assigned to, and its latest update.', next: 2 },
      { label: 'No', response: 'Please [log in](/login) first, then your tickets will be listed on your dashboard.', next: null },
    ]),
    tail,
  ],
  'knowledge-base-search-issue': [
    ft('Sorry the search is not working for you. What are you seeing?'),
    ch([
      { label: 'No results', response: 'Try fewer or simpler keywords, or browse by category on the [Knowledge Base](/kb) page.', next: 2 },
      { label: 'An error appears', response: 'Thanks for flagging it. Search can be briefly unavailable. Browse the [Knowledge Base](/kb) by category in the meantime, and try search again in a minute.', next: 2 },
    ]),
    tail,
  ],
  'sla-calculation-issue': [
    ft('Sorry about that. What does the SLA timer show on your ticket?'),
    ch([
      { label: 'An error message', response: 'Thanks. The SLA engine can briefly fail to calculate targets. Targets are recalculated automatically, so check the ticket again in a few minutes.', next: 2 },
      { label: 'The time looks wrong', response: 'SLA timers pause outside business hours and while a ticket is Pending. Check your business hours in workspace settings. A specialist can review it with you.', next: 2 },
    ]),
    tail,
  ],
  'notification-issue': [
    ft('Sorry notifications are not reaching you. Which ones are affected?'),
    ch([
      { label: 'Email', response: 'Check your spam folder and the notification preferences on your profile. Delivery failures are retried automatically.', next: 2 },
      { label: 'Slack or Teams', response: 'Reconnect the integration from your workspace settings. If the problem continues, a specialist can look at the delivery logs.', next: 2 },
    ]),
    tail,
  ],
};

function seeds() {
  return DRIVERS.map((d) => ({
    name: NAME,
    slug: d.slug,
    greeting: GREETING,
    completion: COMPLETION,
    driver: { l1: d.l1, l2: d.l2, l3: d.l3 },
    steps: CURATED[d.slug] || stub(d),
  }));
}

module.exports = { seeds, CURATED, DEFAULT_SLUG: 'pricing-inquiry' };

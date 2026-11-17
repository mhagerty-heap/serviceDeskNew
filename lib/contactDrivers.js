// Contact-driver taxonomy (demo conversational-intelligence data), L1 > L2 > L3
// with a definition per L3. Each L3's slug (slugify(L3)) doubles as its
// assistant scenario slug — see lib/assistantSeeds.js.

const ROWS = [
  ["Pre-Sales & Evaluation", "Plans & Pricing", "Pricing Inquiry", "Users asking what ServiceDesk costs, including the per-agent price of each plan, what is included, or whether tickets are unlimited"],
  ["Pre-Sales & Evaluation", "Plans & Pricing", "Plan Comparison", "Users asking which ServiceDesk plan fits their team, or how Starter, Growth, and Enterprise differ in SLAs, reporting, integrations, or change management"],
  ["Pre-Sales & Evaluation", "Plans & Pricing", "Discount and Contract Inquiry", "Users asking about annual discounts, nonprofit or education pricing, volume pricing, or contract terms"],
  ["Pre-Sales & Evaluation", "Demo & Sales", "Demo Request", "Users asking to book a ServiceDesk demo or walkthrough, or asking what a demo covers"],
  ["Pre-Sales & Evaluation", "Demo & Sales", "Demo Request Issue", "Users reporting problems submitting the Request a demo form, such as a form error, a missing confirmation, or no follow-up"],
  ["Pre-Sales & Evaluation", "Demo & Sales", "Talk to Sales", "Users asking to speak to a sales representative about Enterprise pricing, a custom quote, or a large rollout"],
  ["Pre-Sales & Evaluation", "Demo & Sales", "Demo Reschedule or Status", "Users asking to move or cancel a demo they booked, or following up on a demo request nobody has answered"],
  ["Pre-Sales & Evaluation", "Fit & Evaluation", "Feature Capability Inquiry", "Users asking whether ServiceDesk can do something specific in ticketing, automation, SLAs, reporting, or the knowledge base"],
  ["Pre-Sales & Evaluation", "Fit & Evaluation", "Integration Inquiry", "Users asking whether ServiceDesk works with Slack, Teams, Jira, Salesforce, Zoom, Gmail, or through its API and webhooks"],
  ["Pre-Sales & Evaluation", "Fit & Evaluation", "Security and Compliance Inquiry", "Users asking about data security, single sign-on, audit logs, certifications, or where their data is stored before buying"],
  ["Pre-Sales & Evaluation", "Fit & Evaluation", "Migration Inquiry", "Users asking how to move to ServiceDesk from another helpdesk tool, shared inboxes, or spreadsheets, and how long it takes"],
  ["Getting Started", "Trial & Signup", "Free Trial Inquiry", "Users asking how the ServiceDesk free trial works, how long it lasts, whether a credit card is needed, or what it includes"],
  ["Getting Started", "Trial & Signup", "Trial Signup Issue", "Users reporting problems creating a trial account, such as a rejected registration form, a verification email that never arrives, or an account that will not activate"],
  ["Getting Started", "Setup & Onboarding", "Workspace Setup Help", "Users asking how to configure a new ServiceDesk workspace, such as departments, queues, business hours, and email channels"],
  ["Getting Started", "Setup & Onboarding", "Invite Team Members", "Users asking how to add agents or customers, assign them a role, or send or resend an invitation"],
  ["Account & Access", "Sign-in", "Login Issue", "Users unable to log in to their ServiceDesk account for reasons other than a forgotten password, verification code, or single sign-on, such as rejected credentials or a lockout"],
  ["Account & Access", "Sign-in", "Password Reset", "Users who forgot their ServiceDesk password or are having trouble resetting it"],
  ["Account & Access", "Sign-in", "Single Sign-On Issue", "Users having trouble signing in through single sign-on, or asking how to set up SSO with their identity provider"],
  ["Account & Access", "Sign-in", "Multi-Factor Authentication Issue", "Users having trouble with the verification step when signing in to ServiceDesk, such as codes that do not arrive or are rejected"],
  ["Account & Access", "Account Admin", "Update Profile Information", "Users requesting to change details on their ServiceDesk profile, such as name, email, or notification preferences"],
  ["Account & Access", "Account Admin", "Roles and Permissions", "Users asking how to change what an admin, agent, or customer can see or do, or how custom roles work"],
  ["Account & Access", "Account Admin", "Trial Expiry or Extension", "Users asking what happens when their free trial ends, or asking for more time to evaluate"],
  ["Account & Access", "Account Admin", "Account Cancellation", "Users asking to cancel their ServiceDesk subscription, close their workspace, or export their data first"],
  ["Billing & Plans", "Billing", "Invoice or Receipt Request", "Users requesting an invoice, receipt, or billing statement, or asking to change the billing contact or company details"],
  ["Billing & Plans", "Billing", "Billing Question", "Users asking about a charge on their ServiceDesk statement, including seat counts, add-ons, and prorated charges from a mid-cycle plan change"],
  ["Billing & Plans", "Billing", "Payment Failure", "Users reporting a declined card, a failed renewal payment, or a workspace restricted because of a billing problem"],
  ["Billing & Plans", "Billing", "Refund Request", "Users asking for a refund or credit, such as for unused seats or an unintended renewal"],
  ["Billing & Plans", "Plan Changes", "Plan Upgrade or Downgrade", "Users asking how to move between Starter, Growth, and Enterprise, or what changes when they do"],
  ["Billing & Plans", "Plan Changes", "Agent Seat Changes", "Users asking how to add or remove agent seats, or how active agents are counted for billing"],
  ["Using the Product", "Ticketing & Automation", "Ticket Submission Issue", "Users unable to submit or update a ticket, such as an error on submit, a ticket that disappears, or an attachment that fails"],
  ["Using the Product", "Ticketing & Automation", "Automation Rule Help", "Users asking how to set up routing, auto-assignment, escalation rules, canned responses, or macros"],
  ["Using the Product", "Ticketing & Automation", "Ticket Status Question", "Users asking where their ticket stands, who it is assigned to, or when they will hear back"],
  ["Using the Product", "Knowledge Base & Portal", "Knowledge Base Search Issue", "Users reporting that Knowledge Base search returns nothing, returns the wrong articles, or fails as they type"],
  ["Using the Product", "Knowledge Base & Portal", "Knowledge Base Article Request", "Users asking where to find an answer or how-to article, such as VPN setup, hardware requests, or reading a billing statement"],
  ["Using the Product", "Knowledge Base & Portal", "Portal Access Issue", "Users who cannot open the customer or agent portal, or who are sent back to the login page"],
  ["Using the Product", "Knowledge Base & Portal", "Knowledge Base Authoring", "Users asking how to create, publish, or organize Knowledge Base articles and categories"],
  ["Using the Product", "Reporting & SLAs", "SLA Setup Question", "Users asking how to configure SLA timers, breach alerts, or escalation thresholds"],
  ["Using the Product", "Reporting & SLAs", "SLA Calculation Issue", "Users reporting that SLA timers or breach status look wrong, will not calculate, or show an error"],
  ["Using the Product", "Reporting & SLAs", "Report and Dashboard Help", "Users asking how to build, schedule, or export custom reports and dashboards"],
  ["Using the Product", "Problem & Change Management", "Problem and Change Management Help", "Users asking how to link tickets to a problem record, plan a risk-scored change, or schedule a maintenance window"],
  ["Technical Issues", "Notifications & Integrations", "Notification Issue", "Users reporting that email, Slack, or Teams notifications are not arriving, arrive late, or arrive more than once"],
  ["Technical Issues", "Notifications & Integrations", "Integration Not Working", "Users whose Slack, Teams, Jira, or other connected tool is not syncing or has stopped working"],
  ["Technical Issues", "Notifications & Integrations", "API and Webhook Question", "Users asking how to use the ServiceDesk API or webhooks, including authentication and rate limits"],
  ["Technical Issues", "Performance & Errors", "App Technical Issue", "Users reporting crashes, error messages, or pages that will not load and stop them from using ServiceDesk"],
  ["Technical Issues", "Performance & Errors", "Outage or Status Inquiry", "Users asking whether ServiceDesk is down or slow right now, or when a known issue will be fixed"],
  ["Support & Service", "Feedback", "Feature Request", "Users suggesting a new feature or asking whether one is on the roadmap"],
];

function slugify(s) {
  return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const DRIVERS = ROWS.map(([l1, l2, l3, definition]) => ({ l1, l2, l3, definition, slug: slugify(l3) }));

module.exports = { DRIVERS, slugify };

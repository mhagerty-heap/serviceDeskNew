const db = require('../config/database');

module.exports = function injectLocals(req, res, next) {
  res.locals.csqTagId = process.env.CSQ_TAG_ID || null;

  res.locals.departments = db.prepare('SELECT * FROM departments ORDER BY name').all();

  if (res.locals.currentUser) {
    const isAgent = ['agent', 'admin'].includes(res.locals.currentUser.role);
    const openCountRow = isAgent
      ? db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status IN ('open','pending')").get()
      : db.prepare("SELECT COUNT(*) as count FROM tickets WHERE requester_id = ? AND status IN ('open','pending')").get(res.locals.currentUser.id);
    res.locals.openTicketCount = openCountRow.count;
  } else {
    res.locals.openTicketCount = 0;
  }

  // Admin-marked default scenario for the AI assistant widget (agent-widget.js).
  try {
    const def = db.prepare('SELECT slug FROM agent_scenarios WHERE is_default = 1 LIMIT 1').get();
    res.locals.defaultAiScenarioSlug = def ? def.slug : null;
  } catch (e) {
    res.locals.defaultAiScenarioSlug = null;
  }

  res.locals.flash = {
    success: req.flash ? req.flash('success') : [],
    error: req.flash ? req.flash('error') : [],
    info: req.flash ? req.flash('info') : []
  };

  next();
};

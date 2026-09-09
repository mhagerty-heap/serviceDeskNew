const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Log in' });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  const returnTo = req.session.returnTo || '/portal';
  delete req.session.returnTo;
  req.flash('success', `Welcome back, ${user.name}!`);
  res.redirect(returnTo);
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Start free trial' });
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    req.flash('error', 'Please fill out every field (password must be at least 6 characters).');
    return res.redirect('/register');
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    req.flash('error', 'An account with that email already exists.');
    return res.redirect('/register');
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), passwordHash, 'customer');

  req.session.userId = result.lastInsertRowid;
  req.flash('success', 'Account created! Welcome to ServiceDesk.');
  res.redirect('/portal');
});

router.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

module.exports = router;

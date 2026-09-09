const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

router.get('/features', (req, res) => {
  res.render('features', { title: 'Features' });
});

router.get('/pricing', (req, res) => {
  res.render('pricing', { title: 'Pricing' });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Request a Demo' });
});

router.post('/contact', (req, res) => {
  req.flash('success', "Thanks! A ServiceDesk rep will reach out within one business day.");
  res.redirect('/contact');
});

module.exports = router;

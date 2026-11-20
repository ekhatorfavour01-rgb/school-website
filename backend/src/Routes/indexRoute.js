'use strict';

const { Router } = require('express');
const { ok } = require('../Utils/response');

const router = Router();

router.get('/health', (req, res) => ok(res, { status: 'ok', time: new Date().toISOString() }));

router.use('/auth', require('./Routes/authRoute'));
router.use('/admins', require('./Routes/adminRoute'));
router.use('/homepage', require('./Routes/homepageRoute'));
router.use('/about', require('./Routes/aboutRoute'));
router.use('/classes', require('./Routes/classesRoute'));
router.use('/news', require('./Routes/newsRoute'));
router.use('/events', require('./Routes/eventsRoute'));
router.use('/gallery', require('./Routes/galleryRoute'));
router.use('/downloads', require('./Routes/downloadsRoute'));
router.use('/enquiries', require('./Routes/enquiriesRoute'));
router.use('/subscribers', require('./Routes/subscribersRoute'));
router.use('/payments', require('./Routes/paymentsRoute'));
router.use('/settings', require('./Routes/settingsRoute'));
router.use('/dashboard', require('./Routes/dashboardRoute'));

module.exports = router;
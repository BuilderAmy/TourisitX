const { static } = require('express')
const express = require('express')
const genkan = require('app/genkan/genkan')


const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile', (req, res) => {
    const metadata = {
        meta: {
            title: 'profile',
            path: false,
        },
        nav: {
            sidebarActive: '',
        },
        layout: '',
    }
    return res.render('users/profile.hbs', {
        user: {
            name: 'Harold Chan',
            password: 'password',
            email: 'test@email.com',
            bio: 'Hide The Pain',
            pfp: '/static/pfp.jpg',
            phone_number: '12348765',
            account_mode: 0,
            fb: 'https://www.facebook.com/',
            insta: 'https://www.instagram.com/',
            li: 'https://www.linkedin.com/company/paul-immigrations/',
        },
    })
})

router.get('/setting/general',async (req, res) => {
    var sid = req.signedCookies.sid
    var user = await genkan.getUserBySessionAsync(sid)
    const metadata = {
        meta: {
            title: 'General Setting',
            path: false,
        },
        nav: {
            sidebarActive: 'general',
        },
        layout: 'setting',
        user,
    }
    return res.render('users/general.hbs', metadata)
})

router.get('/setting/password', (req, res) => {
    const metadata = {
        meta: {
            title: 'Password',
            path: false,
        },
        nav: {
            sidebarActive: 'password',
        },
        layout: 'setting',
    }
    return res.render('users/password.hbs', metadata)
})

router.get('/messages', (req, res) => {
    const metadata = {
        meta: {
            title: 'Your messages',
            path: false,
        },
        nav: {
            navbar: 'chat',
            sidebarActive: 'aa',
        },
        layout: 'chat',
    }
    return res.render('chat.hbs', metadata)
})


module.exports = router

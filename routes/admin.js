const express = require('express')

const formidableValidator = require('../app/validation')

const { Shop, User, Token, Ban, Support, ChatRoom } = require('../models')

const { Op } = require('sequelize')

const router = express.Router()
const uuid = require('uuid')
const chat = require('../app/chat/chat')

const { default: axios } = require('axios')

const config = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)

// Database operations
require('../app/db')

// Genkan API
const genkan = require('../app/genkan/genkan')
require('../app/genkan/resetPassword')

const formidable = require('express-formidable')
const Validator = formidableValidator.Validator
router.use(formidable())


// cookieParser: Cookie schema for notifications
const NotificationCookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    // domain: `.${config.webserver.cookieDomain}`,
    maxAge: 2500,
    path: '/',
}

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

const exampleTransaction = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'Sex on the beach',
    cust_id: 'Takahashi Taro',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: true,
}

const exampleTransaction2 = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'City Dwelling',
    cust_id: 'Ri Ui',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: false,
}

router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Admin Dashboard',
            path: false,
        },
        nav: {
            sidebarActive: 'dashboard',
        },
        layout: 'admin',
        data: {
            currentUser: req.currentUser,
        },
    }
    return res.render('admin/dashboard', metadata)
})

router.get('/manage/users', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)

    // Data only used if, before coming to this endpoint, a user was updated.
    const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
    const notifsData = notifs.split('然シテ') // Why 然シテ as a splitter? Because the chances of anyone using soushite in their name is 0.000001% with the fact that this is written in Katakana instead of Hiragana like any normal human being would. Why not a comma, because people like Elon Musk exists and they name their child like they are playing osu!, just that they are smashing their keyboards.
    const entriesPerPage = 15

    User.findAll({
        where: { is_admin: false },
        limit: entriesPerPage,
        offset: (pageNo - 1) * entriesPerPage,
    })
        .then(async (users) => {
            const userObjects = users.map((users) => users.dataValues)
            const totalNumberOfPages = Math.ceil(
                (await User.count({ where: { is_admin: false } })) / entriesPerPage,
            )

            const metadata = {
                meta: {
                    title: 'Manage Users',
                    path: false,
                },
                nav: {
                    sidebarActive: 'users',
                },
                layout: 'admin',
                data: {
                    currentUser: req.currentUser,
                    updatedMessage: {
                        updatedUser: notifsData[1],
                        status: notifsData[0],
                        err: notifsData[2],
                    },
                    users: userObjects,
                    pagination: {
                        firstPage: 1,
                        lastPage: totalNumberOfPages,
                        previous: pageNo - 1,
                        current: pageNo,
                        next: pageNo + 1,
                    },
                },
            }

            return res.render('admin/users', metadata)
        })
        .catch((err) => {
            throw err
        })
})

router.get('/manage/staff', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)

    // Data only used if, before coming to this endpoint, a user was updated.
    const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
    const notifsData = notifs.split('然シテ') // Read above for why this is soushite
    const entriesPerPage = 15

    User.findAll({
        where: { is_admin: true },
        limit: entriesPerPage,
        offset: (pageNo - 1) * entriesPerPage,
    })
        .then(async (users) => {
            const userObjects = users.map((users) => users.dataValues)
            const totalNumberOfPages = Math.ceil(
                (await User.count({ where: { is_admin: true } })) / entriesPerPage,
            )

            const metadata = {
                meta: {
                    title: 'Manage Staff',
                    path: false,
                },
                nav: {
                    sidebarActive: 'staff',
                },
                layout: 'admin',
                data: {
                    currentUser: req.currentUser,
                    updatedMessage: {
                        updatedUser: notifsData[1] || undefined,
                        status: notifsData[0],
                        err: notifsData[2],
                    },
                    users: userObjects,
                    pagination: {
                        firstPage: 1,
                        lastPage: totalNumberOfPages,
                        previous: pageNo - 1,
                        current: pageNo,
                        next: pageNo + 1,
                    },
                },
            }
            return res.render('admin/staff', metadata)
        })
        .catch((err) => {
            throw err
        })
})

router.get('/manage/users/edit/:userId', (req, res) => {
    const targetUserId = req.params.userId

    genkan.getUserByID(targetUserId, (user) => {
        if (user === null) {
            return res.render('404', { layout: 'admin' })
        }

        // Data only used if, before coming to this endpoint, a user was updated.
        const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
        const notifsData = notifs.split('然シテ') // Read above for why this is soushite

        const metadata = {
            meta: {
                title: 'Edit User: ' + user.name,
                path: false,
            },
            nav: {
                sidebarActive: 'users',
            },
            layout: 'admin',
            data: {
                user: user,
                currentUser: req.currentUser,
                updatedMessage: {
                    updatedUser: notifsData[1] || undefined,
                    status: notifsData[0],
                    err: notifsData[2],
                },
            },
        }

        if (user.id.includes('00000000-0000-0000-0000-0000000000') === true) {
            metadata.data.readonly = true
        }

        if (user.is_admin === true) {
            metadata.data.previousPage = 'staff'
            metadata.nav.sidebarActive = 'staff'
        } else {
            metadata.data.previousPage = 'users'
            metadata.nav.sidebarActive = 'users'
        }

        res.render('admin/edit/user', metadata)
    })
})

router.post('/manage/users/edit/:userId', (req, res) => {
    const targetUserId = req.params.userId

    genkan.getUserByID(targetUserId, (user) => {
        let redirectTo = 'users'

        if (user === null) {
            res.cookie(
                'notifs',
                `ERR_UPDATEDUSER然シテ${user.name}然シテTarget user does not exist. このユーザーは存在しません。`,
                NotificationCookieOptions,
            )
            return res.redirect('/admin/manage/' + redirectTo)
        }

        // For administrative action buttons
        if (req.fields.editingPortion === 'ADMIN_ACTIONS') {
            const requestedAction = req.fields.actionDo
            if (requestedAction === 'CONFIRM_EMAIL') {
                return updateDB(
                    'user',
                    { id: targetUserId },
                    { email_status: true },
                    () => {
                        Token.destroy({
                            where: {
                                userId: targetUserId,
                            },
                        }).catch((err) => {
                            throw err
                        })

                        res.cookie(
                            'notifs',
                            `OK_EMAILCONFIRMED然シテ${user.name}`,
                            NotificationCookieOptions,
                        )
                        return res.redirect('/admin/manage/' + redirectTo)
                    },
                )
            }
            if (requestedAction === 'SEND_RECOVERY_EMAIL') {
                return sendResetPasswordEmail(user.email, () => {
                    res.cookie(
                        'notifs',
                        `OK_SENDRECOVEREMAIL然シテ${user.name}`,
                        NotificationCookieOptions,
                    )
                    return res.redirect('/admin/manage/' + redirectTo)
                })
            }
            if (requestedAction === 'PROMOTE') {
                const PromotePayload = {
                    is_admin: true,
                }

                return User.update(PromotePayload, {
                    where: { id: user.id },
                })
                    .catch((err) => {
                        throw err
                    })
                    .then((data) => {
                        res.cookie(
                            'notifs',
                            `OK_PROMOTED然シテ${user.name}`,
                            NotificationCookieOptions,
                        )
                        return res.redirect('/admin/manage/staff')
                    })
            }
            if (requestedAction === 'DEMOTE') {
                // Check whether demotion is the currentUser
                if (req.currentUser.id === user.id) {
                    res.cookie(
                        'notifs',
                        `ERR_DEMOTE然シテ${user.name}然シテCannot demote yourself. (It sounds funny to fire yourself, but it's not happening.)`,
                        NotificationCookieOptions,
                    )
                    return res.redirect('/admin/manage/users/edit/' + user.id)
                }

                const DemotePayload = {
                    is_admin: false,
                }

                return User.update(DemotePayload, {
                    where: { id: user.id },
                })
                    .catch((err) => {
                        throw err
                    })
                    .then((data) => {
                        res.cookie(
                            'notifs',
                            `OK_DEMOTED然シテ${user.name}`,
                            NotificationCookieOptions,
                        )
                        return res.redirect('/admin/manage/users')
                    })
            }
            if (requestedAction === 'DELETE_USER') {
                // Check whether demotion is the currentUser
                if (req.currentUser.id === user.id) {
                    res.cookie(
                        'notifs',
                        `ERR_DELETE然シテ${user.name}然シテCannot delete yourself.`,
                        NotificationCookieOptions,
                    )
                    return res.redirect('/admin/manage/users/edit/' + user.id)
                }

                if (user.is_admin === true) {
                    res.cookie(
                        'notifs',
                        `ERR_DELETE然シテ${user.name}然シテCannot delete privileged user. Please demote the account before attempting a delete.`,
                        NotificationCookieOptions,
                    )
                    return res.redirect('/admin/manage/users/edit/' + user.id)
                }

                return User.destroy({
                    where: {
                        id: targetUserId,
                    },
                })
                    .catch((err) => {
                        throw err
                    })
                    .then(() => {
                        res.cookie(
                            'notifs',
                            `OK_DELETED然シテ${user.name}`,
                            NotificationCookieOptions,
                        )
                        return res.redirect('/admin/manage/' + redirectTo)
                    })
            }

            // Reject everything else.
            return false
        }

        const EditUserPayload = {
            account_mode: req.fields.account_mode,
            name: req.fields.name,
            bio: req.fields.bio,
            email: req.fields.email,
            phone_number: req.fields.phone_number,
            fb: req.fields.fb,
            insta: req.fields.insta,
            li: req.fields.li,
        }

        User.findAll({
            where: {
                [Op.not]: {
                    id: targetUserId,
                },
                email: req.fields.email,
            },
        })
            .then((data) => {
                if (data.length !== 0) {
                    res.cookie(
                        'notifs',
                        `ERR_DUPLICATEEMAIL然シテ${req.fields.name}`,
                        NotificationCookieOptions,
                    )
                    return res.redirect('/admin/manage/users/edit/' + user.id)
                }

                if (user.is_admin === true) {
                    redirectTo = 'staff'
                } else {
                    redirectTo = 'users'
                }

                User.update(EditUserPayload, {
                    where: { id: targetUserId },
                })
                    .catch((err) => {
                        res.cookie(
                            'notifs',
                            `ERR_UPDATEDUSER然シテ${req.fields.name}然シテ${err}`,
                            NotificationCookieOptions,
                        )
                        return res.redirect('/admin/manage/' + redirectTo)
                    })
                    .then((data) => {
                        res.cookie(
                            'notifs',
                            `OK_UPDATEDUSER然シテ${req.fields.name}`,
                            NotificationCookieOptions,
                        )
                        return res.redirect('/admin/manage/' + redirectTo)
                    })
            })
            .catch((err) => {
                throw err
            })
    })
})

router.get('/manage/tours', async (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)

    const entriesPerPage = 15
    const totalNumberOfPages = Math.ceil((await Shop.count()) / entriesPerPage)

    const dbData = await Shop.findAll({
        limit: entriesPerPage,
        offset: (pageNo - 1) * entriesPerPage,
        order: [['createdAt', 'DESC']],
    })

    const listingObjects = dbData.map((data) => data.dataValues)
    console.log(listingObjects)

    const metadata = {
        meta: {
            title: 'Manage Tours',
            path: false,
        },
        nav: {
            sidebarActive: 'tourListings',
        },
        layout: 'admin',
        listing: listingObjects,
        // pagination: {
        //     firstPage: 1,
        //     lastPage: totalNumberOfPages,
        //     previousPage: pageNo - 1,
        //     currentPage: pageNo,
        //     nextPage: pageNo + 1,
        // },
        data: {
            currentUser: req.currentUser,
            pagination: {
                firstPage: 1,
                lastPage: totalNumberOfPages,
                previous: pageNo - 1,
                current: pageNo,
                next: pageNo + 1,
            },
        },
    }

    return res.render('admin/viewListings', metadata)
})

router.get('/manage/tours/edit/:id', async (req, res) => {
    const itemID = req.params.id
    const dbData = await Shop.findAll({
        where: {
            id: itemID,
        },
    })

    const listingObject = dbData[0]['dataValues']

    let banStatus = ''

    const banLog = await Ban.findAll({
        where: { objectID: itemID, is_inForce: true },
    })

    console.log('BAN LOG HAS FOUND')

    if (banLog[0] == undefined) {
        banStatus = false
    } else {
        const currentlyBanned = banLog[0]['dataValues']['is_inForce']

        // Might have been previously banned but then unbanned
        if (currentlyBanned == true) {
            banStatus = true
        } else {
            banStatus = false
        }
    }

    const metadata = {
        meta: {
            title: 'Manage Tours',
            path: false,
        },
        nav: {
            sidebarActive: 'tourListings',
        },
        layout: 'admin',
        listing: listingObject,
        bannedStatus: banStatus,
        data: {
            currentUser: req.currentUser,
        },
    }

    res.render('admin/edit/reportListing.hbs', metadata)
})

router.post('/manage/tours/edit/:id', async (req, res) => {
    const itemID = req.params.id
    const ACTION = req.fields.actionDo
    let banStatus = ''

    if (ACTION == 'REVOKE_TOUR') {
        const banLog = await Ban.findAll({
            where: { objectID: itemID, is_inForce: true },
        })
        console.log('BAN LOG HAS FOUND')

        if (banLog[0] == undefined) {
            banStatus = false
        } else {
            const currentlyBanned = banLog[0]['dataValues']['is_inForce']

            // Might have been previously banned but then unbanned
            if (currentlyBanned == true) {
                banStatus = true
            } else {
                banStatus = false
            }
        }

        // If banned already, don't have to do anything
        if (banStatus == true) {
            console.log('BANNED ALREADY')
        } else {
            const tourData = await Shop.findOne({
                where: {
                    id: itemID,
                },
                raw: true,
            })
            console.log(tourData)
            const tourName = tourData['tourTitle']
            const revokeMessage = `Revoked Tour: ${tourName} for reason: ${req.fields.revokeReason}`

            await Shop.update(
                {
                    hidden: 'true',
                },
                {
                    where: { id: itemID },
                },
            )

            console.log('HIDDEN SET TO TRUE')

            const banId = uuid.v4()
            await Ban.create({
                banId: banId,
                banType: 'LISTING',
                objectID: itemID,
                is_inForce: true,
            })

            deleteDoc('products', itemID)

            dbData = await Shop.findAll({
                where: {
                    id: itemID,
                },
                raw: true,
            })

            const tourGuideId = dbData[0]['userId']
            const adminID = '00000000-0000-0000-0000-000000000000'

            const chatData = await ChatRoom.findAll({
                where: {
                    participants: {
                        [Op.like]: `%${tourGuideId}%${adminID}%`,
                    },
                },
            }, raw = true)
            const chatRoomID = chatData[0]['chatId']
            chat.addMessage(chatRoomID, 'SYSTEM', revokeMessage, 'SENT', () => { })
            // revokeMessage: Message to send to person
            //
        }
    } else {
        // THIS RUNS TO UNREVOKE TOUR
        await Ban.update(
            {
                is_inForce: false,
            },
            {
                where: { objectID: itemID },
            },
        )

        await Shop.update(
            {
                hidden: 'false',
            },
            {
                where: { id: itemID },
            },
        )

        listData = await Shop.findAll({
            attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
            where: { id: itemID },
        })

        doc = listData[0]['dataValues']

        await axios.post('http://localhost:5000/es-api/upload', {
            id: doc.id,
            name: doc.tourTitle,
            description: doc.tourDesc,
            image: doc.tourImage,
        })
    }

    if ((await Shop.count({ where: { id: itemID } })) === 1) {
        return res.redirect(`/admin/manage/tours/edit/${itemID}`)
    }

    return res.render('404', { layout: 'admin' })
})

router.get('/payments', async (req, res) => {
    let invoices = await stripe.charges.list({
    })
    invoices = invoices['data']
    console.log(invoices)
    const metadata = {
        meta: {
            title: 'Payments',
            path: false,
        },
        nav: {
            sidebarActive: 'payments',
        },
        layout: 'admin',
        data: {
            currentUser: req.currentUser,
            transactions: invoices,
        },
    }
    return res.render('admin/transactions', metadata)
})


router.get('/manage/tickets', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)
    // Data only used if, before coming to this endpoint, a ticket was updated.
    const notifs = req.signedCookies.notifs || 'null然シテnull然シテnull'
    const notifsData = notifs.split('然シテ') // Why 然シテ as a splitter? Because the chances of anyone using soushite in their name is 0.000001% with the fact that this is written in Katakana instead of Hiragana like any normal human being would. Why not a comma, because people like Elon Musk exists and they name their child like they are playing osu!, just that they are smashing their keyboards.
    const entriesPerPage = 15
    Support.findAll({
        limit: entriesPerPage,
        offset: (pageNo - 1) * entriesPerPage,
    })
        .then(async (tickets) => {
            const ticketObjects = tickets.map((tickets) => tickets.dataValues)
            const totalNumberOfPages = Math.ceil(
                (await Support.count()) / entriesPerPage,
            )

            const metadata = {
                meta: {
                    title: 'Support Tickets',
                    path: false,
                },
                nav: {
                    sidebarActive: 'tickets',
                },
                layout: 'admin',
                data: {
                    currentUser: req.currentUser,
                    updatedMessage: {
                        updatedUser: notifsData[1],
                        status: notifsData[0],
                        err: notifsData[2],
                    },
                    tickets: ticketObjects,
                    pagination: {
                        firstPage: 1,
                        lastPage: totalNumberOfPages,
                        previous: pageNo - 1,
                        current: pageNo,
                        next: pageNo + 1,
                    },
                },
            }
            return res.render('admin/tickets.hbs', metadata)
        })
        .catch((err) => {
            throw err
        })
})

router.get('/manage/tickets/edit/:id', async (req, res) => {
    const ticData = await Support.findAll({
        where: {
            'ticket_id': req.params.id,
        },
    })
    const ticketObject = ticData[0]['dataValues']
    if (req.cookies.storedValues) {
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }
    const metadata = {
        meta: {
            title: 'Manage Ticket',
            path: false,
        },
        nav: {
            sidebarActive: 'tickets',
        },
        layout: 'admin',

        data: {
            ticket: ticketObject,
            currentUser: req.currentUser,
        },
        editSupportErrors: req.cookies.editSupportErrors,
        successTicket: req.cookies.successTicket,
    }
    metadata.data.previousPage = 'tickets'
    res.render('admin/edit/ticket.hbs', metadata)
})

router.post('/manage/tickets/edit/:id', async (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const v = new Validator(req.fields)
    const tData = await Support.findAll({
        where: {
            'ticket_id': req.params.id,
        },
    })
    const ticket = tData[0]['dataValues']
    editSupportErrors = []
    if (req.fields.userEmail == ticket.u_email) {

    } else {
        const userEmailResult = v
            .Initialize({
                name: 'userEmail',
                message: 'Email should not be empty',
            })
            .exists()
            .getResult()
        editSupportErrors.push(userEmailResult)
    }
    if (req.fields.supportcontent == ticket.content) {
    } else {
        const supportcontentResult = v
            .Initialize({
                name: 'supportcontent',
                errorMessage: 'Content must not be empty and not longer than 254 characters',
            })
            .exists()
            .isLength({ min: 10, max: 254 })
            .getResult()
        editSupportErrors.push(supportcontentResult)
    }

    editSupportErrors = removeNull(editSupportErrors)
    if (!emptyArray(editSupportErrors)) {
        res.cookie('editSupportErrors', editSupportErrors, { maxAge: 5000 })
        res.redirect(`/admin/manage/tickets/edit/${req.params.id}`)
    } else {
        res.clearCookie('editSupportErrors')
        res.clearCookie('storedValues')
        successTicket = []
        const formAS = v
            .Initialize({
                errorMessage: 'Ticket Details updated successfully',
            })
            .setFalse()
            .getResult()
        successTicket.push(formAS)
        res.cookie('successTicket', successTicket, { maxAge: 5000 })
        const TicketDetails = {
            'u_email': req.fields.userEmail,
            'support_type': req.fields.type,
            'content': req.fields.supportcontent,
            'status': req.fields.support_status,
            'updatedAt': new Date(),
        }
        updateDB('support', { 'ticket_id': req.params.id }, TicketDetails, () => {
            return res.redirect(`/admin/manage/tickets/edit/${req.params.id}`)
        })
    }
})

module.exports = router

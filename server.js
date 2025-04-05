const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const hbs = require('express-handlebars');
const app = express();
const port = 3000;

const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload')

app.use(fileUpload());

mongoose.connect('mongodb://localhost/ParkingResDB');

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(cookieParser());

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname)));

const User = require("./models/User");
const Reservation = require("./models/Reservations");
const Space = require("./models/Space");

app.get('/', (req, res) => {
    res.render('landingpage');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/mainMenu', (req, res) => {
    res.render('mainMenu');
});

app.post('/login', (req, res) => {
    const formData = req.body;
    res.render('login', { data: formData });
});

app.get('/register', (req, res) => {
    res.render('register');
});


app.post('/register', (req, res) => {
    const formData = req.body;
    res.render('register', { data: formData });
});

app.get('/mainMenu', (req, res) => {
    res.render('mainMenu');
});

app.get('/reserve', isAuthenticated, async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        res.render('reserve', {
            title: 'Reserve Parking Slot',
            reservationTitle: 'Reservation for Your Parking Space',
            selectSpaceText: 'Select Floor:',
            selectDateText: 'Select Date:',
            selectTimeText: 'Select Time:',
            selectSlotText: 'Select Slot:',
            reserveSlotText: 'Reserve Slot',
            goBackText: 'Go Back',
            successMessageText: 'Reservation successful!',
            spaces: spaces.map(space => ({ value: space.name, name: space.name }))
        });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/adminReserveDetails', isAuthenticated, async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        res.render('adminReserveDetails', {
            title: 'Reserve Parking Slot',
            reservationTitle: 'Reservation for Your Parking Space',
            selectSpaceText: 'Select Floor:',
            selectDateText: 'Select Date:',
            selectTimeText: 'Select Time:',
            selectSlotText: 'Select Slot:',
            studentName: 'Student Name:',
            reserveSlotText: 'Reserve Slot',
            goBackText: 'Go Back',
            successMessageText: 'Reservation successful!',
            spaces: spaces.map(space => ({ value: space.name, name: space.name }))
        });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/editreservations', async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        const times = [
            { value: '09:00', display: '09:00 AM' },
            { value: '09:30', display: '09:30 AM' },
            { value: '10:00', display: '10:00 AM' },
            { value: '10:30', display: '10:30 AM' },
            { value: '11:00', display: '11:00 AM' },
            { value: '11:30', display: '11:30 AM' },
            { value: '12:00', display: '12:00 PM' },
            { value: '12:30', display: '12:30 PM' },
            { value: '13:00', display: '01:00 PM' },
            { value: '13:30', display: '01:30 PM' },
            { value: '14:00', display: '02:00 PM' },
            { value: '14:30', display: '02:30 PM' },
            { value: '15:00', display: '03:00 PM' }
        ];

        const reservationId = req.query.reservationId;
        let reservation = null;

        if (reservationId) {
            reservation = await Reservation.findById(reservationId).lean();
            if (reservation) {
                reservation.date = new Date(reservation.date).toISOString().split('T')[0];
            }
        }

        res.render('editreservations', { spaces, times, reservation });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/space-availability', async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        const times = [
            { value: '09:00', display: '09:00 AM' },
            { value: '09:30', display: '09:30 AM' },
            { value: '10:00', display: '10:00 AM' },
            { value: '10:30', display: '10:30 AM' },
            { value: '11:00', display: '11:00 AM' },
            { value: '11:30', display: '11:30 AM' },
            { value: '12:00', display: '12:00 PM' },
            { value: '12:30', display: '12:30 PM' },
            { value: '13:00', display: '01:00 PM' },
            { value: '13:30', display: '01:30 PM' },
            { value: '14:00', display: '02:00 PM' },
            { value: '14:30', display: '02:30 PM' },
            { value: '15:00', display: '03:00 PM' }
        ];
        res.render('space-availability', { spaces, times });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/searchuser', async (req, res) => {
    try {
        const users = await User.find().lean();
        res.render('searchuser', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/profilepage', async (req, res) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user._id).lean();
        const reservations = await Reservation.find({ userID: user._id }).lean();

        res.render('profilepage', {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            description: user.profileDesc,
            reservations: reservations.map(reservation => ({
                space: reservation.parkingFloor,
                date: reservation.resStartSched.toDateString(),
                time: `${reservation.resStartSched.toLocaleTimeString()} - ${reservation.resEndSched.toLocaleTimeString()}`,
                slotID: reservation.reservationID
            }))
        });
    } else {
        res.redirect('/login');
    }
});


// ADMIN
app.post('/adminLogin', (req, res) => {
    const formData = req.body;
    res.render('adminLogin', { data: formData });
});

app.get('/editprofile', async (req, res) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user._id).lean();
        const reservations = await Reservation.find({ userID: user._id }).lean();

        res.render('editprofile', {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            description: user.profileDesc,
            reservations: reservations.map(reservation => ({
                space: reservation.parkingFloor,
                date: reservation.resStartSched.toDateString(),
                time: `${reservation.resStartSched.toLocaleTimeString()} - ${reservation.resEndSched.toLocaleTimeString()}`,
                slotID: reservation.reservationID
            }))
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/adminMenu', (req, res) => {
    res.render('adminMenu');
});

app.get('/adminReserve', async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        const times = [
            { value: '09:00', display: '09:00 AM' },
            { value: '09:30', display: '09:30 AM' },
            { value: '10:00', display: '10:00 AM' },
            { value: '10:30', display: '10:30 AM' },
            { value: '11:00', display: '11:00 AM' },
            { value: '11:30', display: '11:30 AM' },
            { value: '12:00', display: '12:00 PM' },
            { value: '12:30', display: '12:30 PM' },
            { value: '13:00', display: '01:00 PM' },
            { value: '13:30', display: '01:30 PM' },
            { value: '14:00', display: '02:00 PM' },
            { value: '14:30', display: '02:30 PM' },
            { value: '15:00', display: '03:00 PM' }
        ];
        res.render('adminReserve', { spaces, times });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/admindeletereserve', async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        const times = [
            { value: '09:00', display: '09:00 AM' },
            { value: '09:30', display: '09:30 AM' },
            { value: '10:00', display: '10:00 AM' },
            { value: '10:30', display: '10:30 AM' },
            { value: '11:00', display: '11:00 AM' },
            { value: '11:30', display: '11:30 AM' },
            { value: '12:00', display: '12:00 PM' },
            { value: '12:30', display: '12:30 PM' },
            { value: '13:00', display: '01:00 PM' },
            { value: '13:30', display: '01:30 PM' },
            { value: '14:00', display: '02:00 PM' },
            { value: '14:30', display: '02:30 PM' },
            { value: '15:00', display: '03:00 PM' }
        ];
        res.render('admindeletereserve', { spaces, times });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/adminprofile', async (req, res) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user._id).lean();
        const reservations = await Reservation.find({ userID: user._id }).lean();

        res.render('adminprofile', {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            description: user.profileDesc,
            reservations: reservations.map(reservation => ({
                space: reservation.parkingFloor,
                date: reservation.resStartSched.toDateString(),
                time: `${reservation.resStartSched.toLocaleTimeString()} - ${reservation.resEndSched.toLocaleTimeString()}`,
                slotID: reservation.reservationID
            }))
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/adminSearchUser', async (req, res) => {
    try {
        const users = await User.find().lean();
        res.render('adminSearchUser', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/submit-registration', async (req, res) => {
    try {
        const { userId, email, password, name, role, department } = req.body;
        const image = req.files?.image;

        const existingUserId = await User.findOne({ userId });
        const existingEmail = await User.findOne({ email });
        if (existingUserId) {
            return res.status(400).json({ message: 'User ID already taken!' });
        }
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already taken!' });
        }

        let profileImg = '/assets/default.jpg';

        if (image) {
            const firstName = name.split(' ')[0].toLowerCase();
            const fileExtension = path.extname(image.name);
            const newFileName = `${firstName}${fileExtension}`;
            const imagePath = path.join(__dirname, 'assets', newFileName);

            await image.mv(imagePath);
            profileImg = `/assets/${newFileName}`;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            userId,
            email,
            password: hashedPassword,
            name,
            role,
            department,
            profileImg
        });

        await newUser.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// LOGIN
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(401).json({ message: 'Invalid User ID or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password does not match!' });
        }

        req.session.user = user;
        res.status(200).json(user);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// ADMIN LOGIN
app.post('/api/adminLogin', async (req, res) => {
    const { email, password } = req.body;
    try {

        const user = await User.findOne({ email, role: 'technician' });
        if (user) {

            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {

                req.session.user = user;
                res.status(200).json(user);
            } else {

                res.status(401).json({ message: 'Password does not match!' });
            }
        } else {

            res.status(401).json({ message: 'Invalid credentials!' });
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/users', async (req, res) => {
    const userName = req.query.name;
    try {
        const users = await User.find({ name: userName });
        res.json(users);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.post('/submit-reservation', async (req, res) => {
    try {
        const { space, date, time, slotId, anonymous } = req.body;

        if (!req.session.user) {
            return res.status(401).json({ message: 'User not logged in!' });
        }

        const newReservation = new Reservation({
            space,
            date,
            time,
            slotId,
            anonymous,
            userName: req.session.user.name
        });

        await newReservation.save();

        res.status(200).json({ message: 'Reservation successful!' });
    } catch (error) {
        console.error('Error submitting reservation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/submit-admin-reservation', async (req, res) => {
    try {
        const { space, date, time, slotId, anonymous, userName, userId } = req.body;

        if (!req.session.user) {
            return res.status(401).json({ message: 'User not logged in!' });
        }

        const newReservation = new Reservation({
            space,
            date,
            time,
            slotId,
            anonymous,
            userName,
            userId
        });

        await newReservation.save();

        res.status(200).json({ message: 'Reservation successful!' });
    } catch (error) {
        console.error('Error submitting reservation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/reservations', isAuthenticated, async (req, res) => {
    try {
        let query = {};

        if (req.query.space && req.query.date && req.query.time) {
            query = { space: req.query.space, date: req.query.date, time: req.query.time };
        } else {
            query = { userName: req.session.user.name };
        }

        const reservations = await Reservation.find(query);
        res.status(200).json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.delete('/api/deleteUser', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const name = req.session.user.name;


        await User.findByIdAndDelete(userId);


        await Reservation.deleteMany({ userName: name });


        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Failed to delete session!' });
            }
            res.status(200).json({ message: 'User account and associated reservations deleted successfully!' });
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/updateProfile', isAuthenticated, async (req, res) => {
    try {
        const { name, email, role, department, profileDesc } = req.body;
        const userId = req.session.user._id;
        const image = req.files?.image;

        let profileImg = req.session.user.profileImg;

        if (image) {
            const firstName = name.split(' ')[0].toLowerCase();
            const fileExtension = path.extname(image.name);
            const newFileName = `${firstName}${fileExtension}`;
            const imagePath = path.join(__dirname, 'assets', newFileName);

            await image.mv(imagePath);
            profileImg = `/assets/${newFileName}`;
        }

        await User.findByIdAndUpdate(userId, {
            name,
            email,
            role,
            department,
            profileDesc,
            profileImg
        });

        const updatedUser = await User.findById(userId);
        req.session.user = updatedUser;

        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/api/userReservations', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const reservations = await Reservation.find({ userID: userId }).lean();
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        res.status(500).json({ message: 'Failed to fetch reservations' });
    }
});

app.get('/api/reservation/:id', isAuthenticated, async (req, res) => {
    try {
        const reservationId = req.params.id;
        const reservation = await Reservation.findById(reservationId);
        if (reservation) {
            res.json(reservation);
        } else {
            res.status(404).json({ message: 'Reservation not found' });
        }
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/updateReservation', isAuthenticated, async (req, res) => {
    try {
        const { reservationId, space, date, time, slotId, anonymous } = req.body;

        const slotIdNumber = parseInt(slotId, 10);
        if (isNaN(slotIdNumber) || slotIdNumber < 1 || slotIdNumber > 25) {
            return res.status(400).json({ message: 'Please enter a valid slot number (1-25)' });
        }


        const conflictingReservation = await Reservation.findOne({
            _id: { $ne: reservationId },
            space,
            date,
            time,
            slotId
        });


        if (conflictingReservation) {
            return res.status(400).json({ message: 'The slot is already taken for the selected time.' });
        }

        const reservation = await Reservation.findByIdAndUpdate(reservationId, {
            space,
            date,
            time,
            slotId,
            anonymous
        }, { new: true });

        if (reservation) {
            res.json({ message: 'Reservation updated successfully!' });
        } else {
            res.status(404).json({ message: 'Reservation not found' });
        }
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.delete('/api/deleteReservation', isAuthenticated, async (req, res) => {
    const { _id } = req.body;

    try {
        await Reservation.findOneAndDelete({ _id, userName: req.session.user.name });
        res.json({ message: 'Reservation deleted successfully!' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ message: 'Failed to delete reservation' });
    }
});

app.get('/api/searchUsers', async (req, res) => {
    try {
        const searchTerm = req.query.name;
        const users = await User.find({ name: { $regex: searchTerm, $options: 'i' } });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/usersAdmin', async (req, res) => {
    try {
        const searchTerm = req.query.name;
        const users = await User.find({ name: { $regex: searchTerm, $options: 'i' } });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).lean();
        if (user) {
            res.render('viewProfile', {
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                description: user.profileDesc,
                profileImg: user.profileImg
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/userprofile/:username', async (req, res) => {
    try {

        const decodedUsername = decodeURIComponent(req.params.username); 
        const user = await User.findOne({ name: decodedUsername }).lean();

        if (user) {

            const reservations = await Reservation.find({ userName: user.name }).lean();

            res.render('viewProfileAvail', {
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                description: user.profileDesc,
                profileImg: user.profileImg,
                reservations: reservations.map(reservation => ({
                    _id: reservation._id,
                    space: reservation.space,
                    date: reservation.date.toDateString(),
                    time: reservation.time,
                    slotId: reservation.slotId
                }))

            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

});


app.get('/adminViewUser/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).lean();

        if (user) {

            const reservations = await Reservation.find({ userName: user.name }).lean();

            res.render('adminViewProfile', {
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                description: user.profileDesc,
                profileImg: user.profileImg,
                reservations: reservations.map(reservation => ({
                    _id: reservation._id,
                    space: reservation.space,
                    date: reservation.date.toDateString(),
                    time: reservation.time,
                    slotId: reservation.slotId,
                    anonymous: reservation.anonymous ? 'Yes' : 'No'
                }))

            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// DELETE ANOTHER USER'S RESERVATION (FOR ADMIN)
app.delete('/api/deleteSearchReservation', isAuthenticated, async (req, res) => {
    const { _id } = req.body;
    try {
        await Reservation.findByIdAndDelete(_id);
        res.json({ message: 'Reservation deleted successfully!' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ message: 'Failed to delete reservation' });
    }
});


app.get('/adminEditReserve', async (req, res) => {
    try {
        const spaces = await Space.find().lean();
        const times = [
            { value: '09:00', display: '09:00 AM' },
            { value: '09:30', display: '09:30 AM' },
            { value: '10:00', display: '10:00 AM' },
            { value: '10:30', display: '10:30 AM' },
            { value: '11:00', display: '11:00 AM' },
            { value: '11:30', display: '11:30 AM' },
            { value: '12:00', display: '12:00 PM' },
            { value: '12:30', display: '12:30 PM' },
            { value: '13:00', display: '01:00 PM' },
            { value: '13:30', display: '01:30 PM' },
            { value: '14:00', display: '02:00 PM' },
            { value: '14:30', display: '02:30 PM' },
            { value: '15:00', display: '03:00 PM' }
        ];

        const reservationId = req.query.reservationId;
        let reservation = null;

        if (reservationId) {
            reservation = await Reservation.findById(reservationId).lean();
            if (reservation) {
                reservation.date = new Date(reservation.date).toISOString().split('T')[0];
            }
        }

        res.render('adminEditReserve', { spaces, times, reservation });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



async function initDB() {
    try {
        await mongoose.connect('mongodb://localhost/ParkingResDB', { useNewUrlParser: true, useUnifiedTopology: true });

        const User = require('./models/User');
        const Reservation = require('./models/Reservations');
        const Space = require('./models/Space');

        const userData = [
            {
                name: 'Wonwoo Jeon',
                email: 'wonu_jeon@dlsu.edu.ph',
                password: '$2a$10$LP4zDHTmHAYuMLFFHfM0uuhBtbAGyNA09A8RzPfKkBUvLsU1llTcC',
                role: 'student',
                department: 'CCS',
                profileImg: '/assets/wonwoo.jpg',
                profileDesc: 'I love coding.',
                userId: '12279391'
            },
            {
                name: 'Mingyu Kim',
                email: 'gyu_kim@dlsu.edu.ph',
                password: '$2a$10$5M4u66LXTV38DLAGiijsj.1TNVOikADMesh3C4ED04qos32QwV9mq',
                role: 'student',
                department: 'CCS',
                profileImg: '/assets/mingyu.jpg',
                profileDesc: 'i also love coding',
                userId: '12279392'
            },
            {
                name: 'Jin Kim',
                email: 'seokjin_kim@dlsu.edu.ph',
                password: '$2a$10$ZNL506GF7PpzDKyt2R5PHOhABxEbPQANOs6zjqiriX5CkQVAqljx6',
                role: 'student',
                department: 'COB',
                profileImg: '/assets/jin.jpg',
                profileDesc: 'i love business',
                userId: '12279396'
            },
            {
                name: 'Momo Hirai',
                email: 'momo_hirai@dlsu.edu.ph',
                password: '$2a$10$kdrGPQJYkO9HyjmL4h9dIe5eVpFWZ3VPMgJgIVMqO/yqP9Yoxi.f6',
                role: 'student',
                department: 'COE',
                profileImg: '/assets/momo.jpg',
                profileDesc: 'i love economics',
                userId: '12279395'
            },
            {
                name: 'Jake Sim',
                email: 'jake_sim@dlsu.edu.ph',
                password: '$2a$10$GFl6DPhTIKatOEfIAqr9Vu2TXXCJV4GeAWkwjxEayCrErd1Tr5AC.',
                role: 'student',
                department: 'CCS',
                profileImg: '/assets/jake.jpg',
                profileDesc: 'i love computer science',
                userId: '12279394'
            },
            {
                name: 'Seulgi Kang',
                email: 'k.seulgi@dlsu.edu.ph',
                password: '$2a$10$RLEKuBc32fIvJl6IIEbR4uGuO8lvbmEIL3l5pVlRx37PjG0IAUiKG',
                role: 'technician',
                department: 'CCS',
                profileImg: '/assets/seulgi.jpg',
                profileDesc: 'i love coding and teaching',
                userId: '12279393'
            }


        ];


        const reservationData = [
            {
                space: '5th Floor',
                date: new Date('2025-04-10'),
                time: '09:00',
                slotId: '1',
                anonymous: false,
                userName: 'Jake Sim'
            },
            {
                space: '3rd Floor',
                date: new Date('2025-04-11'),
                time: '09:00',
                slotId: '2',
                anonymous: true,
                userName: 'Momo Hirai'
            },
            {
                space: '3rd Floor',
                date: new Date('2025-04-12'),
                time: '09:30',
                slotId: '4',
                anonymous: true,
                userName: 'Jin Kim'
            },
            {
                space: '3rd Floor',
                date: new Date('2025-04-13'),
                time: '09:30',
                slotId: '2',
                anonymous: true,
                userName: 'Mingyu Kim'
            },
            {
                space: '4th Flor',
                date: new Date('2025-04-14'),
                time: '09:30',
                slotId: '4',
                anonymous: true,
                userName: 'Wonwoo Jeon'
            }


        ];


        const spaceData = [
            { name: 'C', location: '3rd Floor' },
            { name: 'D', location: '4th Floor' },
            { name: 'E', location: '5th Floor' }
        ];

        await User.bulkWrite(userData.map(user => ({
            updateOne: {
                filter: { email: user.email },
                update: { $set: user },
                upsert: true
            }
        })));

        await Reservation.bulkWrite(reservationData.map(reservation => ({
            updateOne: {
                filter: { space: reservation.space, date: reservation.date, time: reservation.time },
                update: { $set: reservation },
                upsert: true
            }
        })));

        await Space.bulkWrite(spaceData.map(space => ({
            updateOne: {
                filter: { name: space.name },
                update: { $set: space },
                upsert: true
            }
        })));

        console.log('Static data initialized successfully!');
    } catch (err) {
        console.error('Error initializing static data:', err);
    }
}


app.listen(port, async () => {
    console.log(`Server is running at http://localhost:${port}`);
    await initDB();
});

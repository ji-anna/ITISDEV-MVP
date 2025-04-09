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


const handlebars = hbs.create({
    extname: 'hbs',
    defaultLayout: false,
    helpers: {
        eq: (a, b) => a === b,
        multiply: (a, b) => a * b,
        formatDate: function (dateString) {
            if (!dateString) return '';
            const dateObj = new Date(dateString);
            return dateObj.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          }
    }
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

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


app.set('views', path.join(__dirname, 'views'));


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
const Purchase = require('./models/Purchase');
const TicketUsage = require('./models/TicketUsage');

const isStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') return next();
    res.redirect('/login');
  };
  

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

app.get('/ticketDashboard', isAuthenticated, isStudent, async (req, res) => {
    try {
      const user = await User.findById(req.session.user._id).lean();
      const purchases = await Purchase.find({ userId: user.userId }).lean();
      const usedTickets = await TicketUsage.find({ userId: user.userId }).lean();
      const overtimeCharges = await Reservation.find({
        userId: user.userId,
        $or: [{ status: 'overtime' }, { status: 'paid' }]
      }).lean();
  
      // Check if there is at least one unpaid overtime
      const hasUnpaidOvertime = overtimeCharges.some(charge => charge.status === 'overtime');
  
      res.render('ticketDashboard', {
        user,
        purchases,
        usedTickets,
        overtimeCharges,
        hasUnpaidOvertime, // pass this to the template
        helpers: {
          multiply: (a, b) => a * b,
          eq: (a, b) => a === b
        }
      });
    } catch (err) {
      console.error("Error loading ticketDashboard:", err);
      res.status(500).send("Internal Server Error");
    }
  });
  
  
  
  
// Ticket Checkout
app.get('/ticketCheckout', isAuthenticated, isStudent, (req, res) => {
    res.render('ticketCheckout', {
      user: req.session.user
    });
  });

// Confirm Ticket Purchase
app.post('/api/confirmCheckout', isAuthenticated, isStudent, async (req, res) => {
    try {
      const quantity = parseInt(req.body.quantity) || 1;
      const total = quantity * 600;
      const userId = req.session.user.userId;
  
      const purchase = new Purchase({ userId, quantity, total });
      await purchase.save();
      await User.updateOne({ userId }, { $inc: { ticketCount: quantity * 10 } });
  
      req.session.lastReceipt = {
        userName: req.session.user.name,
        quantity,
        total,
        date: new Date().toLocaleString()
      };
  
      res.status(200).json({ message: 'Purchase successful!' });
    } catch (err) {
      console.error('Error confirming ticket purchase:', err);
      res.status(500).json({ message: 'Failed to confirm purchase.' });
    }
  });

// Receipt View
app.get('/receipt', isAuthenticated, isStudent, (req, res) => {
    const data = req.session.lastReceipt;
    if (!data) return res.redirect('/ticketDashboard');
    res.render('receipt', data);
  });

  // Check ticket eligibility
app.get('/api/checkTicketEligibility', async (req, res) => {
    try {
      const user = await User.findOne({ userId: req.query.userId });
      if (!user) return res.status(404).json({ eligible: false, message: 'User not found' });
      res.json({ eligible: user.ticketCount > 0, ticketCount: user.ticketCount });
    } catch (err) {
      console.error('Error checking ticket eligibility:', err);
      res.status(500).json({ eligible: false, message: 'Internal Error' });
    }
  });

// Buy ticket pad
app.post('/api/buyTickets', isAuthenticated, async (req, res) => {
    try {
      const user = req.session.user;
      const quantity = req.body.quantity || 1;
      const total = 600 * quantity;
  
      const purchase = new Purchase({
        userId: user.userId,
        quantity,
        total
      });
      await purchase.save();
  
      await User.updateOne(
        { userId: user.userId },
        { $inc: { ticketCount: quantity * 10 } }
      );
  
      res.status(200).json({ message: 'Tickets successfully purchased!', purchase });
    } catch (err) {
      console.error('Error buying tickets:', err);
      res.status(500).json({ message: 'Purchase failed.' });
    }
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


app.post('/adminReserveDetails', (req, res) => {
    const { space, date, time, slotId, userId} = req.body;
    res.render('adminReserveDetails', {
        title: 'Parking Space Availability - Admin',
        space,
        date,
        time,
        slotId,
        userId
    });
});


app.get('/adminReserveDetails', (req, res) => {
    const { space, date, time, slotId, userId } = req.query;
    res.render('adminReserveDetails', {
        title: 'Parking Space Availability - Admin',
        space,
        date,
        time,
        slotId,
        userId
    });
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

app.get('/api/usersById', async (req, res) => {
    const userId = req.query.userId;
    try {
        const users = await User.find({ userId });
        res.json(users);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


app.get('/profilepage', async (req, res) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user._id).lean();
        const reservations = await Reservation.find({ userID: user._id }).lean();

        res.render('profilepage', {
            name: user.name,
            userId: user.userId,
            email: user.email,
            role: user.role,
            department: user.department,
            description: user.profileDesc,
            carPlate: user.carPlate,
            reservations: reservations.map(reservation => ({
                space: reservation.parkingFloor,
                date: reservation.resStartSched.toDateString(),
                time: `${reservation.resStartSched.toLocaleTimeString()} - ${reservation.resEndSched.toLocaleTimeString()}`,
                slotId: reservation.reservationID,
                status: reservation.status 
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

app.get('/checkoutUser', async (req, res) => {
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
        res.render('checkoutUser', { spaces, times });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/reservationsByUser', async (req, res) => {
    const { userId, date } = req.query;
    const reservations = await Reservation.find({ userId: userId, date });
    res.json(reservations);
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


const Reservations = require('./models/Reservations');

app.get('/adminSearchUser', async (req, res) => {
    try {
        const users = await User.find().lean();

        const usersWithStatus = await Promise.all(users.map(async user => {
            const hasOvertime = await Reservations.exists({
                userId: user.userId,
                status: 'overtime'
            });

            return {
                ...user,
                status: hasOvertime ? 'suspended' : 'active'
            };
        }));

        res.render('adminSearchUser', { users: usersWithStatus });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/suspendedAccounts', async (req, res) => {
    try {
        const users = await User.find().lean();
        res.render('suspendedAccounts', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/submit-registration', async (req, res) => {
    try {
        const { userId, email, password, name, role, department, carPlate } = req.body;
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
            profileImg,
            carPlate: (role === 'student' && carPlate) ? [carPlate] : []
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
        req.session.userId = user._id;
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
        const { space, date, time, slotId, anonymous, userId, status } = req.body;

        if (!userId) {
            return res.status(400).send('User ID is required.');
        }

        const existingReservation = await Reservation.findOne({ userId, status: 'active' });
        if (existingReservation) {
            return res.status(400).json({ message: 'You already have a reservation.' });
        }

        const overtimeReservation = await Reservation.findOne({ userId, status: 'overtime' });
        if (overtimeReservation) {
            return res.status(400).json({ message: 'The account reserving is suspended.' });
        }

        const user = await User.findOne({ userId });
        if (!user || user.ticketCount < 1) {
            return res.status(400).json({ message: 'Insufficient tickets.' });
        }


        const newReservation = new Reservation({
            space,
            date,
            time,
            slotId,
            anonymous: anonymous === 'on',
            userId,
            status
        });

        const savedReservation = await newReservation.save();


        await User.updateOne({ userId }, { $inc: { ticketCount: -1 } });


        const ticketUsage = new TicketUsage({
            userId,
            reservationId: savedReservation._id,
            slotId,
            space,
            date,
            status
        });

        await ticketUsage.save();

        res.redirect(`/adminReserve`);
    } catch (error) {
        console.error('Error submitting reservation:', error);
        res.status(500).send('Internal Server Error');
    }
});


  app.get('/api/reservations', isAuthenticated, async (req, res) => {
    try {
        let query = {};

       
        if (req.query.space) {
            query = {
                space: req.query.space,
            };
        } else {
            query = { userId: req.session.user.userId };
        }

        const reservations = await Reservation.find(query).sort({ time: 1 });
        res.status(200).json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/reservations/all', isAuthenticated, async (req, res) => {
    try {
        const reservations = await Reservation.find({}).sort({ date: 1, time: 1 });
        res.status(200).json(reservations);
    } catch (error) {
        console.error('Error fetching all reservations:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/updateReservationStatus', isAuthenticated, async (req, res) => {
    try {
        const { reservationId, newStatus } = req.body;

        if (!reservationId || !newStatus) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const updated = await Reservation.findByIdAndUpdate(
            reservationId,
            { status: newStatus },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Reservation not found.' });
        }

        res.status(200).json({ success: true, message: 'Status updated.', reservation: updated });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/userReservations', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.userId;
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
        const { reservationId, space, date, time, slotId, anonymous, status } = req.body;

        const slotIdNumber = parseInt(slotId, 10);
        if (isNaN(slotIdNumber) || slotIdNumber < 1 || slotIdNumber > 25) {
            return res.status(400).json({ message: 'Please enter a valid slot number (1-25)' });
        }


        const conflictingReservation = await Reservation.findOne({
            _id: { $ne: reservationId },
            space,
            date,
            time,
            slotId,
            status
        });


        if (conflictingReservation) {
            return res.status(400).json({ message: 'The slot is already taken for the selected time.' });
        }

        const reservation = await Reservation.findByIdAndUpdate(reservationId, {
            space,
            date,
            time,
            slotId,
            anonymous,
            status
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
        const searchTerm = req.query.userId;
        const users = await User.find({ userId: { $regex: searchTerm, $options: 'i' } });
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
                profileImg: user.profileImg,
                carPlate: user.carPlate
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
                carPlate: user.carPlate,
                profileImg: user.profileImg,
                reservations: reservations.map(reservation => ({
                    _id: reservation._id,
                    space: reservation.space,
                    date: reservation.date.toDateString(),
                    time: reservation.time,
                    slotId: reservation.slotId,
                    status:reservation.status
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

            const reservations = await Reservation.find({ userId: user.userId }).lean();

            res.render('adminViewUserProfile', {
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                description: user.profileDesc,
                carPlate: user.carPlate,
                profileImg: user.profileImg,
                reservations: reservations.map(reservation => ({
                    _id: reservation._id,
                    space: reservation.space,
                    date: reservation.date.toDateString(),
                    time: reservation.time,
                    slotId: reservation.slotId,
                    anonymous: reservation.anonymous ? 'Yes' : 'No',
                    status: reservation.status
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


app.post('/api/addCar', async (req, res) => {
    try {
      const { userId, plateNumber } = req.body;

      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
  
      if (!user.carPlate) {
        user.carPlate = [];
      }

      if (user.carPlate.includes(plateNumber)) {
        return res.status(400).json({ message: 'This plate number already exists.' });
      }
  
      user.carPlate.push(plateNumber);
      await user.save();
  
      return res.json({
        message: 'New plate number added successfully!',
        carPlate: user.carPlate
      });
    } catch (error) {
      console.error('Error updating car plate:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  
app.delete('/api/deleteCar', async (req, res) => {
    try {
      const { plate } = req.body;
      if (!plate) {
        return res.status(400).json({ success: false, message: 'Missing plate number' });
      }
  
      const userId = req.session.userId; 
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
  
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  

      user.carPlate = user.carPlate.filter(existingPlate => existingPlate !== plate);
  
   
      await user.save();
  
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
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
app.post('/api/markReservationCompleted', async (req, res) => {
    const { userId, slotId, date, time, status } = req.body;

    try {
        const reservation = await Reservation.findOneAndUpdate(
            { userId, slotId, date, time },
            { status: 'completed' },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Reservation marked as completed' });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/user-status/:userName', async (req, res) => {
    const userName = req.params.userName;

    try {
        const userReservations = await Reservation.find({
            userName,
            status: 'overtime'
        });

        const accountDisabled = userReservations.length > 0;

        res.json({ accountDisabled });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check user status' });
    }
});

app.get('/overtimePayment', isAuthenticated, isStudent, (req, res) => {
    const receipt = req.session.overtimePayment;
    if (!receipt) return res.redirect('/ticketDashboard');
  
    res.render('overtimePayment', receipt);
});
  


app.post('/api/payOvertime', isAuthenticated, async (req, res) => {
    try {
      const { reservationId } = req.body;
      const reservation = await Reservation.findById(reservationId);
  
      if (!reservation || reservation.status !== 'overtime') {
        return res.status(400).send('Invalid or already paid reservation.');
      }
  
   
      reservation.status = 'paid';
      reservation.paidAt = new Date();
      await reservation.save();
  
 
      req.session.overtimePayment = {
        userName: req.session.user.name,
        userId: req.session.user.userId,
        floor: reservation.space,
        date: reservation.date.toDateString(),
        time: reservation.time,
        slotId: reservation.slotId,
        paidAt: new Date().toLocaleString(),
        price: 1200
      };
  
      res.redirect('/overtimePayment');
    } catch (error) {
      console.error('Error processing overtime payment:', error);
      res.status(500).send('Error processing payment.');
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
                userId: '12279391',
                carPlate:'ABC123',
                ticketCount: 10
            },
            {
                name: 'Mingyu Kim',
                email: 'gyu_kim@dlsu.edu.ph',
                password: '$2a$10$5M4u66LXTV38DLAGiijsj.1TNVOikADMesh3C4ED04qos32QwV9mq',
                role: 'student',
                department: 'CCS',
                profileImg: '/assets/mingyu.jpg',
                profileDesc: 'i also love coding',
                userId: '12279392',
                carPlate:'DEF456',
                ticketCount: 10
            },
            {
                name: 'Jin Kim',
                email: 'seokjin_kim@dlsu.edu.ph',
                password: '$2a$10$ZNL506GF7PpzDKyt2R5PHOhABxEbPQANOs6zjqiriX5CkQVAqljx6',
                role: 'student',
                department: 'COB',
                profileImg: '/assets/jin.jpg',
                profileDesc: 'i love business',
                userId: '12279396',
                carPlate:'GHI789',
                ticketCount: 10
            },
            {
                name: 'Momo Hirai',
                email: 'momo_hirai@dlsu.edu.ph',
                password: '$2a$10$kdrGPQJYkO9HyjmL4h9dIe5eVpFWZ3VPMgJgIVMqO/yqP9Yoxi.f6',
                role: 'student',
                department: 'COE',
                profileImg: '/assets/momo.jpg',
                profileDesc: 'i love economics',
                userId: '12279395',
                carPlate:'JKL901',
                ticketCount: 10
            },
            {
                name: 'Jake Sim',
                email: 'jake_sim@dlsu.edu.ph',
                password: '$2a$10$GFl6DPhTIKatOEfIAqr9Vu2TXXCJV4GeAWkwjxEayCrErd1Tr5AC.',
                role: 'student',
                department: 'CCS',
                profileImg: '/assets/jake.jpg',
                profileDesc: 'i love computer science',
                userId: '12279394',
                carPlate:'MNO234',
                ticketCount: 10
            },
            {
                name: 'Seulgi Kang',
                email: 'k.seulgi@dlsu.edu.ph',
                password: '$2a$10$RLEKuBc32fIvJl6IIEbR4uGuO8lvbmEIL3l5pVlRx37PjG0IAUiKG',
                role: 'technician',
                department: 'CCS',
                profileImg: '/assets/seulgi.jpg',
                profileDesc: 'i love coding and teaching',
                userId: '12279393',
                carPlate:'PQR567',
                ticketCount: 10
            }


        ];


        const reservationData = [
            {
                space: '5th Floor',
                date: new Date('2025-04-10'),
                time: '13:46',
                slotId: '1',
                anonymous: false,
                userId: '12279394',
                status: 'active'
            },
            {
                space: '3rd Floor',
                date: new Date('2025-04-10'),
                time: '09:00',
                slotId: '2',
                anonymous: true,
                userId: '12279395',
                status: 'active'
            },
            {
                space: '3rd Floor',
                date: new Date('2025-04-10'),
                time: '09:30',
                slotId: '4',
                anonymous: true,
                userId: '12279396',
                status: 'active'
            },
            {
                space: '3rd Floor',
                date: new Date('2025-04-10'),
                time: '09:30',
                slotId: '2',
                anonymous: true,
                userId: '12279392',
                status: 'active'
            },
            {
                space: '4th Floor',
                date: new Date('2025-04-10'),
                time: '09:30',
                slotId: '4',
                anonymous: true,
                userId: '12279391',
                status: 'active'
            },
            {
                space: '4th Floor',
                date: new Date('2025-04-10'),
                time: '09:30',
                slotId: '4',
                anonymous: false,
                userId: '12279391',
                status: 'active'
            }


        ];


        const spaceData = [
            { name: '3rd Floor', location: '3rd Floor' },
            { name: '4th Floor', location: '4th Floor' },
            { name: '5th Floor', location: '5th Floor' }
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

const ticketRoutes = require('./js files/ticketRoutes');
app.use('/api', ticketRoutes);

  
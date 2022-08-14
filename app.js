const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const {
  body,
  validationResult,
  check,
} = require('express-validator');
const methodOverride = require('method-override');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

require('./utils/db');

const Contact = require('./model/contact');


const app = express();
const port = process.env.PORT || 3000;

// setup method override
app.use(methodOverride('_method'));

// gunakan ejs
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({
  extended: true
}));

app.use(cookieParser('secret'));
app.use(session({
  cookie: {
    maxAge: 60000
  },
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))

app.use(flash());

app.listen(port, () => {
  console.log(`Server started on port http://localhost:${port}`);
})

// Halaman Home
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Halaman Beranda | Super Contact',
    layout: 'layouts/main-layout',
    active: 'beranda'
  });
})

// Halaman About
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'Halaman Tentang | Super Contact',
    layout: 'layouts/main-layout',
    active: 'tentang'
  });
})

// Halaman Contact
app.get('/contact', async (req, res) => {
  const contacts = await Contact.find();
  res.render('contact', {
    title: 'Halaman Kontak | Super Contact',
    layout: 'layouts/main-layout',
    active: 'kontak',
    contacts,
    msg: req.flash('msg')
  });
})

// Halaman tambah kontak
app.get('/contact/add', (req, res) => {
  res.render('add-contact', {
    title: 'Halaman Tambah Kontak | Super Contact',
    active: 'kontak',
    layout: 'layouts/main-layout'
  });
})

// proses tambah data kontak
app.post('/contact', [
  body('nama').custom(async (value) => {
    const duplikat = await Contact.findOne({
      nama: value
    });
    if (duplikat) {
      throw new Error('Nama sudah ada');
    }
    return true;
  }),
  check('email', 'Email tidak valid!').isEmail(),
  check('noHP', 'No HP tidak valid').isMobilePhone('id-ID')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('add-contact', {
      title: 'Halaman Tambah Kontak | Super Contact',
      layout: 'layouts/main-layout',
      errors: errors.array()
    });
  } else {
    Contact.insertMany(req.body, (error) => {
      req.flash('msg', 'Kontak berhasil ditambahkan');
      res.redirect('/contact');
    });
  }
})

// Proses hapus kontak
app.delete('/contact', (req, res) => {
  Contact.deleteOne({
    nama: req.body.nama
  }).then((result) => {
    req.flash('msg', 'Kontak berhasil dihapus');
    res.redirect('/contact');
  })
})

// halaman form edit data
app.get('/contact/edit/:nama', async (req, res) => {
  const contact = await Contact.findOne({
    nama: req.params.nama
  });
  res.render('edit-contact', {
    title: 'Halaman Ubah Kontak | Super Contact',
    layout: 'layouts/main-layout',
    active: 'kontak',
    contact
  });
})

// proses edit data kontak
app.put('/contact', [
  body('nama').custom(async (value, {
    req
  }) => {
    const duplikat = await Contact.findOne({
      nama: value
    });
    if (value !== req.body.oldNama && duplikat) {
      throw new Error('Nama sudah ada');
    }
    return true;
  }),
  check('email', 'Email tidak valid!').isEmail(),
  check('noHP', 'No HP tidak valid').isMobilePhone('id-ID')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('edit-contact', {
      title: 'Halaman Ubah Kontak | Super Contact',
      layout: 'layouts/main-layout',
      errors: errors.array(),
      contact: req.body
    });
  } else {
    Contact.updateOne({
      _id: req.body._id
    }, {
      $set: {
        nama: req.body.nama,
        email: req.body.email,
        noHP: req.body.noHP
      }
    }).then((result) => {
      req.flash('msg', 'Kontak berhasil diubah');
      res.redirect('/contact');
    })
  }
})

// Halaman detail kontak
app.get('/contact/:nama', async (req, res) => {
  const contact = await Contact.findOne({
    nama: req.params.nama
  });
  res.render('detail', {
    title: 'Halaman Detail Kontak | Super Contact',
    layout: 'layouts/main-layout',
    active: 'kontak',
    contact
  });
})
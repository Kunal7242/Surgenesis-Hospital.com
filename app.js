// app.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer'); 
const multer = require('multer');
const session = require('express-session');
// const blogRoutes = require('./models/blog');
const blog = new Blog({
  title: req.body.title,
  description: req.body.description, // contains rich HTML
});
await blog.save();



const app = express();
const PORT = process.env.PORT || 8080;

mongoose.connect('mongodb://127.0.0.1:27017/surgenesis_hospital')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ DB Error:', err));

// Inline Mongoose Schema + Model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  number: String,
  suggestion: String
});
const User = mongoose.model('User', userSchema);

// Blog model
const blogSchema = new mongoose.Schema({
  title: String,
  summary: String,
  image: String,
  description: String,
  // points: [String],
});
const Blog = mongoose.model('Blog', blogSchema);




// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Fake login middleware – should be before your routes
// app.use((req, res, next) => {
//   req.user = { role: 'doctor' };  
//   next();
// });
// ✅ Put this middleware after session setup





// Multer for blog image upload
const upload = multer({ dest: 'public/uploads/' });
// Middleware to protect doctor-only routes
function onlyDoctor(req, res, next) {
  if (req.session.user && req.session.user.role === 'doctor') {
    return next();
  }
  return res.status(403).send('Access Denied');
}

app.use(session({
  secret: 'surgenesis_secret_key',
  resave: false,
  saveUninitialized: true
}));
// Inject session user into EJS globally
app.use((req, res, next) => {
     res.locals.user = req.session.user || null;
  next();
});


// Routes
app.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    const msg = req.query.msg || '';

    res.render('index', {
      allBlogs: blogs,
      notify: msg,
      user: req.session.user || null 
      // No need to pass user explicitly if middleware is set
    });
  } catch (err) {
    console.error(err);
    res.render('index', {
      allBlogs: [],
      notify: ''
    });
  }
});


app.get('/hand',async (req,res)=>{
          await res.render('hand');
});

app.get('/blog/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog not found');
    res.render('blogDetail', { blog });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading blog');
  }
});

app.get('/plastic',(req,res)=>{
  res.render("plastic");
})
app.get("/pt", (req, res) => {
  res.render("pt");
});

app.get("/blogs",(req,res)=>{
  res.render("blogs");
})

app.get('/leader',(req,res)=>{
  res.render('leader')
})

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/doctor', (req, res) => {
  res.render('doctor');
});

app.get('/doctor1', (req, res) => {
  res.render('doctor1');
});

app.get('/ortho', (req, res) => {
  res.render('ortho');
});

app.get('/aboutck',(req,res)=>{
  res.render('aboutck');
})



// Add Blog
app.post('/blog/add', upload.single('image'), async (req, res) => {
  const { title, summary, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  // const bulletPoints = points ? points.split('\n').map(p => p.trim()).filter(p => p) : [];

  const newBlog = new Blog({
    title,
    summary,
    description,
    image,
    // points:points.split('\n').map(p => p.trim())
  });

  await newBlog.save();
  res.redirect('/blogpage?msg=added');
});


// Delete Blog
app.post('/blog/delete/:id', onlyDoctor, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect('/?msg=deleted');
});


// Contact Form Submit
app.post('/submit', async (req, res) => {
  const { name, email, number, suggestion } = req.body;

  try {
    // Save to DB
    await User.create({ name, email, number, suggestion });

    // Email notification
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kunal72427242@gmail.com',
        pass: 'trsbqhpugkiraisw'
      }
    });

    await transporter.sendMail({
      from: '"Website Form" <kunal72427242@gmail.com>',
      to: 'animeunivers72@gmail.com',
      subject: 'New Form Submission',
      html: `<h3>New Submission</h3>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Mobile no:</strong>${number}</p>
             <p><strong>Suggestion:</strong>${suggestion}</p>`
    });

    res.redirect('/');
  } catch (err) {
    console.error("Error Details:", err);
    res.send('Error saving or sending email');
  }
});





app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'DrAmit' && password === 'amit123') {
    req.session.user = { role: 'doctor' }; // ✅ Save to session
    return res.redirect('/blogpage');
  } else {
    return res.redirect('/?msg=wrong');
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/blogpage');
  });
});






app.get('/blogpage', async (req, res) => {
  try {
    const allBlogPosts = await Blog.find().sort({ createdAt: -1 });
    res.render('blogpage', { allBlogPosts, user: req.session.user || null });
  } catch (err) {
    console.error(err);
    res.render('blogpage', { allBlogPosts: [], user: req.session.user || null });
  }
});

app.post('/blogpage/delete/:id', onlyDoctor, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect('/blogpage');
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send('Error deleting blog');
  }
});


app.get('/blogpage/view/:id',async(req,res)=>{
   try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog not found');
    res.render('blogDetail', { blog });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading blog');
  }
})






// Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

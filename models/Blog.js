
const mongoose = require('mongoose');

// models/Blog.js
const blogSchema = new mongoose.Schema({
  title: String,
  summary: String,
  image: String,
  description: String, // full blog content
  // points: [String],
});
module.exports = mongoose.model('Blog', blogSchema);

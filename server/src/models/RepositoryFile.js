const mongoose = require('mongoose');

const repositoryFileSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  extension: {
    type: String,
  },
  language: {
    type: String,
  },
  size: {
    type: Number,
    default: 0,
  },
  lineCount: {
    type: Number,
    default: 0,
  },
  importCount: {
    type: Number,
    default: 0,
  },
  exportCount: {
    type: Number,
    default: 0,
  },
  functionCount: {
    type: Number,
    default: 0,
  },
  functions: {
    type: [String],
  },
  classes: {
    type: [String],
  },
  isEntry: {
    type: Boolean,
    default: false,
  },
  isDead: {
    type: Boolean,
    default: false,
  },
  complexityScore: {
    type: Number,
    default: 0,
  },
  content: {
    type: String,
  },
});

module.exports = mongoose.model('RepositoryFile', repositoryFileSchema);

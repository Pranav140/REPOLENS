const mongoose = require('mongoose');

const repositoryEdgeSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
  },
  source: {
    type: String,
  },
  target: {
    type: String,
  },
  type: {
    type: String,
    enum: ['import', 'export'],
    default: 'import',
  },
});

module.exports = mongoose.model('RepositoryEdge', repositoryEdgeSchema);

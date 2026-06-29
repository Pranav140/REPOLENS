const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    language: {
      type: String,
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    analyzedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
    },
    recentCommits: [
      {
        sha: String,
        message: String,
        author: String,
        date: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Repository', repositorySchema);

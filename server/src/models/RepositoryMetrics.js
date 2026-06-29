const mongoose = require('mongoose');

const repositoryMetricsSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      unique: true,
    },
    healthScore: {
      type: Number,
      default: 0,
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    totalFunctions: {
      type: Number,
      default: 0,
    },
    totalImports: {
      type: Number,
      default: 0,
    },
    circularDependencies: {
      type: Number,
      default: 0,
    },
    deadFiles: {
      type: Number,
      default: 0,
    },
    averageComplexity: {
      type: Number,
      default: 0,
    },
    mostImportedFile: {
      type: String,
    },
    largestFile: {
      type: String,
    },
    techStack: {
      type: [String],
    },
    languages: {
      type: Map,
      of: Number,
    },
    documentationScore: {
      type: Number,
      default: 0,
    },
    securityIssues: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RepositoryMetrics', repositoryMetricsSchema);

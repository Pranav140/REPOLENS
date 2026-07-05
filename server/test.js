require('mongoose').connect('mongodb+srv://gargpranav851_db_user:qFOOC1f8jJ6lxFBU@cluster0.0rayizr.mongodb.net/repolens?appName=Cluster0').then(async () => { 
  const repo = await require('./src/models/Repository').findOne({owner: 'Pranav140', name: 'UMS'}); 
  console.log('Repo ID:', repo._id);
  const edges = await require('./src/models/RepositoryEdge').find({ repositoryId: repo._id });
  const attendanceEdges = edges.filter(e => e.source.includes('attendance.tsx') || e.target.includes('attendance.tsx'));
  console.log('Attendance edges:', attendanceEdges);
}).catch(console.error);

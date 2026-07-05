const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const userId = '6a47a6800070ef8df8b5c7c8';
const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

async function test() {
  try {
    const m = await axios.get('http://localhost:5000/api/repos/Pranav140/UMS/metrics', { headers: { Authorization: `Bearer ${token}` } });
    console.log('METRICS:', m.status);
    const f = await axios.get('http://localhost:5000/api/repos/Pranav140/UMS/files', { headers: { Authorization: `Bearer ${token}` } });
    console.log('FILES:', f.status);
    const h = await axios.get('http://localhost:5000/api/graph/Pranav140/UMS/hotspots', { headers: { Authorization: `Bearer ${token}` } });
    console.log('HOTSPOTS:', h.status);
  } catch (e) {
    console.error('ERROR:', e.response ? e.response.status : e.message);
    if (e.response && e.response.data) console.error('DATA:', e.response.data);
  }
}
test();

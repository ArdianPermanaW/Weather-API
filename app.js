const axios = require('axios');
require('dotenv').config();
const redis = require('redis');
const {program} = require('commander');
const express = require('express');
const rateLimit = require('express-rate-limit');

const apiKey = process.env.API_KEY;
const client = redis.createClient();
const app = express();

client.on('connect', () => console.log('Connected to Redis'));
client.on('error', (err) => console.error('Redis error:', err));
(async () => {
  try {
    await client.connect();
    console.log('Redis client connected');
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
})();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //apparantly its in ms so thats what the * 1000 is for //well no shit it says ms stupid
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, 
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

async function fetchPosts(url) {
  try {
    const cachedResponse = await client.get(url);
    if(cachedResponse){
      console.log("cache hit!");
      return JSON.parse(cachedResponse);
    }
    console.log("no cache");
    // Fetch data from API
    const response = await axios.get(url);

    // Cache the response with unlimited TTL WAAA
    await client.set(url, JSON.stringify(response.data), { EX: 43200 });


    return response.data;
  }catch(err){
    console.error('Error fetching data:', err);
    throw err;
  }
}

app.get('/weather/:nation',limiter, async (req, res) => {
  const {nation} = req.params
  const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${nation}?unitGroup=metric&key=${apiKey}&contentType=json`;
  fetchPosts(apiUrl)
    .then((data) => console.log('Data:', data))
    .catch((err) => console.log(err));
});

program
  .version('1.0.0')
  .description('Weather API CLI');

program
  .command('fetch')
  .description('fetch the specified nation weather data')
  .argument('<string>', 'name of the nation')
  .action(async (nation) =>{
    try {
      const response = await axios.get(`http://localhost:3000/weather/${nation}`);
      console.log('Weather Data:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // If the status code is 429, print the custom message from the response body
        console.error('Rate limit exceeded:', error.response.data.message);
      } else {
        console.error('Error:', error.message);
      }
    }
  });

// Start Express Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

console.log('Parsing command-line arguments...');
program.parse(process.argv);
console.log('Arguments parsed.');





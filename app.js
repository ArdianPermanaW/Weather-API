const axios = require('axios');
require('dotenv').config();
const redis = require('redis');
const {command, program} = require('commander');

const apiKey = process.env.API_KEY;

const client = redis.createClient();

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
    await client.set(url, JSON.stringify(response.data));


    return response.data;
  }catch(err){
    console.error('Error fetching data:', err);
    throw err;
  }
}

program
  .version('1.0.0')
  .description('Weather API CLI');

program
  .command('fetch')
  .description('fetch the specified nation weather data')
  .argument('<string>', 'name of the nation')
  .action(async (nation) =>{
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${nation}?unitGroup=metric&key=${apiKey}&contentType=json`;
    fetchPosts(apiUrl)
      .then((data) => console.log('Data:', data))
      .catch((err) => console.log(err));
  });

console.log('Parsing command-line arguments...');
program.parse(process.argv);
console.log('Arguments parsed.');





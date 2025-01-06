const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.API_KEY;
const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/indonesia?unitGroup=metric&key=${apiKey}&contentType=json`;

let isFetching = false;

async function fetchPosts() {
  if (isFetching) return; // Prevent duplicate calls
  isFetching = true;

  try {
    const response = await axios.get(apiUrl);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error fetching posts:', error.message);
  } finally {
    isFetching = false;
  }
}

fetchPosts();


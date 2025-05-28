const { Client } = require("@googlemaps/google-maps-services-js");
const axios = require("axios");

const client = new Client({});

const getRestaurants = async (city, latitude, longitude) => {
  try {
    if (!city && (!latitude || !longitude)) {
      throw new Error("Please provide either city or latitude and longitude");
    }

    let location;
    if (city) {
      const geoResponse = await client.geocode({
        params: {
          address: city,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });

      if (!geoResponse.data.results.length) {
        throw new Error("city not found");
      }
      location = geoResponse.data.results[0].geometry.location;
    } else {
      location = { lat: latitude, lng: longitude };
    }

    const placesResponse = await client.placesNearby({
      params: {
        location,
        radius: 15000,
        type: "restaurant",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (placesResponse.data.status !== "OK") {
      throw new Error(`Google Places API Error: ${placesResponse.data.status}`);
    }

    const restaurants = placesResponse.data.results.map((place) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
    }));

    return restaurants;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    throw error;
  }
};

module.exports = { getRestaurants };

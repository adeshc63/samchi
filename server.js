import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// MongoDB Connection
try {
    await mongoose.connect('mongodb+srv://xtech721:xtech721@dorasuke.admtw68.mongodb.net/ott-streaming');
    console.log('Connected to MongoDB');
} catch (error) {
    console.error('MongoDB connection error:', error);
}

// Movie Schema
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    year: { type: String, required: true },
    rating: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    streamUrl: { type: String, required: true }
});

const Movie = mongoose.model('Movie', movieSchema);

// Routes
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        console.log('Fetched movies:', movies);
        res.json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/movies', async (req, res) => {
    try {
        console.log('Received movie data:', req.body);

        const { title, year, rating, thumbnailUrl, streamUrl } = req.body;
        if (!title || !year || !rating || !thumbnailUrl || !streamUrl) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const movie = new Movie({
            title,
            year,
            rating,
            thumbnailUrl,
            streamUrl
        });

        const newMovie = await movie.save();
        console.log('Saved new movie:', newMovie);
        res.status(201).json(newMovie);
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(400).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

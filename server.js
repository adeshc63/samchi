import express from 'express'; 
 import mongoose from 'mongoose'; 
 import cors from 'cors'; 
 
 const app = express(); 
 const port = process.env.PORT || 3000; 
 
 // Enable CORS 
 app.use(cors()); 
 app.use(express.json()); 
 
 // MongoDB Connection 
 try { 
     await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://xtech721:xtech721@dorasuke.admtw68.mongodb.net/ott-streaming'); 
     console.log('Connected to MongoDB'); 
 } catch (error) { 
     console.error('MongoDB connection error:', error); 
     process.exit(1); // Exit if DB connection fails
 } 
 
 // Movie Schema 
 const movieSchema = new mongoose.Schema({ 
     title: { type: String, required: true }, 
     year: { type: String, required: true }, 
     rating: { type: String, required: true }, 
     thumbnailUrl: { type: String, required: true }, 
     streamUrl: { type: String, required: true }, 
     category: { type: String, default: 'Uncategorized' } // Added category field
 }); 
 
 const Movie = mongoose.model('Movie', movieSchema); 
 
 // Routes 
 // GET all movies
 app.get('/api/movies', async (req, res) => { 
     try { 
         const movies = await Movie.find(); 
         res.json(movies); 
     } catch (error) { 
         console.error('Error fetching movies:', error); 
         res.status(500).json({ message: error.message }); 
     } 
 }); 
 
 // POST a new movie
 app.post('/api/movies', async (req, res) => { 
     try { 
         const { title, year, rating, thumbnailUrl, streamUrl, category } = req.body; 
         if (!title || !year || !rating || !thumbnailUrl || !streamUrl) { 
             return res.status(400).json({ message: 'Title, year, rating, thumbnailUrl, and streamUrl are required' }); 
         } 
 
         const movie = new Movie({ 
             title, 
             year, 
             rating, 
             thumbnailUrl, 
             streamUrl, 
             category: category || 'Uncategorized'
         }); 
 
         const newMovie = await movie.save(); 
         res.status(201).json(newMovie); 
     } catch (error) { 
         console.error('Error adding movie:', error); 
         res.status(400).json({ message: error.message }); 
     } 
 }); 

 // PUT (update) a movie by ID
app.put('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, year, rating, thumbnailUrl, streamUrl, category } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Invalid movie ID' });
        }

        const updatedMovie = {
            title,
            year,
            rating,
            thumbnailUrl,
            streamUrl,
            category: category || 'Uncategorized',
            _id: id
        };

        const result = await Movie.findByIdAndUpdate(id, updatedMovie, { new: true });
        if (!result) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(result);
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).json({ message: error.message });
    }
});

// DELETE a movie by ID
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Invalid movie ID' });
        }

        const result = await Movie.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({ message: error.message });
    }
});
 
 app.listen(port, () => { 
     console.log(`Server is running on port ${port}`); 
 });

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
     category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference Category model
     isTrending: { type: Boolean, default: false } // Added isTrending field
 }); 
 
 const Movie = mongoose.model('Movie', movieSchema);

 // Category Schema
 const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
 });

 const Category = mongoose.model('Category', categorySchema); 
 
 // Routes 
 // GET all movies
 app.get('/api/movies', async (req, res) => { 
     try { 
         const movies = await Movie.find().populate('category'); // Populate category details
         res.json(movies); 
     } catch (error) { 
         console.error('Error fetching movies:', error); 
         res.status(500).json({ message: error.message }); 
     } 
 });

 // GET trending movies
 app.get('/api/movies/trending', async (req, res) => {
    try {
        const trendingMovies = await Movie.find({ isTrending: true }).populate('category');
        res.json(trendingMovies);
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        res.status(500).json({ message: error.message });
    }
 });

 // Category Routes
 // GET all categories
 app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: error.message });
    }
 });

 // POST a new category
 app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const category = new Category({ name });
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error adding category:', error);
        if (error.code === 11000) { // Handle duplicate key error for category name
            return res.status(400).json({ message: 'Category name already exists' });
        }
        res.status(400).json({ message: error.message });
    }
 });

 // PUT (update) a category by ID
 app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Invalid category ID' });
        }
        const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
 });

 // DELETE a category by ID
 app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Invalid category ID' });
        }
        // Optional: Check if any movies are associated with this category before deleting
        const moviesInCategory = await Movie.find({ category: id });
        if (moviesInCategory.length > 0) {
            return res.status(400).json({ message: 'Cannot delete category. Movies are still associated with it.' });
        }
        const result = await Category.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: error.message });
    }
 });
 
 
 // POST a new movie
 app.post('/api/movies', async (req, res) => { 
     try { 
         const { title, year, rating, thumbnailUrl, streamUrl, category, isTrending } = req.body; 
         if (!title || !year || !rating || !thumbnailUrl || !streamUrl) { 
             return res.status(400).json({ message: 'Title, year, rating, thumbnailUrl, and streamUrl are required' }); 
         } 

         let categoryId = null;
         if (category) {
            if (mongoose.Types.ObjectId.isValid(category)){
                const foundCategory = await Category.findById(category);
                if (foundCategory) {
                    categoryId = foundCategory._id;
                } else {
                    return res.status(400).json({ message: 'Invalid category ID provided.' });
                }
            } else {
                 // If category is a string name, find or create it
                let foundCategory = await Category.findOne({ name: category });
                if (!foundCategory) {
                    // For simplicity, we are not creating a new category here if not found by name.
                    // Admin should create categories separately.
                    // Alternatively, you could create it: 
                    // foundCategory = new Category({ name: category });
                    // await foundCategory.save();
                     return res.status(400).json({ message: `Category with name '${category}' not found. Please create it first.` });
                }
                categoryId = foundCategory._id;
            }
         }

         const movie = new Movie({ 
             title, 
             year, 
             rating, 
             thumbnailUrl, 
             streamUrl, 
             category: categoryId, // Use the ObjectId of the category
             isTrending: isTrending || false
         }); 
 
         const newMovie = await movie.save(); 
         const populatedMovie = await Movie.findById(newMovie._id).populate('category');
         res.status(201).json(populatedMovie); 
     } catch (error) { 
         console.error('Error adding movie:', error); 
         res.status(400).json({ message: error.message }); 
     } 
 }); 

 // PUT (update) a movie by ID
app.put('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, year, rating, thumbnailUrl, streamUrl, category, isTrending } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Invalid movie ID' });
        }

        let categoryId = null;
        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)){
                const foundCategory = await Category.findById(category);
                if (foundCategory) {
                    categoryId = foundCategory._id;
                } else {
                    return res.status(400).json({ message: 'Invalid category ID provided for update.' });
                }
            } else {
                let foundCategory = await Category.findOne({ name: category });
                if (!foundCategory) {
                    return res.status(400).json({ message: `Category with name '${category}' not found. Please create it first for update.` });
                }
                categoryId = foundCategory._id;
            }
        }

        const updateData = {
            title,
            year,
            rating,
            thumbnailUrl,
            streamUrl,
            isTrending
        };

        if (categoryId !== undefined) { // only update category if it's provided
            updateData.category = categoryId;
        } else if (category === null || category === '') { // Allow unsetting category
             updateData.category = null;
        }

        const result = await Movie.findByIdAndUpdate(id, updateData, { new: true }).populate('category');
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

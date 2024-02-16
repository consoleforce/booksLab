const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'library', 
  password: 'qwerty123',
  port: 5432,
});

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
  });
  

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'An error occurred while registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        res.status(200).json({ id: user.id, message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'An error occurred while logging in' });
  }
});
  
  
app.get('/books', (req, res) => {
    res.sendFile(__dirname + '/public/books.html');
  });
  
  
  app.post('/api/books', async (req, res) => {
    try {
      const { title, author, isbn } = req.body;
      const result = await pool.query(
        'INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3) RETURNING *',
        [title, author, isbn]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({ message: 'An error occurred while creating book' });
    }
  });
  
  app.get('/api/books', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM books');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error retrieving books:', error);
      res.status(500).json({ message: 'An error occurred while retrieving books' });
    }
  });
  
  app.get('/api/books/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Book not found' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    } catch (error) {
      console.error('Error retrieving book:', error);
      res.status(500).json({ message: 'An error occurred while retrieving book' });
    }
  });
  
  app.put('/api/books/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, author, isbn } = req.body;
      const result = await pool.query(
        'UPDATE books SET title = $1, author = $2, isbn = $3 WHERE id = $4 RETURNING *',
        [title, author, isbn, id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Book not found' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      res.status(500).json({ message: 'An error occurred while updating book' });
    }
  });
  
app.delete('/api/books/:id', async (req, res) => {
  try {
      const { id } = req.params;
      await pool.query('DELETE FROM borrowings WHERE book_id = $1', [id]);
      
      const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
          res.status(404).json({ message: 'Book not found' });
      } else {
          res.status(200).json({ message: 'Book deleted successfully' });
      }
  } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ message: 'An error occurred while deleting book' });
  }
});


app.post('/api/borrow', async (req, res) => {
  try {
    const { user_id, book_id } = req.body;
    
    const book = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (!book.rows[0]) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const existingBorrowing = await pool.query('SELECT * FROM borrowings WHERE book_id = $1 AND returned_at IS NULL', [book_id]);
    if (existingBorrowing.rows.length > 0) {
      return res.status(400).json({ message: 'Book is already borrowed' });
    }

    await pool.query(
      'INSERT INTO borrowings (user_id, book_id) VALUES ($1, $2)',
      [user_id, book_id]
    );

    res.status(201).json({ message: 'Book borrowed successfully' });
  } catch (error) {
    console.error('Error borrowing book:', error);
    res.status(500).json({ message: 'An error occurred while borrowing book' });
  }
});

app.put('/api/return/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE borrowings SET returned_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    res.status(200).json({ message: 'Book returned successfully' });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ message: 'An error occurred while returning book' });
  }
});
  
app.get('/api/borrowings', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM borrowings');
      res.status(200).json(result.rows);
  } catch (error) {
      console.error('Error retrieving borrowing records:', error);
      res.status(500).json({ message: 'An error occurred while retrieving borrowing records' });
  }
});

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
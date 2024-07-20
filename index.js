const express = require('express');
const cors = require('cors');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const port =3000;
var Pool = require('pg-pool')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { authenticateToken } = require('./auth');
const {
  registerUser,
  loginUser,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
} = require('./controllers');

// dotenv.config();
const app = express();
// const port = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expen',
  password: 'Tanishka',
  port: 5432,
});

app.get('/',(req,res) =>{
    res.send('hey');
})

// Routes
app.post('/register', registerUser(pool, bcrypt));
app.post('/login', loginUser(pool, bcrypt, jwt, JWT_SECRET));
app.post('/expenses', authenticateToken, addExpense(pool));
app.put('/expenses/:id', authenticateToken, updateExpense(pool));
app.delete('/expenses/:id', authenticateToken, deleteExpense(pool));
app.get('/expenses', authenticateToken, getExpenses(pool));
app.get('/api/dashboard', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM dashboard');
    const dashboardData = result.rows[0]; 
    client.release();
    res.json(dashboardData);
  } catch (err) {
    console.error('Error fetching dashboard data', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

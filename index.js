const express = require('express');
const cors = require('cors');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const port =9001;
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
  getCategories,
  addCategory,
  deleteCategory,
  getreports,
  getYearlyReport,
  getCustomDateRangeReport,
  getDashboardSummary,
} = require('./controllers');

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
app.get('/expenses/:id', authenticateToken, getExpenses(pool));
app.get('/categories/:id', authenticateToken, getCategories(pool));
app.post('/addcategory', authenticateToken, addCategory(pool));
app.delete('/deletecat/:id', authenticateToken, deleteCategory(pool));
app.get('/getallreports/:year/:month' ,authenticateToken,getreports(pool));
app.get('/Yearly/:year' , authenticateToken , getYearlyReport(pool));
app.post('/rangereport' , authenticateToken , getCustomDateRangeReport(pool));
app.get('/dasdboard/:id', authenticateToken, getDashboardSummary(pool));



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

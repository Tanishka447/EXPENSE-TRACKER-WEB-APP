const { default: board } = require("../frontend/src/components/board");

const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = (pool, bcrypt) => async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        [name, email, hashedPassword]
      );
      console.log("result:",result.rows[0]);
      res.status(200).json({ id: result.rows[0].id });
    } catch (error) {
      console.error('Error inserting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  const loginUser = (pool, bcrypt, jwt, JWT_SECRET) => async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);
      const user = result.rows[0];
      if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '18h' });
        console.log("Generated token:", token);
        res.status(200).json({ token });
      } else {
        console.log("Authentication failed for email:", email);
        res.status(401).json({ error: 'Authentication failed' });
      }
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const addExpense =(pool) => async(req, res) =>{
    const{amount , category , date , notes} =req.body;
    const userId =req.user.id;
    try{
      const result = await pool.query(
       'INSERT INTO expenses (user_id, amount, category, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
       [userId, amount, category, date, notes]
      );
      res.status(201).json({ expense: result.rows[0] });
     } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    }
  };

  const updateExpense = (pool) => async (req, res) => {
    const { amount, category, date, notes } = req.body;
    const { id } = req.params;
    try {
      const result = await pool.query(
        'UPDATE expenses SET amount = $1, category = $2, date = $3, notes = $4 WHERE id = $5 RETURNING *',
        [amount, category, date, notes, id]
      );
      res.status(200).json({ expense: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const deleteExpense =(pool) => async(req,res) =>{
    const { id } = req.params;
    try{
      const result = await pool.query(
          'DELETE from expenses WHERE  id = {$1}',[id,]
      );
      res.status(204).json({message : 'deleted successfully'});
    } catch(error){
      res.send(500).json({error :'Internal server error'});
    }
  };

  const getExpenses = (pool) => async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await pool.query(
        'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
        [userId]
      );
      res.status(200).json(result.rows);
    } catch (error) {
     res.status(500).json({error : 'Internal server error'});
    }
  };
//categories
  const getCategories=(pool) =async(req,res)=>{
    const userId=req.user.id;
    try{
      const result = await pool.query(
        'SELECT * FROM categories where user_id =$1',[userId]
      );
      res.status(200).json(reslt.rows);
    }catch(err){
      console.log('error in getting the category',err);
      res.status(500).json({error: 'Internal server error'});
    }
  };

  const addCategory = (pool) = async (req, res) => {
    const { name, budget } = req.body;
    const userId = req.user.id; 
    try {
      await pool.query('INSERT INTO categories (name, budget, user_id) VALUES ($1, $2, $3)', [name, budget, userId]);
      res.status(201).json({ message: 'Category added successfully' });
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const deleteCategory = (pool) =async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      await pool.query('DELETE FROM expenses WHERE category_id = $1', [id]);
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  const getCategorySummary = (pool) = async (req, res) => {
    const userId = req.user.id; 
    try {
      const result = await pool.query(`
        SELECT 
          c.id, 
          c.name, 
          COALESCE(SUM(e.amount), 0) AS total_expenses
        FROM 
          categories c
        LEFT JOIN 
          expenses e ON c.id = e.category_id
        WHERE 
          c.user_id = $1
        GROUP BY 
          c.id, c.name
      `, [userId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error retrieving category summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


  //reports
const getMonthlyReport = (pool) =  async (req, res) => {
  const { year } = req.query;
  const userId = req.user.id; 
  try {
    const result = await pool.query(`
      SELECT 
        to_char(date, 'MM') AS month,
        SUM(amount) AS total_expenses
      FROM  expenses
      WHERE   user_id = $1 AND
        EXTRACT(YEAR FROM date) = $2
      GROUP BY 
        EXTRACT(MONTH FROM date)
      ORDER BY 
        EXTRACT(MONTH FROM date)
    `, [userId, year]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getQuarterlyReport = (pool) = async (req, res) => {
  const { year } = req.query;
  const userId = req.user.id; 
  try{
    const result = await pool.query(`
      SELECT 
        CONCAT('Q', EXTRACT(QUARTER FROM date)) AS quarter,
        SUM(amount) AS total_expenses
      FROM   expenses
      WHERE   user_id = $1 AND
        EXTRACT(YEAR FROM date) = $2
      GROUP BY 
        EXTRACT(QUARTER FROM date)
      ORDER BY 
        EXTRACT(QUARTER FROM date)
    `, [userId, year]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error generating quarterly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getYearlyReport = (pool)= async (req, res) => {
  const userId = req.user.id; 
  try {
    const result = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM date) AS year,
        SUM(amount) AS total_expenses FROM   expenses
      WHERE   user_id = $1
      GROUP BY   EXTRACT(YEAR FROM date)
      ORDER BY  EXTRACT(YEAR FROM date)`, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error generating yearly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



const getCustomDateRangeReport = (pool) = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id; 
  try {
    const result = await pool.query(`
      SELECT   date, amount FROM   expenses
      WHERE  user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY  date`, [userId, startDate, endDate]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error generating custom date range report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getComparisonReport = (pool) = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      WITH current_month_expenses AS (
        SELECT    SUM(amount) AS current_month_total
        FROM  expenses WHERE user_id = $1 AND
          EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
      ),
      previous_month_expenses AS (
        SELECT 
          SUM(amount) AS previous_month_total
        FROM  expenses
        WHERE   user_id = $1 AND
          EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
      )
      SELECT 
        current_month_total,previous_month_total
      FROM 
        current_month_expenses, previous_month_expenses
    `, [userId]);

    const { current_month_total, previous_month_total } = result.rows[0];
    res.status(200).json({ current_month_total, previous_month_total });
  } catch (error) {
    console.error('Error generating comparison report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


//dashboard

const getDashboardSummary = (pool) = async (req, res) => {
  const userId = req.user.id; 
  try {
    const expensesResult = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE user_id = $1', [userId]);
    const totalExpenses = expensesResult.rows[0].total_expenses;
    const totalIncome = 0; 
    const balance = totalIncome - totalExpenses;

    res.status(200).json({ totalExpenses, balance });
  } catch (error) {
    console.error('Error retrieving dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

  module.exports = {
    registerUser,
    loginUser,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenses,
      getCategories,
    addCategory,
    deleteCategory,
    getCategorySummary,
    getMonthlyReport,
    getQuarterlyReport,
    getYearlyReport,
    getCustomDateRangeReport,
    getComparisonReport,
    getDashboardSummary,
  };
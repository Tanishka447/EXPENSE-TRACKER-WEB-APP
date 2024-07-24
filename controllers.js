
const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = (pool, bcrypt) => async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const currentDate = new Date();
      const result = await pool.query(
        `INSERT INTO users (name, email, password,date) VALUES ($1, $2, $3 , $4) RETURNING id, currentDate`,
        [name, email, hashedPassword,currentDate]
      );
      console.log("result:",result.rows[0]);

      res.status(200).json({ 
        message: 'User successfully registered',
        id: result.rows[0].id 
      });
    } catch (error) {
      console.error('Error inserting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  


  const loginUser = (pool, bcrypt, jwt, JWT_SECRET) => async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT id, name, email, password, date FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '48h' });
        console.log("Generated token:", token);
        res.status(200).json({ 
          token,
          id: user.id,
          name: user.name,
          email: user.email,
          date: user.date // Include the date in the response
        });
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
    const{amount , category , notes} =req.body;
    const userId =req.user.id;
    const currentDate = new Date();
    try{
      const result = await pool.query(
       'INSERT INTO expenses (user_id, amount, category, date ,notes) VALUES ($1, $2, $3, $4, $5) RETURNING *,created_at',
       [userId, amount, category, currentDate , notes]
      );
      if (result.rows.length > 0) {
        res.status(201).json({ expense: result.rows[0] });
      } else {
        throw new Error('Failed to insert expense.');
      }
    } catch (error) {
      console.error('Error adding expense:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const updateExpense = (pool) => async (req, res) => {
    const { amount, category, notes } = req.body;
    const { id } = req.params;
    const currentDate = new Date();
    
    try {
      const result = await pool.query(
        'UPDATE expenses SET amount = $1, category = $2, date = $3, notes = $4, updated_at = $5 WHERE id = $6 RETURNING *',
        [amount, category, req.body.date, notes, currentDate,id]
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
    const {id} = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
        [id]
      );
      res.status(200).json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
//categories
  const getCategories = (pool) => async (req, res) => {
    const {id} = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM categories where id =$1', [id]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.log('error in getting the category', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const addCategory = (pool) => async (req, res) => {
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

  const deleteCategory = (pool) => async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
const getreports = (pool) => async (req, res) => {
const { year, month } = req.params;
try {
    const query = `
           SELECT COALESCE(SUM(expenditure_amount), 0) AS monthly_expenditure
            FROM reports 
            WHERE EXTRACT(YEAR FROM start_date) = $1 
            AND EXTRACT(MONTH FROM start_date) = $2 
            AND report_type = 'Monthly';
            `;
    const { rows } = await pool.query(query, [year, month]);
    const monthlyExpenditure = rows[0].monthly_expenditure || 0;
    res.json({ 
        year: parseInt(year),
        month: parseInt(month),
        monthly_expenditure: parseFloat(monthlyExpenditure)
    });
} catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
}
};

const getYearlyReport = (pool) => async (req, res) => {
  const { year } = req.params;
  try {
    const query = ` SELECT *
            FROM reports
            WHERE EXTRACT(YEAR FROM start_date) = $1; `;
        const { rows } = await pool.query(query, [year]);

        res.json(rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getCustomDateRangeReport = (pool) => async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const query = `
        SELECT *
        FROM reports
        WHERE start_date >= $1 AND end_date <= $2`;
    const { rows } = await pool.query(query, [startDate, endDate]);
    res.status(200).json(rows);
} catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
}
};


//dashboard
const getDashboardSummary = (pool) => async (req, res) => {
  const {id} = req.params; 
  try {
    const expensesResult = await pool.query('SELECT COALESCE(SUM(expenditure_amount), 0) AS total_expenses FROM reports WHERE id = $1', [id]);
    const totalExpenses = expensesResult.rows[0].total_expenses;
    const totalIncome = 30000 ; 
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
    getreports,
    getYearlyReport,
    getCustomDateRangeReport,
    getDashboardSummary,
  };

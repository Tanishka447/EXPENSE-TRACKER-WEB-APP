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


  module.exports = {
    registerUser,
    loginUser,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenses,
  };
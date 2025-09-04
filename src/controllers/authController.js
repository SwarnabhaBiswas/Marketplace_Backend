const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req,res,next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24*60*60*1000
    });

    res.json({ success:true, user: { name: user.name, email: user.email, role: user.role }});
  } catch (err) { next(err); }
};

exports.logout = (req,res) => {
  res.clearCookie('token');
  res.json({ success:true });
};

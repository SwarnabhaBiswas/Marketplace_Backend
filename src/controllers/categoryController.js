const Category = require('../models/Category');

exports.list = async (req, res, next) => {
  try {
    const items = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name required' });
    const slug = Category.slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(200).json({ success: true, data: existing });
    const doc = await Category.create({ name, slug });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name required' });
    const slug = Category.slugify(name);
    const exists = await Category.findOne({ slug, _id: { $ne: id } });
    if (exists) return res.status(409).json({ error: 'Category exists' });
    const doc = await Category.findByIdAndUpdate(id, { name, slug }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};


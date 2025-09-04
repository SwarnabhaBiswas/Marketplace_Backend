const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

exports.list = async (req,res,next) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) {
      filter.$text = { $search: q };
    }
    const items = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success:true, data: items });
  } catch (err) { next(err); }
};

exports.getBySlug = async (req,res,next) => {
  try {
    const slug = req.params.slug;
    const item = await Product.findOne({ slug });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ success:true, data: item });
  } catch (err) { next(err); }
};

exports.create = async (req,res,next) => {
  try {
    const body = req.body;
    if (!body.slug) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    }
    const doc = await Product.create(body);
    res.status(201).json({ success:true, data: doc });
  } catch (err) { next(err); }
};

exports.update = async (req,res,next) => {
  try {
    const id = req.params.id;
    const doc = await Product.findByIdAndUpdate(id, req.body, { new:true });
    res.json({ success:true, data: doc });
  } catch (err) { next(err); }
};

exports.remove = async (req,res,next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    const images = Array.isArray(product.images) ? product.images : [];
    const publicIds = images.map(img => img.publicId).filter(Boolean);
    if (publicIds.length) {
      await Promise.all(publicIds.map(pid => cloudinary.uploader.destroy(pid).catch(() => null)));
    }
    await Product.findByIdAndDelete(id);
    res.json({ success:true });
  } catch (err) { next(err); }
};

exports.removeImage = async (req,res,next) => {
  try {
    const id = req.params.id;
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId required' });
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    // destroy image in Cloudinary
    try { await cloudinary.uploader.destroy(publicId); } catch (e) { /* ignore */ }

    // remove from product doc
    product.images = (product.images || []).filter(img => img.publicId !== publicId);
    await product.save();

    res.json({ success:true, data: product });
  } catch (err) { next(err); }
};

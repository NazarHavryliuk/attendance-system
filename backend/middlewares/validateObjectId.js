const mongoose = require('mongoose');

const validateObjectId = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for ${paramName}`,
    });
  }

  return next();
};

module.exports = validateObjectId;

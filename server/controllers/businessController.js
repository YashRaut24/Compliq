function notImplemented(_req, res) {
  res.status(501).json({ message: "Not implemented" });
}

exports.getBusinesses = notImplemented;
exports.createBusiness = notImplemented;
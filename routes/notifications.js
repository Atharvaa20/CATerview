const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

// Get notifications
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId = decoded.userId

      // For now, return empty array since we don't have a notifications model yet
      res.json([])
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

module.exports = router

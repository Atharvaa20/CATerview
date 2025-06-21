const jwt = require('jsonwebtoken')
const { User } = require('../models')

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware triggered')
    const token = req.header('Authorization')?.replace('Bearer ', '')
    console.log('Received token:', !!token)
    
    if (!token) {
      console.log('No token found in Authorization header')
      throw new Error('No token provided')
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log('Token verified successfully')
      
      const user = await User.findByPk(decoded.userId)
      if (!user) {
        console.log('User not found in database')
        throw new Error('User not found')
      }

      // Add role from token to user object
      user.role = decoded.role

      req.token = token
      req.user = user
      next()
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      throw new Error('Invalid token')
    }
  } catch (error) {
    console.error('Authentication error:', error.message)
    res.status(401).json({ error: error.message || 'Please authenticate' })
  }
}

const admin = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, () => {
      // Then check if they're an admin
      if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' })
        return
      }
      next()
    })
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }
}

module.exports = {
  auth,
  admin
}

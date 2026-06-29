const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { generateJWT } = require('../services/authService');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

/**
 * POST /api/auth/github
 * Exchanges a GitHub OAuth code for an access token,
 * fetches the GitHub user profile, upserts the User
 * document, and returns a signed JWT.
 */
router.post('/github', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Bad Request', message: 'GitHub OAuth code is required' });
    }

    // Step 1: Exchange code → GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token, error: ghError } = tokenResponse.data;

    if (ghError || !access_token) {
      return res.status(401).json({
        error: 'GitHub OAuth Error',
        message: tokenResponse.data.error_description || 'Failed to exchange code for access token',
      });
    }

    // Step 2: Fetch GitHub user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': 'RepoLens',
      },
    });

    const githubUser = userResponse.data;

    // Step 3: Upsert the User in MongoDB
    const user = await User.findOneAndUpdate(
      { githubId: String(githubUser.id) },
      {
        githubId: String(githubUser.id),
        username: githubUser.login,
        email: githubUser.email || '',
        avatarUrl: githubUser.avatar_url || '',
        accessToken: access_token,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Step 4: Return signed JWT + user (omit accessToken from response)
    const token = generateJWT(user._id);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
router.get('/me', authenticate, (req, res) => {
  return res.status(200).json({ user: req.user });
});

/**
 * POST /api/auth/logout
 * Stateless logout — client discards the JWT.
 */
router.post('/logout', (req, res) => {
  return res.status(200).json({ success: true });
});

module.exports = router;

import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'super_secret_access_token_secret';
const ACCESS_TOKEN_EXPIRES_IN = '1m';
const REFRESH_TOKEN_SECRET = 'super_secret_refresh_token_secret';
const REFRESH_TOKEN_EXPIRES_IN = '3m';

/**
 * Imagine this is a table in our database that contains information about refresh tokens.
 * @type {{ refreshToken: string, userId: number, accessToken: string }[]}
 */
let refreshTokens = [];

/**
 * List of our users.
 * @type {{ id: number, email: string, password: string }[]}
 */
const users = [
  { id: 1, email: 'bilbo.baggins@middle.earth', password: 'going-on-adventure-123' },
  { id: 2, email: 'the.gandalf@middle.earth', password: 'looking-for-bilbo' },
];

/**
 * Generates new access and refresh tokens for user.
 * @param {Object} user Object containing user information
 * @param {number} user.id Id of the user
 * @param {string} user.email Email of the user
 * @returns {{ accessToken: string, refreshToken: string }} The generated tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign({ user: user }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(
    {
      user: user,
      accessToken: accessToken,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  refreshTokens.push({
    refreshToken,
    userId: user.id,
    accessToken,
  });

  return { accessToken, refreshToken };
};

/**
 * Authentication middleware for protected routes.
 */
const requireAuth = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).send({ message: 'Unauthorized.' });
  }

  const accessToken = authorizationHeader.split(' ')[1];

  let accessTokenPayload = null;

  try {
    accessTokenPayload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
  } catch (error) {
    accessTokenPayload = null;
  }

  if (!accessTokenPayload) {
    return res.status(401).send({ message: 'Unauthorized.' });
  }

  req.user = accessTokenPayload.user;
  return next();
};

const app = express();

app.use(bodyParser.json());

app.post('/express-api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find((e) => e.email === email && e.password === password);

  if (!user) {
    return res.status(401).send({ message: 'Wrong email or password.' });
  }

  return res.status(200).send(
    generateTokens({
      id: user.id,
      email: user.email,
    })
  );
});

app.post('/express-api/auth/refresh', (req, res) => {
  const { accessToken, refreshToken } = req.body;

  const accessTokenPayload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET, {
    ignoreExpiration: true,
  });

  if (accessTokenPayload.exp * 1000 > Date.now()) {
    return res.status(400).send({ message: 'Access token is still valid.' });
  }

  let refreshTokenPayload = null;

  try {
    refreshTokenPayload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return res.status(401).send({ message: 'Refresh token verification failed.' });
  }

  if (refreshTokenPayload.accessToken !== accessToken) {
    return res
      .status(401)
      .send({ message: 'This refresh token is not connected to provided access token.' });
  }

  const refreshTokenInDatabase = refreshTokens.find(
    (e) =>
      e.accessToken === accessToken &&
      e.refreshToken === refreshToken &&
      e.userId === accessTokenPayload.user.id
  );

  if (!refreshTokenInDatabase) {
    return res.status(404).send({ message: 'Refresh token not found in database.' });
  }

  // Here you might also want to do some verification on refresh token in database
  // For example - the refresh token is blacklisted,...

  // Remove old refresh token since we will generate a new one
  refreshTokens = refreshTokens.filter(
    (e) =>
      e.accessToken !== accessToken &&
      e.refreshToken !== refreshToken &&
      e.userId !== accessTokenPayload.user.id
  );

  const user = users.find((e) => e.id === accessTokenPayload.user.id);

  if (!user) {
    return res.status(404).send({ message: 'User not found.' });
  }

  return res.status(200).send(
    generateTokens({
      id: user.id,
      email: user.email,
    })
  );
});

app.get('/express-api/protected-route', requireAuth, (req, res) => {
  return res.status(200).send({ data: 'Some secret data only for authenticated users.' });
});

app.listen(8000, () => {
  console.log('Express API listening on port 8000.');
});

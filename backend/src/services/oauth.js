const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { users, merchants, customers } = require('../db/schema');
const jwt = require('jsonwebtoken');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists by email
    const userResult = await db.select().from(users).where(eq(users.email, profile.emails[0].value)).limit(1);
    let user = userResult[0];

    if (user) {
      // User exists, return them
      return done(null, user);
    }

    // Create new user
    const newUserResult = await db.insert(users).values({
      email: profile.emails[0].value,
      name: profile.displayName,
      password: '', // OAuth users don't have passwords
      role: 'MERCHANT', // Default role, can be changed
      twoFactorEnabled: false,
    }).returning();
    
    user = newUserResult[0];

    // Create merchant profile for new user
    await db.insert(merchants).values({
      userId: user.id,
      businessName: profile.displayName || 'Business',
      phoneNumber: '',
      businessType: 'INDIVIDUAL',
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Configure Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails', 'photos'],
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists by email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    if (!email) {
      return done(new Error('Facebook profile does not have an email'), null);
    }

    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user = userResult[0];

    if (user) {
      // User exists, return them
      return done(null, user);
    }

    // Create new user
    const newUserResult = await db.insert(users).values({
      email: email,
      name: profile.displayName,
      password: '', // OAuth users don't have passwords
      role: 'MERCHANT', // Default role, can be changed
      twoFactorEnabled: false,
    }).returning();
    
    user = newUserResult[0];

    // Create merchant profile for new user
    await db.insert(merchants).values({
      userId: user.id,
      businessName: profile.displayName || 'Business',
      phoneNumber: '',
      businessType: 'INDIVIDUAL',
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = userResult[0];
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT token for OAuth users
const generateOAuthToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

module.exports = {
  passport,
  generateOAuthToken,
};

/**
 * Sandbox middleware to handle sandbox mode operations
 * In sandbox mode, payments are simulated and no real transactions occur
 */

const isSandboxMode = () => {
  return process.env.SANDBOX_MODE === 'true';
};

const sandboxMiddleware = (req, res, next) => {
  // Add sandbox mode flag to request
  req.isSandbox = isSandboxMode();
  next();
};

const requireSandbox = (req, res, next) => {
  if (!isSandboxMode()) {
    return res.status(403).json({ 
      error: 'This endpoint is only available in sandbox mode' 
    });
  }
  next();
};

const requireProduction = (req, res, next) => {
  if (isSandboxMode()) {
    return res.status(403).json({ 
      error: 'This endpoint is not available in sandbox mode' 
    });
  }
  next();
};

module.exports = {
  isSandboxMode,
  sandboxMiddleware,
  requireSandbox,
  requireProduction
};

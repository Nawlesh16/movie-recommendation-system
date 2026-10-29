// Every successful response from this API has the SAME shape:
//
//   { "success": true, "message": "...", "data": { ... } }
//
// Failed responses (built in error.middleware.js) look like:
//
//   { "success": false, "message": "...", "errors": [ ... ] }
//
// A consistent shape makes the frontend much simpler to write later.
export function sendSuccess(res, { statusCode = 200, message = "Success", data = null } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

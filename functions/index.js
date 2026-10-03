const { importFaculty } = require('./src/faculty/importFaculty');
const { exportFaculty } = require('./src/faculty/exportFaculty');
const { deviceEventWebhook } = require('./src/monitoring/deviceEventWebhook');
const { faceMatch } = require('./src/monitoring/faceMatch');

exports.importFaculty = importFaculty;
exports.exportFaculty = exportFaculty;
exports.deviceEventWebhook = deviceEventWebhook;
exports.faceMatch = faceMatch;

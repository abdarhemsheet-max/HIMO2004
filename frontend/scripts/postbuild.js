const fs = require('fs');
const path = require('path');
const nojekyll = path.join(__dirname, '..', '..', 'docs', '.nojekyll');
fs.writeFileSync(nojekyll, '');

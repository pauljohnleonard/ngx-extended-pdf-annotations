const fs = require('fs');

const path='./projects/ngx-extended-pdf-annotations/package.json'
const packageJsonFile = fs.readFileSync(path);
const packageJson = JSON.parse(packageJsonFile);
const version = packageJson['version'];
const lastDot = version.lastIndexOf('.');
const lastDigit = version.substring(lastDot+1);
const newVersion = version.substring(0, lastDot+1) +  (Number(lastDigit) + 1);
const newPackageJsonFile = packageJsonFile.toString().replace(version, newVersion);
fs.writeFileSync(path, newPackageJsonFile);
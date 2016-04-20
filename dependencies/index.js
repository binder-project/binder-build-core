module.exports = {
  'Dockerfile': require('./dockerfile')(),
  'environment.yml': require('./environment-yml')(),
  'requirements.txt': require('./requirements-txt')()
}

module.exports = {
  '.binder.yml': require('./binder-yml')(),
  'Dockerfile': require('./dockerfile')(),
  'environment.yml': require('./environment-yml')(),
  'requirements.txt': require('./requirements-txt')()
}

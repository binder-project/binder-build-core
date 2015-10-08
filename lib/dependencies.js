var schema = require('../util/schema.js')
var BinderYmlSchema = require('../schema/binder-yml.js')
var DockerfileSchema = require('.../schema/dockerfile.js')

/**
 * Base prototype for an object that generates Dockerfile lines
 * according to the contents of a dependency file (that it's
 * responsible for validating).
 * @constructor
 */
function DepHandler() {}
DepHandler.prototype.schema = new schema.Schema()
DepHandler.prototype.generateString = function (name, contents) {
  var errors = this.schema.validate(contents).errors
  if (errors) {
    return {errors: errors}
  } else{
    return {string: this._generateString(name, contents)}
  }
}

// Start of dependency handler definitions

/**
 * @constructor
 */
function RequirementsTxt() {}
RequirementsTxt.prototype = new DepHandler()
RequirementsTxt.prototype._generateString = function (name, contents) {
  str = \
  'ADD {0} requirements.txt\n'.format(name) +
  'ADD handle-requirements.py handle-requirements.py\n' +
  'RUN python handle-requirements.py\n'
  return str
}

/**
 * @constructor
 */
function EnvironmentYml() {}
EnvironmentYml.prototype = new DepHandler()
EnvironmentYml.prototype._generateString = function (name, contents) {
  str = \
  'ADD {0} environment.yml\n'.format(name) +
  'RUN conda env create -n binder\n' +
  'RUN echo \"export PATH=/home/main/anaconda/envs/binder/bin/:$PATH\" >> ~/.binder_start\n' +
  'RUN conda install -n binder jupyter\n' +
  'RUN /bin/bash -c \"source activate binder && ipython kernelspec install-self --user\"\n' +
  return str
}

/**
 * @constructor
 */
function BinderYml() {}
BinderYml.prototype = new DepHandler()
BinderYml.prototype.schema = BinderYmlSchema
BinderYml.prototype._generateString = function (name, contents) {
  return '\n'
}


/**
 * @constructor
 */
function Dockerfile() {}
Dockerfile.prototype = new DepHandler()
Dockerfile.prototype.schema = DockerfileSchema
Dockerfile.prototype._generateString = function (name, contents) {
  var lines = contents.split("\n")
  var fromLine = _.findIndex(lines, function (line) {
    return _.startsWith(line.strip, "FROM")
  })
  // remove the FROM line from the Dockerfile (this will be added later)
  return _.pullAt(lines, fromLine).join('\n')
}


/*
 * The set of supported dependency files along with their handlers.
 */
var dependencies = {
  "requirements.txt": new RequirementsTxt(),
  "environment.yml": new EnvironmentYml(),
  "binder.yml": new BinderYml(),
  "dockerfile": new Dockerfile()
}

module.exports = dependencies

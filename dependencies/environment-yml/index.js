var DepHandler = require('../../lib/dep-handler.js')
var format = require('string-format')
format.extend(String.prototype)

/**
 * @constructor
 */
function EnvironmentYml() {
  if (!(this instanceof EnvironmentYml)) return new EnvironmentYml()
}
EnvironmentYml.prototype = new DepHandler()
EnvironmentYml.prototype.precedence = 2
EnvironmentYml.prototype._generateString = function (name, contents) {
  str = '' +
  'ADD {0} environment.yml\n'.format(name) +
  'RUN conda env create -n binder\n' +
  'RUN echo \"export PATH=/home/main/anaconda2/envs/binder/bin/:/home/main/anaconda3/envs/binder/bin/:$PATH\" >> ~/.binder_start\n' +
  'RUN conda install -n binder jupyter\n' +
  'RUN /bin/bash -c \"source activate binder && python -m ipykernel install --user\"\n'
  return str
}

module.exports = EnvironmentYml


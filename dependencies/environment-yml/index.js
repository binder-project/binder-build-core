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
  'RUN echo \"export LIBRARY_PATH=/home/main/anaconda2/envs/binder/lib:/home/main/anaconda3/envs/binder/lib:$LIBRARY_PATH\" >> ~/.binder_start\n' +
  'RUN echo \"export C_INCLUDE_PATH=/home/main/anaconda2/envs/binder/include:/home/main/anaconda3/envs/binder/include:$C_INCLUDE_PATH\" >> ~/.binder_start\n' +
  'RUN echo \"export CPLUS_INCLUDE_PATH=/home/main/anaconda2/envs/binder/include:/home/main/anaconda3/envs/binder/include:$CPLUS_INCLUDE_PATH\" >> ~/.binder_start\n' +
  'RUN conda install -n binder jupyter\n' +
  'RUN /bin/bash -c \"source activate binder && jupyter kernelspec install-self --user\"\n'
  return str
}

module.exports = EnvironmentYml


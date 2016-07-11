# binder-build-core
Core logic for converting a directory containing dependencies into a Binder-compatible Docker image

In Binder, the [`binder-build`](https://github.com/binder-project/binder-build) module is
responsible for fetching repository contents and handing them off to `binder-build-core`, which will
then use one of a set of supported configuration configuration files in the directory to construct a [Docker](https://www.docker.com/) image (an executable environment). 

`binder-build-core` will search for the following files, in descending order of priority (only one will be used during the build process):
 1. `Dockerfile`
 1. `requirements.txt`
 2. `environment.yml`

The first one it finds will be passed into a *dependency handler* for conversion into Dockerfile
commands. The list of available dependency handlers and configuration file types can be
found in the [dependencies](dependencies/) directory

### install
`npm install binder-build-core`

### usage
```
var Builder = require('binder-build-core')
var buildOpts = { imageName: 'test', logger: logger }
var builder = new Builder(buildOpts)
builder.build(dirName, function (err, imageSource) {
  ...
})
```


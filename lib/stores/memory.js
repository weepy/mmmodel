var utils = require("../utils")

exports.mixin = function(model) {

  model.DB = {}
  model._id = 0

  var fn = model.prototype
  
  fn._get_id = function(cb) {
    this.id = ++model._id
    cb()
  }
  
  fn._persist = function(cb) {
    model.DB[this.id] = this
    cb(true)
  }
  
  fn._saveStack = [
    fn.validate,
    fn._get_id,
    fn._persist,
    fn._saved
  ]
  
  
  model.find = function(id, cb) {
    cb(model.DB[id])
  }

  model.destroy = function(id, cb) {
    if(model.DB[id]) {
      delete model.DB[id]
      cb(true)
    }
    else cb(false)
  }
  
  model.count = function(cb) {
    var i=0;
    for(var id in model.DB) i++
    cb(i)
  }

  model.exists = function(id, cb) {
    cb(!!model.DB[id])
  }

  model.instantiate_from_ids = function(ids, cb) {
    var ret=[];
    for(var id in ids) ret.push(model.DB[id])
    cb(ret)
  }

  model.all = function(cb) {
    var models = []
    for(var id in model.DB) models.push(model.DB[id])
    cb(models)
  }
  
}
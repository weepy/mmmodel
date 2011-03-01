var utils = require("../utils")

exports.mixin = function(model) {

  model.DB = {}
  model._id = 0

  var fn = model.prototype
  
  fn._getId = function(cb) {
    this.id = ++model._id
    cb()
  }
  
  fn._persist = function(cb) {
    model.DB[self.id] = this
    cb(true)
  }
  
  fn._saveStack = [
    fn.validate,
    fn._getId,
    fn._persist,
    fn._saved
  ]
  
  
  model.find = function(id, cb) {
    cb(model.DB[id])
  }

  model.count = function(cb) {
    var i=0;
    for(var id in model.DB) i++
    cb(i)
  }

  model.exists = function(id, cb) {
    cb(!!model.DB[id])
  }

  model.loadFromIds = function(ids, cb) {
    var ret=[];
    for(var id in ids) ret.push(model.DB[id])
    cb(ret)
  }

  model.all = function(cb) {
    cb(model.DB)
  }
  

  
}
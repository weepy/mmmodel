var utils = require("../utils")

exports.mixin = function(Model) {

  Model.DB = {}
  Model._id = 0

  var fn = Model.prototype
  
  fn._get_id = function(cb) {
    if(this.id == null && Model.properties.id.auto_inc) this.id = ++Model._id
    cb()
  }
  
  fn._persist = function(cb) {
    Model.DB[this.id] = this
    cb(true)
  }
  
  fn._saveStack = [
    fn.validate,
    fn._get_id,
    fn._persist,
    fn._finalize_save
  ]
  
  
  Model.find = function(id, cb) {
    cb(Model.DB[id])
  }

  Model.destroy = function(id, cb) {
    if(Model.DB[id]) {
      delete Model.DB[id]
      cb && cb(true)
    }
    else cb && cb(false)
  }
  
  Model.count = function(cb) {
    var i=0;
    for(var id in Model.DB) i++
    cb(i)
  }

  Model.exists = function(id, cb) {
    cb(!!Model.DB[id])
  }

  Model.load_ids = function(ids, cb) {
    var ret=[];
    for(var id in ids) ret.push(Model.DB[id])
    cb(ret)
  }

  Model.all = function(cb) {
    var models = []
    for(var id in Model.DB) models.push(Model.DB[id])
    cb(models)
  }
  
}
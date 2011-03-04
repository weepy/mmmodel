var utils = require("../utils")

exports.mixin = function(model) {
  var fn = model.prototype

  fn._persist = function(cb) {
    var self = this
    model.ajax.post(model.url + "/save", {json: JSON.stringify(this.toJSON())}, function(text) {
      var o = JSON.parse(text)
      self.merge(o)
      cb()
    })
  }
  
  fn._saveStack = [
    fn.validate,
    fn._persist,
    fn._finalize_save
  ]
  
    
  model.find = function(id, cb) {
    model.ajax.get(model.url + "/" + id, {}, function(text) {
      var o = JSON.parse(text)
      cb(o ? model.load(o) : null)
    })
  }
  
  model.query = function(opts, cb) {
    var self = this
    model.ajax.get(model.url, opts, function(text) {
      var o = JSON.parse(text)
      var models = model.load_multi(o)
      cb(models)
    })
  }
 
  model.destroy = function(id, cb) {
    var self = this
    model.ajax.post(model.url + "/" + id + "/destroy", {}, function(text) {
      cb(JSON.parse(text))
    })
  }
}
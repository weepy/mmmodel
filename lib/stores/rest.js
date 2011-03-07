var utils = require("../utils")

exports.mixin = function(Model) {
  var fn = Model.prototype

  fn._persist = function(cb) {
    var self = this
    Model.ajax.post(Model.url + "/save", {json: JSON.stringify(this.toJSON())}, function(o) {
      self.merge(o)
      cb(o)
    })
  }
  
  fn._saveStack = [
    fn.validate,
    fn._persist,
    fn._finalize_save
  ]
  
  Model.url = "/url/not/set/"
  
  Model.find = function(id, cb) {
    Model.ajax.get(Model.url + "/" + id, {}, function(o) {
      cb(o ? Model.load(o) : null)
    })
  }
  
  Model.query = function(opts, cb) {
    var self = this
    Model.ajax.get(Model.url, opts, function(o) {
      var models = Model.load_multi(o)
      cb(models)
    })
  }
 
  Model.destroy = function(id, cb) {
    var self = this
    Model.ajax.post(Model.url + "/" + id + "/destroy", {}, function(o) {
      cb(o)
    })
  }
}

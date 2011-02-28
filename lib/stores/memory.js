var chain = require("../utils").chain

exports.mixin = function(model) {

  model.DB = {}
  model._id = 0

  model.prototype.save = function(cb) {
    var fns = [
      this.validate,
      this.persist
    ]
    chain(fns, function(err) {
      cb(err)
    })
  }
  
  model.prototype.persist = function(cb) {
    model.DB[self.id] = this
    this.trigger("saved").complete(function() {
      cb(true)
    })
  }
  
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
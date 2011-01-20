var chain = require("../chain")

exports.mixin = function(model) {

  model.DB = {}

  model.prototype.links = function(type, cb) {
  // not impl
  }

  model.prototype.linkCount = function(type, cb) {
  // not impl
  }

  model.prototype.link = function(id, type, cb) {
  // not impl
  }

  model.prototype.save = function(cb) {
    var self = this

    model.q.add(function() {
      self._save()
    }, function(result) {
      if(cb) cb(result)
    })
  }

  model.prototype._save = function() {
    var self = this  
    chain.call(this, model.callbacks.beforeSave || [], function() {
      self.valid(function(valid) {
        if(!valid)
          return model.q.complete(null)
        model.DB[self.id] = this
        self.saved = true
        model.q.complete(true)
      })
    })
  }
  
  
  model._id = 0
  
  model.prototype._save = function() {
    var self = this,
        client = model.client
        klass = model.klass
    
    function doValidate(next) {
      self.valid(function(valid) {
        if(!valid) {
          model.q.complete(null);
          return false;
        }
        next()
      })
    }
    
    function getID(next) { 
      if(self.id == null && model.properties.id.auto_inc) self.id = (++model._id)
      next()
    }
     
    function saveTo(next) {
      model.DB[self.id] = this
      self.saved = true
      next()
    }
    
    function updateKeys(next) {
      next()
    }

    var fns = model.callbacks.beforeSave.concat([doValidate, getID, saveTo, updateKeys]).concat(model.callbacks.afterSave)  
    chain.call(self, fns, function(result) {
      model.q.complete(true);
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
  //
}
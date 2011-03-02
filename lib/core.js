var utils = require("./utils"),
    nextTick = (typeof process != "undefined") ? setTimeout : process.nextTick

module.exports = mmodel = {}

mmodel.create = function(type, properties, store) {
  
  var model = function(attr) {
    attr = attr || {}    
    this._orig = {}
    
    for(var k in properties) {
      var prop = properties[k]
      if(k in attr) this._orig[k] = attr[k]
      else if('default' in prop) this._orig[k] = prop['default'] 
    }
    
    utils.merge(this, this._orig)
    this._callbacks = {}
    this.errors = []
    this.trigger("initialize")
  }
  

  model._callbacks = {}
  model.type = type
  model.properties = properties

  // var Q = model.Q = new utils.queue() // this queue is needed to keep things orderly... (esp for async)
  
  var fn = model.prototype
  
  model.create = function(o, cb) {
    var m = new model(o)

    m.save(function(ok) {
      if(cb) cb(m)
    })
  }

  fn.dirty = function(prop) {
    var o = {}, dirty
    
    if(prop) {
      dirty = this._orig[prop] != this[prop]
      return dirty ? [this._orig[prop], this[prop]] : false
    }

    for(var i in properties) {
      if(this._orig[i] != this[i]) {
        dirty = true
        o[i] = [this._orig[i], this[i]]
      }
    }
    return dirty ? o : false
  }
  
  
  fn.update = function(params, cb) {
    params = params || {}
    model.find(params.id, function(m) {
      if(!m) {
        if(cb) cb()
      } else {
        m.merge(params)
        m.save(function(ok) {
          if(cb) cb.call(m, ok)
        })
      }
    })
  }
   
  fn.save = function(cb) {
    var self = this
    utils.achain.call(self, self._saveStack, [], function(err, results) {
      cb.call(self, !err)
    })
  }
  
  fn.error = function(error) {
    this.errors.push(error)
  }
  
  fn.toJSON = function() {
    var o = {}
    for(var name in properties) 
      if(name in this) o[name] = this[name]
    o.type = type
    if(this.errors.length > 0) o.errors = this.errors
    return o   
  }
  
  fn.merge = function(o, x) {
    for(var name in properties)
      if(name in o) (x || this)[name] = o[name]
    return this
  }
  
  fn.validate = function(cb) {
    this.errors = []
    
    this.trigger("saving").complete(function() {
      this._state = "saving"
      cb.call(this, this.errors.length == 0) 
    })
  }
  
  fn._saved = function(cb) {
    this.merge(this, this._orig)
    this.trigger("saved").complete(cb)
  }
  
  model.setStore = function(store) {
    model.store = store
    if(typeof store == "string")  store = require("./stores/" + store)
    store.mixin(model)
  }

  if(store) model.setStore(store)  
   
  model.loadCollection = function(a) {
    var ret = []
    for(var i=0;i<a.length;i++) ret[i] = new model(a[i])
    return ret
  }
  
  /* events */

  model.bind = fn.bind = function(ev, callback, async) {
    if(async) callback.async = true
    var list  = this._callbacks[ev] || (this._callbacks[ev] = [])
    list.push(callback)
  }

  model.unbind = fn.unbind = function(ev, callback) {
    if (!ev) {
      this._callbacks = {}
      return this
    }
    if (!callback) {
      this._callbacks[ev] = []
      return this
    } 
    var list = this._callbacks[ev] || []

    for (var i = 0; i < list.length; i++) {
      if (callback === list[i]) {
        list.splice(i, 1)
        break
      }
    }
  }

  fn.trigger = function(ev) {
    var global = model._callbacks[ev] || []
        local = this._callbacks[ev] || [],
        list = global.concat(local)
        args = Array.prototype.slice.call(arguments, 1),
        self = this

    var pr = new (utils.promise)(self)

    utils.chain.call(self, list, args, function(err, results) {
      nextTick(function() {
        pr.invoke(err, results)
      }, 0)
    })
    return pr
  }

  return model
}
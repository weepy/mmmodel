var utils = require("./utils")

// chain = require("./utils").chain,
//     async = require("./utils").async,
//     promise = require("./utils").promise


var nextTick = (typeof process != "undefined") ? setTimeout : process.nextTick

module.exports = mmodel = {}

mmodel.create = function(type, properties, store) {
  
  var model = function(attr) {
    attr = attr || {}
    for(var k in properties) {
      var prop = properties[k]
      if(k in attr) this[k] = attr[k] 
      else if(prop['default'])  this[k] = prop['default'] 
    }
    this._callbacks = {}
    this.errors = []
    this.trigger("initialize")
  }
  
  model._callbacks = {}
  model.type = type
  model.properties = properties
  
  var fn = model.prototype
  
  model.create = function(o, cb) {
    var m = new model(o)

    m.save(function(ok) {
      if(cb) cb(m)
    })
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
   
  /* to implement 
  model.find = function() { ... }
  model.save = function() { ... }
  fn._persist = function() { ... }
  model.find = function() { ... }
  model.count = function() { ... }
  model.exists = function() { ... }
  model.loadFromIds = function() { ... }
  model.all = function() { ... }  
  */ 
  
  fn.save = function(cb) {
    utils.achain.call(this, this._saveStack, [], function(err, results) {
      cb.call(this, !err)
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
  
  fn.merge = function(o) {
    for(var name in properties)
      if(name in o) this[name] = o[name]
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
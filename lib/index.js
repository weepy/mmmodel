var utils = require("./utils"),
    nextTick = (typeof process != "undefined") ? setTimeout : process.nextTick

module.exports = mmodel = {}

mmodel.create = function(type, properties, store) {
  var model = function(attr, clean) {
    attr = attr || {}    
    this._prop = {}
    
    for(var k in properties) {
      var prop = properties[k]
      if(k in attr) this[k] = attr[k]
      else if('default' in prop) this[k] = prop['default'] 
    }
    
    this._callbacks = {}
    if(attr.errors) this.errors = attr.errors
    this.trigger("initialize")
    if(clean) this.clean()
  }
  
  model.load = function(attr) {
    return new model(attr, true)
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
  
  model.prototype.clean = function() {
    this._prop = {}
    for(var k in properties) this._prop[k] = this[k]
    return this
  }


  fn.dirty = function(prop) {
    var o = {}, dirty
    
    if(prop) {
      dirty = this._prop[prop] != this[prop]
      return dirty ? [this._prop[prop], this[prop]] : false
    }

    for(var i in properties) {
      if(this._prop[i] != this[i]) {
        dirty = true
        o[i] = [this._prop[i], this[i]]
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
      if(!err) self.clean()
      cb.call(self, self)
    })
  }
  
  fn.error = function(error) {
    this.errors.push(error)
  }
  
  fn.destroy = function(cb) {
    var self = this
    model.destroy(this.id, function(ok) {
      if(ok) self.trigger("destroyed")
      cb(ok)
    })
  }
  

  
  fn.toJSON = function() {
    var o = {}
    for(var name in properties) 
      if(name in this) o[name] = this[name]
    o.type = type
    if(this.inError()) o.errors = this.errors
    return o   
  }
  
  fn.inError = function() {
    return this.errors && this.errors.length != 0
  }
  
  fn.merge = function(o, x) {
    for(var name in properties)
      if(name in o) (x || this)[name] = o[name]
    return this
  }
  
  fn.validate = function(cb) {
    this.errors = []
    this._stdValidate()
    this.trigger("saving").complete(function() {
      cb.call(this, !this.inError()) 
    })
  }
  
  fn._stdValidate = function() {
    for(var i in properties) {
      var p = properties[i]
      if(p.required && this[i] == null)
        this.errors.push(i + " is required")
      if(p.format && this[i] && !this[i].match(p.format))
        this.errors.push(i + " is bad format")
    }
  }
  
  fn._saved = function(cb) {
    //this.merge(this, this._prop)
    if(!this.inError()) {
      this.clean()
      this.trigger("saved").complete(cb)
    } else {
      cb(false)
    }
  }
  
  model.setStore = function(store) {
    model.store = store
    if(typeof store == "string")  store = require("./stores/" + store)
    store.mixin(model)
  }

  if(store) model.setStore(store)  
   
  model.loadArray = function(a) {
    var ret = []
    for(var i=0;i<a.length;i++) ret[i] = model.load(a[i])
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
var chain = require("./chain")

module.exports = mmodel = {}

mmodel.create = function(klass, properties, store) {
  
  var model = function(props, saved) {
    if(!model.store) {
      console.log("model: " + model.klass + " has no store set")
      throw "model: " + model.klass + " has no store set"
    }
    
    props = props || {}
    for(var k in model.properties) {
        var p = model.properties[k]
        var x = props[k] == null ? p["default"] : props[k]
        if(x !== undefined) this[k] = x
    }
    this.initialize()
    this.saved = false || saved  
    this.errors = []
    return
  }
  
  model.klass = klass
  model.properties = properties

  model.prototype.initialize = function() {}

  model.validations = []
  model.addValidation = function(fn) {
    //var self = this
    if(fn.length == 0)
      model.validations.push(function(next) {
        //console.log(self)
        fn.call(this)
        next()
      })
    else
      model.validations.push(fn)
  }

  model.prototype.valid = function(cb) {

    this.errors = []
    for(var i in model.properties) {

      var p = model.properties[i]
      if(p.required && this[i] == null)
        this.errors.push(i + " is required")
      if(p.format && this[i] && !this[i].match(p.format))
        this.errors.push(i + " is bad format")
    }
    
    if(this.errors.length) return cb.call(self, false)
    
    var self = this
    chain.call(self, model.validations, function() {
      cb.call(self, self.errors.length == 0)
    })
  }
  
  model.create = function(o, cb) {
    var m = new model(o)
    m.save(function(ok) {
      if(cb) cb(m) //? cb(m) : 0
    })
  }

  model.prototype.update = function(params, cb) {
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
  
  model.callbacks = {beforeSave: [], afterSave: []}

  model.callback = function(cb_name, fn) {
    var a = model.callbacks[cb_name] || []
    a.push(fn)
    model.callbacks[cb_name] = a
  }
  
  model.prototype.toData = function(opts) {
    var opts = opts || {}
    var o = {}
    for(var name in model.properties) {
      if(name in this) o[name] = this[name]
    }
    if(opts.klass) o.klass = model.klass
    if(opts.errors && this.errors && this.errors.length) o.errors = this.errors
    if(opts.saved && this.saved) o.saved = true
    return o   
  }
  
  model.prototype.toJSON = function(opts) {
    return JSON.stringify(this.toData(opts))
  }  
  
  model.prototype.merge = function(o) {
    for(var name in model.properties) {
      if(name in o) this[name] = o[name]
    }
    return this
    // for(var i in o) this[i] = o[i]
    // return this
  }
  
  model.setStore = function(store) {
    model.store = store
    if(typeof store == "string")  store = require("./stores/" + store)
    store.mixin(model)
  }

  if(store) model.setStore(store)  
   
  model.bulkNew = function(a) {
    var ret = []
    for(var i=0; i<a.length;i++) 
      ret[i] = new model(a[i])
    return ret
  }
  
  return model
}
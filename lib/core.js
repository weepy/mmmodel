/*!
 * MMModel - Homer Simpon's favorite Javascript ORM
 * backed by Redis, REST and Memory Stores
 * Copyright (C) 2010-2011 Jonah Fox (weepy)
 * MIT Licensed
 */


/** @private
  * Requiring libs.
  */
var utils = require("./utils"),
    nextTick = (typeof process != "undefined") ? process.nextTick : setTimeout,
    noop = function(){}

/**
  * NB: private functions are indicated by an underscore prefix.
  * 
  * @param {String} name of the class
  * @param {Properties} list of property definitions
  * @param {String} name of store, e.g. "redis"
  */
module.exports = function(type, properties, store) {
  
  /** Constructor for model. Normally is unsynchronized (i.e. unsaved)
    *
    *  @param {Object} hash of properties
    *  @param {boolean} [private] True if the new object is synchonized (i.e. appear to be saved)
    */
  var Model = function(props, _sync) {
    props = props || {}   
    this._ = {properties: {}}               // store private state
    for(var k in properties) {
      var p = properties[k]
      if(k in props) this[k] = props[k]
      else if('default' in p) this[k] = p['default']  
    }

    this._.callbacks = {} // this._.callbacks contains event bindings relevant to this instance
    if(props.errors) this.errors = props.errors
    this.trigger("initialize")
    if(_sync) this._synchronize()
  }

  /** @private
   *  Set type and properties on the class
   */
  Model.type = type
  Model.properties = properties
  var fn = Model.prototype
  
  /* Create a sychronized object (typically it would be one that been retrieved from a database) 
   */
  Model.load = function(props) {
    return new Model(props, true)
  }

  /** Load a list of models expressed as JSON
    */
  Model.load_multi = function(a) {
    var ret = []
    for(var i=0;i<a.length;i++) ret[i] = Model.load(a[i])
    return ret
  }
  
  /* Create a new object that's then saved to the database 
   *
   * @param {Object} 
   */
  Model.create = function(props, cb) {
    var m = new Model(props)
    m.save(cb)
  }
  
  /** Find an object or create it if it doesn't exist
    */
  Model.find_or_create = function(props, cb) {
    Model.find(props.id, function(m) {
      if(m)
        cb && cb(m)
      else
        Model.create(props, cb) 
    })
  }
  
  /** Find an object or make a new unsaved one if it doesn't exist
    */
  Model.find_or_new = function(id, cb) {
    Model.find(id, function(m) {
      m = m || new Model({id: id})
      cb && cb(m)
    })
  }
  
  
  /** @private
    * Synchonize an object
    * This copies the local properties onto a _private_ _.properties object 
    */
  fn._synchronize = function() {
    this._.properties = {}
    for(var k in properties) this._.properties[k] = this[k]
  }

  /** Has this instance been modified (i.e not in sync wit the Store). Returns null if there's no difference
    * 
    * @param {string} _optional_ if null, we'll check the whole function, else it will check only this property
    */
  fn.modified = function(prop) {
    var o = {}, modified
    
    if(prop) {
      modified = this._.properties[prop] != this[prop]
      return modified ? [this._.properties[prop], this[prop]] : false
    }

    for(var i in properties) {
      if(this._.properties[i] !== this[i]) {
        modified = true
        o[i] = [this._.properties[i], this[i]]
      }
    }
    return modified ? o : false
  }
  
  /** Has this model been saved? I.e. is it _not_ modified 
    */
  fn.saved = function() {
    return !this.modified()
  }
  
  /** Update the model with the params and save it
    */
  fn.update = function(params, cb) {
    this.merge(params)
    this.save(function(ok) {
      cb && cb.call(this, ok)
    })
  }
   
  /** Save this instance to the store
    * 
    * @param {Function} optional callback. Returns the saved object
    */
  fn.save = function(cb) {
    var self = this
    
    self.errors = []

    utils.achain.call(self, self._saveStack, [], function(err, results) {
      if(!err) self._synchronize()
      cb && cb.call(self, self)
    })
  }
  
  fn._get_id = function(cb) {
    // ignore ...
    cb()
  }
    
  fn._trigger_creating = function(cb) {
    if(this._.properties.id == null) {
      this._.creating = true
      this.trigger("creating").complete(cb)
    } else {
      delete this._.creating
      cb()
    }
  
  }
  
  fn._trigger_saving = function(cb) {
    this.trigger("saving").complete(function() {
      cb.call(this, !this.in_error()) 
    })
  }
    
  /** Add an error  
    */
  fn.error = function(error) {
    this.errors || (this.errors = [])
    this.errors.push(error)
  }
  
  /** Destroy the object in the store
    *
    * @param {Function} optional callback - returns if it was successful or not
    * if successful triggers "destroyed" 
    */
  fn.destroy = function(cb) {
    var self = this
    Model.destroy(this.id, function(ok) {
      if(ok) self.trigger("destroyed")
      cb && cb(ok)
    })
  }
  
  /** Returns a object ready for JSON.stringify 
    * NB Does not return a string
    * NB Date types are converted to numbers 
    * @only {Array} if passed, only these properties will be serialized
    */ 
  fn.toJSON = function(opts) {
    var o = {}, opts = opts || {}
    
    for(var name in properties) {
      if(opts.only && opts.only.indexOf(name) < 0) continue
      if(opts.skip && opts.skip.indexOf(name) > 0) continue
    
      if(name in this) {
        o[name] = this[name]
        if(properties[name].type == "date") o[name] = o[name]/1
      }
    }     
    o.type = type
    if(this.in_error()) o.errors = this.errors
    return o   
  }
  
  /** Returns a JSON string representation
    
    */
  fn.toString = function() {
    return JSON.stringify(this.toJSON())
  }
  
  /** Does this model have errors ?
    */
  fn.in_error = function() {
    return this.errors && this.errors.length != 0
  }
  
  /** Merge a list of properties on this the model
    *
    * @param {Object} properties
    * @param {Object} optional alternative for "this"
    */
  fn.merge = function(props, x) {
    for(var name in properties)
      if(name in props) (x || this)[name] = props[name]
    return this
  }
  
  /** Validate the model for errors
    * performs some simple checks for 'required' and 'format' properties
    * calls a "saving" callback, which on completion checks that the number of errors is zero and runs the callback
    */
  fn.validate = function(cb) {
    this.errors = []
    this._run_default_validations()
    this.trigger("saving").complete(function() {
      cb && cb.call(this, !this.in_error()) 
    })
  }
  
  /** Simple Validation for 'required' and 'format' properties
    */
  fn._run_default_validations = function(cb) {
    for(var i in properties) {
      var p = properties[i]
      if(p.required && this[i] == null)
        this.error(i + " is required")
      if(p.format && this[i] && !this[i].match(p.format))
        this.error(i + " is bad format")
    }
    cb && cb()
  }
  
  /** @private
    * Trigger relevant callbacks and synchronize if succesful
    */
  fn._trigger_saved = function(cb) {
    if(this.in_error()) {
      this.trigger("error", "saving failed").complete(function(){
        cb && cb(false)
      })
    } else {
      this._synchronize()
      this.trigger("saved").complete(cb)
    }
  }
  
  fn._trigger_created = function(cb) {
    if(this._.creating) {
      delete this._.creating
      this._.created = true
      this.trigger("created").complete(cb)
    } else {
      delete this._.created
      cb.call(this)
    }
  }
  
  fn._post_persist = function (next) {
    next()
  }
  
  fn._check_errors = function(cb) {
    cb && cb.call(this, !this.in_error()) 
  }
  
  /** @private
    * Load the revelant store for this model
    */
  Model._set_store = function(store) {
    Model.store = store
    if(typeof store == "string")  store = require("./stores/" + store)
    store.mixin(Model)
  }

  if(store) Model._set_store(store)  
  
  
  fn._saveStack = [
    fn._trigger_creating,
    fn._trigger_saving,
    fn._run_default_validations,
    fn._check_errors,
    fn._get_id,
    fn._persist,
    fn._post_persist,
    fn._trigger_saved,
    fn._trigger_created
  ]
  
  /** Events  
    * ------


  /* @private
    * callback container 
    */
  
  Model._ = {callbacks:{}}
    
  /* Bind to all instances of Model or just this instance 
    @param {string} name of event, e.g. "saving"
    @param {Function} callback to run
    @param {boolean} is the callback async? 
  */
  Model.bind = fn.bind = function(ev, callback, async) {
    if(async) callback.async = true
    var list  = this._.callbacks[ev] || (this._.callbacks[ev] = [])
    list.push(callback)
  }
  
  /* Unbind to all instances of Model or just this instance */
  Model.unbind = fn.unbind = function(ev, callback) {
    if (!ev)
      this._.callbacks = {}
    else if (!callback)
      this._.callbacks[ev] = []
    else {
      var list = this._.callbacks[ev] || []

      for (var i = 0; i < list.length; i++) {
        if (callback === list[i]) {
          list.splice(i, 1)
          break
        }
      }
    }
    return this
  }

  /* Trigger an event. This will trigger all handers with the particular event
     It will also return a promise that allows a complete callback to be set. 
     @param {string} name of event
     @param [further arugments]
  */
  fn.trigger = function(ev) // further args 
  {
    var global = Model._.callbacks[ev] || []
        local = this._.callbacks[ev] || [],
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

  return Model
}

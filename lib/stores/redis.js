var utils = require("../utils"),
    EdgeQuery = require("../edge_query")

exports.mixin = function(model) {
  var fn = model.prototype
  
  model.key = function() {
    return model.type + "s"
  }
  
  fn.key = function() {
    return model.type + ":" + this.id
  }
  
  model.destroy = function(id, cb) {
    model.client.del(model.type + ":" + id, function(err, data) {
      model.client.ZREM(model.type +"s", id, function(err, data) {
        cb()
      })
    })
  }
  
  fn._persist = function(next) {
    var self = this, o = self.stringy_object()

    model.client.HMSET(this.key(), o, function(err, data) {
      if(err) return next(false)
      if(data != "OK") throw "no error and data != 1"
      next()
    })
  }
  
  fn._get_id = function(next) {

    var self = this
    if(this.id == null && model.properties.id.auto_inc) {
      model.client.INCR(model.key() + ":id", function(err, data) {
        self.id = data
        next()
      })
    }
    else next()
  }

  fn._update_keys = function (next) {
    var self = this
    model.client.ZADD(model.key(), self.rank(), self.id, function(err, data) {
      if(err) console.log("failed ZADD", err)
      next()
    })
  }  

  fn._saveStack = [
    fn.validate,
    fn._get_id,
    fn._persist,
    fn._update_keys,
    fn._finalize_save
  ]
  
  fn.stringy_object = function() {
    var o = {}
    for(var name in model.properties)
      o[name] = model.stringify_property(name, this[name]) 
    return o
  }
  
  model.stringify_property = function(name, data) {
    var type = model.properties[name].type
    if(data == null)      return ""
    if(type == "string")  return data
    if(type == "number")  return data.toString()
    if(type == "json")    return JSON.stringify(data)
    if(type == "date")    return (data/1).toString()
  }

  model.unstringify_property = function(name, data) {
    var type = model.properties[name].type
    if(data === "")       return null
    if(type == "string")  return data
    if(type == "number")  return parseFloat(data)
    if(type == "json")    return JSON.parse(data)
    if(type == "date")    return new Date(data/1)
  }

  model.new_from_strings = function(o) {
    var ret = {}
    for(var name in model.properties) {      
      if(!(name in o)) continue 
      ret[name] = this.unstringify_property(name, o[name])
    }
    return ret
  }
    
  fn.rank = function() {
    return this.id
  }
  
  model.count = function(cb) {
    model.client.ZCARD(model.key(), function(err, data) {
      cb(data)
    })
  }
  
  
  model.find = function(id, cb) {
    model.client.HGETALL(model.type + ":" +id, function(err, data) {
      if(err || !data || data.id == null) return cb(null, err)
      var o = model.new_from_strings(data)
      cb(model.load(o))
    })
  }
  
  model.all = function(a, b) {
    var query, cb
    
    if(arguments.length == 1)  cb = a
    else if(arguments.length == 2)  cb = b, query = a
    else throw "bad args for Mmodel.all"
    
    var func = function(err, data) {

      if(err) return cb(false)
      if(!data) return cb(0)
      for(var i=0; i<data.length; i++)
        data[i] = model.properties.id.type == "string" ? data[i].toString() : parseInt(data[i])

      model.load_ids(data, function() {
        cb.apply(this, arguments)
        // Q.complete()
      })
    }

    var args = query ? query.split(" ") : []
    args.unshift(model.key())
    args.push(func)
    
    // Q.add(function() {
      model.client.sort.apply(model.client, args)
    // })
  }
  
  model.load_ids = function(ids, cb) {

    var ex = model.client.multi();
    for(var i=0; i< ids.length;i++)  {
      var key = model.type + ":" +ids[i]
      ex = ex.hgetall(key)
    }

    ex.exec(function (err, replies) {
      var models = []
      replies.forEach(function (data, index) {
        models[index] = model.load(model.new_from_strings(data))
      });
      cb(models)
    }); 
  }
  
  model.exists = function(id, cb) {
    model.client.exists(model.type + ":" + id, function(err, data) {
      cb(err || data == 1)
    })
  }

  
  model.find_edges = model.prototype.find_edges = function(type) {
     return new EdgeQuery(this.key() +":"+type, this)
  }
  
  model.add_edge = model.prototype.add_edge = function(id, type, score, cb) {
    if(arguments.length == 3 && typeof score == "function") {
        cb = score; score = id
    }
    model.client.ZADD(this.key() +":"+type, score, id, function(err, data) {
      cb ? cb(!err) : null
    })
  }

  model.remove_edge = model.prototype.remove_edge = function(id, type, cb) {
    model.client.ZREM(this.key() +":"+type, id, function(err, data) {
      cb ? cb(!err) : null
    })
  }  
}


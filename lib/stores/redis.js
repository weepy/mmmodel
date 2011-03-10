var utils = require("../utils"),
    EdgeQuery = require("../edge_query")

exports.mixin = function(Model) {
  var fn = Model.prototype
  
  Model.key = function() {
    return Model.type + "s"
  }
  
  fn.key = function() {
    return Model.type + ":" + this.id
  }
  
  Model.destroy = function(id, cb) {
    Model.client.del(Model.type + ":" + id, function(err, data) {
      Model.client.ZREM(Model.type +"s", id, function(err, data) {
        cb && cb()
      })
    })
  }
  
  fn._persist = function(next) {
    var self = this, o = self.stringy_object()

    Model.client.HMSET(this.key(), o, function(err, data) {
      if(err) return next(false)
      if(data != "OK") throw "no error and data != 1"
      next()
    })
  }
  
  fn._get_id = function(next) {

    var self = this
    if(this.id == null && Model.properties.id.auto_inc) {
      Model.client.INCR(Model.key() + ":id", function(err, data) {
        self.id = data
        next()
      })
    }
    else next()
  }

  fn._update_keys = function (next) {
    var self = this
    Model.client.ZADD(Model.key(), self.rank(), self.id, function(err, data) {
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
    for(var name in Model.properties)
      o[name] = Model.stringify_property(name, this[name]) 
    return o
  }
  
  Model.stringify_property = function(name, data) {
    var type = Model.properties[name].type
    if(data == null)      return ""
    if(type == "string")  return data
    if(type == "number")  return data.toString()
    if(type == "json")    return JSON.stringify(data)
    if(type == "date")    return (data/1).toString()
  }

  Model.unstringify_property = function(name, data) {
    var type = Model.properties[name].type
    if(data === "")       return null
    if(type == "string")  return data
    if(type == "number")  return parseFloat(data)
    if(type == "json")    return JSON.parse(data)
    if(type == "date")    return new Date(data/1)
  }

  Model.new_from_strings = function(o) {
    var ret = {}
    for(var name in Model.properties) {      
      if(!(name in o)) continue 
      ret[name] = this.unstringify_property(name, o[name])
    }
    return ret
  }
    
  fn.rank = function() {
    return this.id
  }
  
  Model.count = function(cb) {
    Model.client.ZCARD(Model.key(), function(err, data) {
      cb(data)
    })
  }
  
  
  Model.find = function(id, cb) {
    Model.client.HGETALL(Model.type + ":" +id, function(err, data) {
      if(err || !data || data.id == null) return cb(null, err)
      var o = Model.new_from_strings(data)
      cb(Model.load(o))
    })
  }
  
  Model.all = function(a, b) {
    var query, cb
    
    if(arguments.length == 1)  cb = a
    else if(arguments.length == 2)  cb = b, query = a
    else throw "bad args for MMModel.all"
    
    var func = function(err, data) {

      if(err) return cb(false)
      if(!data) return cb(0)
      for(var i=0; i<data.length; i++)
        data[i] = Model.properties.id.type == "string" ? data[i].toString() : parseInt(data[i])

      Model.load_ids(data, function() {
        cb.apply(this, arguments)
        // Q.complete()
      })
    }

    var args = query ? query.split(" ") : []
    args.unshift(Model.key())
    args.push(func)
    
    // Q.add(function() {
      Model.client.sort.apply(Model.client, args)
    // })
  }
  
  Model.load_ids = function(ids, cb) {

    var ex = Model.client.multi();
    for(var i=0; i< ids.length;i++)  {
      var key = Model.type + ":" +ids[i]
      ex = ex.hgetall(key)
    }

    ex.exec(function (err, replies) {
      var models = []
      replies.forEach(function (data, index) {
        models[index] = Model.load(Model.new_from_strings(data))
      });
      cb(models)
    }); 
  }
  
  Model.exists = function(id, cb) {
    Model.client.exists(Model.type + ":" + id, function(err, data) {
      cb(err || data == 1)
    })
  }

  
  Model.find_edges = Model.prototype.find_edges = function(type) {
     return new EdgeQuery(this.key() +":"+type, this)
  }
  
  Model.add_edge = Model.prototype.add_edge = function(type, id, score, cb) {
    if(arguments.length == 3 && typeof score == "function") {
        cb = score; score = id
    }
    var fscore = parseFloat(score) || score/1
    if(isNaN(fscore)) {
      throw "ERROR: score: " + score + " is NaN"
    }
    
    Model.client.ZADD(this.key() +":"+type, fscore, id, function(err, data) {
      cb && cb(!err)
    })
  }

  Model.remove_edge = Model.prototype.remove_edge = function(type, id, cb) {
    Model.client.ZREM(this.key() +":"+type, id, function(err, data) {
      cb && cb(!err)
    })
  }  
}


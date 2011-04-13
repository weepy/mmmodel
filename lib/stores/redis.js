var utils = require("../utils"),
    EdgeQuery = require("../edge_query"),
    redisify = require("redisify")
    
exports.mixin = function(Model) {
  var fn = Model.prototype
  
  Model.key = function() {
    return Model.type + "s"
  }
  
  fn.db = Model.db = redisify()
  
  fn.key = function() {
    return Model.type + ":" + this.id
  }
    
  Model.destroy = function(id, cb) {
    (new Model({id: id})).db("del", "", function(data) {
      Model.db("ZREM", "", id, function(data) {
        cb && cb()
      })
    })
  }
  
  fn._persist = function(next) {
    var o = this.modified_as_strings()

    this.db("hmset", "", o, function(data) {
      if(data != "OK") throw "no error and data != 1"
      next()
    })
  }
  
  fn._get_id = function(next) {
    var self = this
    if(this.id == null && Model.properties.id.auto_inc) {
      Model.db("INCR", "id", function(data) {
        self.id = data
        next()
      })
    }
    else next()
  }

  fn._post_persist = function (next) {
    var self = this

    Model.db("ZADD", "", self.rank(), self.id, function(data) {
      next()
    })
  }  
  
  
  fn.modified_as_strings = function() {
    var o = {}
    var mods = this.modified() || {}
    for(var name in mods)
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
    return 0
  }
  
  Model.count = function(cb) {
    Model.db("ZCARD", "", function(data) {
      cb(data)
    })
  }
  
  
  Model.find = function(id, cb) {
    if(id == null) return cb && cb(null)
//    console.log("XX", id, (new Model({id: id})).db)

    var m = new Model({id: id})
    
    m.db("HGETALL", "", function(data) {
      if(!data || data.id == null) return cb && cb(null)
      var o = Model.new_from_strings(data)
      cb && cb(Model.load(o))
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
      Model.db.client.sort.apply(Model.db.client, args)
    // })
  }
  
  Model.load_ids = function(ids, cb) {

    var ex = Model.db.client.multi();
    for(var i=0; i< ids.length;i++)  {
      var key = Model.type + ":" +ids[i]
      ex = ex.hgetall(key)
    }

    ex.exec(function (err, replies) {
      var models = []
      replies.forEach(function (data, index) {
        if(data.id == null) return
        models.push( Model.load(Model.new_from_strings(data)) )
      });
      cb(models)
    }); 
  }
  
  Model.exists = function(id, cb) {
    (new Model({id:id})).db("exists", "", function(err, data) {
      cb(err || data == 1)
    })
  }

  Model.find_edges = Model.prototype.find_edges = function(type) {
     return new EdgeQuery(this.key() +":"+type, this, this.db.client)
  }
  
  Model.add_edge = Model.prototype.add_edge = function(type, id, score, cb) {
    if(arguments.length == 3 && typeof score == "function") {
      cb = score; score = 0
    }
    if(arguments.length == 2) score = 0

    var fscore = parseFloat(score) || score/1
    if(isNaN(fscore)) {
      console.log("ERROR: score: " + score + " is NaN")
      throw "ERROR: score: " + score + " is NaN"
    }
    
    this.db("ZADD", type, fscore, id, function(data) {
      cb && cb(true)
    })
  }
  
  
  Model.remove_edge = Model.prototype.remove_edge = function(type, id, cb) {
    this.db("ZREM", type, id, function(data) {
      cb && cb(1)
    })
  }
}


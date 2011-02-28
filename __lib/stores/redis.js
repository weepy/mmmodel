var chain = require("../chain")
var queue = require("../queue")

exports.mixin = function(model) {
  
  model.q = new queue()
  
  model.key = function() {
    return model.klass + "s"
  }
  
  model.prototype.key = function() {
    return model.klass + ":" + this.id
  }
  
  model.prototype.links = function(type, cb) {
    model.client.sort(this.key() +":"+type, function(err, data) {
      if(err) return cb(false)
      cb(data)
    })
  }

  model.prototype.linkCount = function(type, cb) {
    model.client.ZCARD(this.key() +":"+type, function(err, data) {
      cb ? cb(data) : null
      // if(err) return cb(false)
      //       cb(data ? parseInt(data) : 0)
    })
  }
  
  
  model.prototype.link = function(id, type, score, cb) {
    score = score || this.id
    model.client.ZADD(this.key() +":"+type, id, score, function(err, data) {
      cb ? cb(!err) : null
    })
  }

  model.prototype.unlink = function(id, type, cb) {
    model.client.ZREM(this.key() +":"+type, id, function(err, data) {
      cb ? cb(!err) : null
    })
  }
  
  
  model.prototype.save = function(cb) {
    var self = this

    model.q.add(function() {
      self._save()
    }, function(result) {
      if(cb) cb.call(self, result)
    })
  }
  
  model.prototype.destroy = function(cb) {
    var self = this

    function done(result) {
      model.q.complete(result)
      if(cb) cb(result)
    }
    model.q.add(function() {
      model.client.del(self.key(), function(err, data) {
        model.client.ZREM(model.klass +"s", self.id, function(err, data) {
          done()
        })
      })
    })
  }
  
  model.prototype._save = function() {
    var self = this,
        client = model.client

    function doValidate(next) {
      self.valid.call(self, function(valid) {
        if(!valid) {
          model.q.complete(null);
          return false;
        }
        next()
      })
    }
    
    function getID(next) {

      if(self.id == null && model.properties.id.auto_inc) {
        client.INCR(model.klass + "s:id", function(err, data) {
          self.id = data
          next()
        })
      }
      else next()
    }
     
    function saveTo(next) {
      var o = self.stringyObject()

      client.HMSET(self.key(), o, function(err, data) {
        if(err) {
          model.q.complete(null);
          return false
        }
        if(data == "OK") {
          self.saved = true
          next()
        }
        else {
          throw "no error and data != 1"
        }
      })
    }
    
    function updateKeys(next) {
      client.ZADD(model.klass + "s", self.id, self.score(), next)
    }
    
    var fns = model.callbacks.beforeSave.concat([doValidate, getID, saveTo, updateKeys]).concat(model.callbacks.afterSave)
    chain.call(self, fns, function(result) {
      model.q.complete(true);
    })
    
  }

  model.prototype.score = function() { // use id by default...
    return this.id
  }
  
  model.prototype.stringyObject = function() {
    var o = {}
    for(var name in model.properties)
      o[name] = model.stringifyProperty(name, this[name]) 
    return o
  }
  
  model.stringifyProperty = function(name, data) {
    var type = model.properties[name].type
    if(data == null)      return ""
    if(type == "string")  return data
    if(type == "number")  return data.toString()
    if(type == "json")    return JSON.stringify(data)
    if(type == "date")    return (data/1).toString()
  }

  model.unstringifyProperty = function(name, data) {
    var type = model.properties[name].type
    if(data === "")       return null
    if(type == "string")  return data
    if(type == "number")  return parseFloat(data)
    if(type == "json")    return JSON.parse(data)
    if(type == "date")    return new Date(data/1)
  }
  
  
  model.newFromStrings = function(o) {
    var ret = {}
    for(var name in model.properties) {      
      if(!(name in o)) continue 
      ret[name] = this.unstringifyProperty(name, o[name])
    }
    return ret
  }

  model.find = function(id, cb) {
    model.client.HGETALL(model.klass + ":" +id, function(err, data) {

      if(err || !data || data.id == null)
        return cb(null, err)
      //if(data == null) console.log("errorxx", id)        
      var o = model.newFromStrings(data)

      cb(new model(o, true))
    })
  }

  model.count = function(cb) {
    model.client.ZCARD(model.klass+"s", function(err, data) {
      cb(data)
    })
  }


  model.exists = function(id, cb) {
    model.client.exists(model.klass + ":" + id, function(err, data) {
      cb(err || data == 1)
    })
  }

  model.loadFromIds = function(ids, cb) {
    var ex = model.client.multi();
    for(var i=0; i< ids.length;i++)  {
      var key = model.klass + ":" +ids[i]
      ex = ex.hgetall(key)
    }        
    ex.exec(function (err, replies) {
      var models = []
      replies.forEach(function (data, index) {
        models[index] = new model(model.newFromStrings(data), true)
      });
      cb(models)
    }); 
  }

  model.all = function(query, cb) {
    query = query || "" // "BY id"
    var fn = function(err, data) {
      if(err) return cb(false)
      if(!data) return cb(0)
      for(var i=0; i<data.length; i++)
        data[i] = model.properties.id.type == "string" ? data[i].toString() : parseInt(data[i])
      
      // console.log(data)
      model.loadFromIds(data, cb)
    }

    var args = [model.klass +"s"].concat(query.split(" ")).concat([fn])
    model.client.sort.apply(model.client, args)
  }

}
//

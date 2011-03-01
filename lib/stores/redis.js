var utils = require("../utils")

exports.mixin = function(model) {
  
  model.count = function(cb) {
    model.client.ZCARD(model.type+"s", function(err, data) {
      cb(data)
    })
  }

  model.q = new utils.queue()
  
  model.key = function() {
    return model.type + "s"
  }
  
  var fn = model.prototype
  
  fn.key = function() {
    return model.type + ":" + this.id
  }
  
  fn.destroy = function(cb) {
    var self = this

    // function done(result) {
    //     model.q.complete(result)
    //     if(cb) cb(result)
    //   }

    model.client.del(self.key(), function(err, data) {
      model.client.ZREM(model.type +"s", self.id, function(err, data) {
        cb()
      })
    })
  }
  
  
  fn._persist = function(next) {
    var self = this, o = self.stringyObject()

    model.client.HMSET(this.key(), o, function(err, data) {
      if(err) return next(false)
      if(data != "OK") throw "no error and data != 1"
      next()
    })
  }
  
  fn._getId = function(next) {
    var self = this
    if(this.id == null && model.properties.id.auto_inc) {
      model.client.INCR(model.key() + ":id", function(err, data) {
        self.id = data
        next()
      })
    }
    else next()
  }

  fn._updateKeys = function (next) {
    model.client.ZADD(model.key(), self.id, self.rank(), next)
  }  

  fn._saveStack = [
    fn.validate,
    fn._getId,
    fn._persist,
    fn._updateKeys,
    fn._saved
  ]
  
  fn.stringyObject = function() {
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
    
  fn.rank = function() {
    return this.id
  }
  
  model.find = function(id, cb) {
    model.client.HGETALL(model.type + ":" +id, function(err, data) {
      if(err || !data || data.id == null) return cb(null, err)
      var o = model.newFromStrings(data)
      cb(new model(o, true))
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

      model.loadFromIds(data, cb)
    }

    var args = query ? query.split(" ") : []
    args.unshift(model.key())
    args.push(func)
    model.client.sort.apply(model.client, args)
  }
  
  model.loadFromIds = function(ids, cb) {
    console.log(ids)
    var ex = model.client.multi();
    for(var i=0; i< ids.length;i++)  {
      var key = model.type + ":" +ids[i]
      ex = ex.hgetall(key)
    }
    console.log(123)
    ex.exec(function (err, replies) {

      console.log(err, replies)
      var models = []
      replies.forEach(function (data, index) {
        models[index] = new model(model.newFromStrings(data), true)
      });
      cb(models)
    }); 
  }
  
  
  
  
  
      
  // fn.save = function(cb) {
  //   var fns = [
  //     this.validate,
  //     this._getId,
  //     this.persist
  //   ]
  //   utils.achain.call(this, fns, [], function(err, results) {
  //     cb.call(this, !err)
  //   })
  // }
  // 
  // fn._getId = function(cb) {
  //   this.id = ++model._id
  //   cb()
  // }
  // 
  // fn.persist = function(cb) {
  //   model.DB[self.id] = this
  //   this.trigger("saved").complete(function() {
  //     cb(true)
  //   })
  // }
  // 
  // model.find = function(id, cb) {
  //   cb(model.DB[id])
  // }
  // 

  // 
  // model.exists = function(id, cb) {
  //   cb(!!model.DB[id])
  // }
  // 
  // model.loadFromIds = function(ids, cb) {
  //   var ret=[];
  //   for(var id in ids) ret.push(model.DB[id])
  //   cb(ret)
  // }
  // 
  // model.all = function(cb) {
  //   cb(model.DB)
  // }
  
}



/*
var chain = require("../chain")
var queue = require("../queue")

exports.mixin = function(model) {
  

  
  fn.links = function(type, cb) {
    model.client.sort(this.key() +":"+type, function(err, data) {
      if(err) return cb(false)
      cb(data)
    })
  }

  fn.linkCount = function(type, cb) {
    model.client.ZCARD(this.key() +":"+type, function(err, data) {
      cb ? cb(data) : null
      // if(err) return cb(false)
      //       cb(data ? parseInt(data) : 0)
    })
  }
  
  
  fn.link = function(id, type, rank, cb) {
    rank = rank || this.id
    model.client.ZADD(this.key() +":"+type, id, rank, function(err, data) {
      cb ? cb(!err) : null
    })
  }

  fn.unlink = function(id, type, cb) {
    model.client.ZREM(this.key() +":"+type, id, function(err, data) {
      cb ? cb(!err) : null
    })
  }



  model.count = function(cb) {
    model.client.ZCARD(model.type+"s", function(err, data) {
      cb(data)
    })
  }


  model.exists = function(id, cb) {
    model.client.exists(model.type + ":" + id, function(err, data) {
      cb(err || data == 1)
    })
  }





}
//

*/
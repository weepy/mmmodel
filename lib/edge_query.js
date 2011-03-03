function EdgeQuery(x, self) {
  this.key = x
  this.self = self
}

EdgeQuery.prototype.range = function(low, high) {
  high != null || (high = low)
  this._range = [low, high]
  return this
}

EdgeQuery.prototype.count = function(cb) {
  this._count = true
  this.all(cb)
}

EdgeQuery.prototype.all = function(cb) {  
  var args = [this.key]
  var method
  if(this._range) {
    method = this._count ? "ZCOUNT" : "ZRANGEBYSCORE"
  } else {
    if(this._count) 
      method =  "ZCARD" 
    else {
      method = "ZRANGE"
      args.push("0")
      args.push("-1")
    }
  }
  
  if(this._range) {
    var L = this._range[0].toString().replace(/()/g, "").replace("inf", "Infinity")
    var R = this._range[1].toString().replace(/()/g, "").replace("inf", "Infinity")

    L = parseFloat(L)
    R = parseFloat(R)

    if(R < L) { // swap ! 
      method = method.replace("ZRANGE","ZREVRANGE")
      // this._range = [this._range[1], this._range[0]]
    }
    
    args = args.concat(this._range)
  }
  
  var context = this.self
  
  var klass = this._load_as

  args.push(function(err, data) {
    if(err) return cb.call(context, null)
    if(klass) klass.instantiate_from_ids(data, cb)
    else cb.call(context, data)
  })
  
  var client = self.constructor.client

  client[method].apply(client, args)
}


EdgeQuery.prototype.load_as = function(type) {
  this._load_as = type
  return this
}

// EdgeQuery.prototype.desc = function() {
//   this._desc = true
//   return this
// }

module.exports = EdgeQuery
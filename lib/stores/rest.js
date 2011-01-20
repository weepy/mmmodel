module.exports = model = {prototype: {}, klass: {}}

STORE = {}

model.prototype.links = function(type, cb) {
// not impl
}

model.prototype.linkCount = function(type, cb) {
// not impl
}

model.prototype.link = function(id, type, cb) {
// not impl
}

model.prototype.save = function(cb) {
  queue.add({
    object: this,
    method: "_save",
    callback: cb,
    context: this
  })
}

model.prototype._save = function(cb) {
  var self = this  
  chain.call(this, model.callbacks.beforeSave || [], function() {
    self.valid(function(valid) {
      if(!valid)
        return cb ? cb(null) : 0
      ajax.post("/" + model.plural() + "/" + id + "/save", function() {
        cb() 
      })
    })
  })
}

model.klass.find = function(id, cb) {
  ajax.get("/" + model.klass + "/" + id, function(data) {
    var o = new model(data)
    cb(null, o)
  })
}

model.klass.count = function(cb) {
  var i=0;
  for(var id in STORE)
    i++
  cb(i)
}

model.klass.exists = function(id, cb) {
  cb(!!STORE[id])
}

model.klass.loadFromIds = function(ids, cb) {
  var ret=[];
  for(var id in ids)
    ret.push(STORE[id])
  cb(ret)
}

model.klass.all = function(cb) {
  cb(STORE)
}
//
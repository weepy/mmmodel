var utils = require("../utils")

exports.mixin = function(model) {
  var fn = model.prototype
  
  fn._destroy = function(cb) {
    var self = this
    $.post(model.url + "/destroy", {json: this.toJSON()}, function(text) {
      cb(text == "ok")
    })
  }

  fn._persist = function(cb) {
    var self = this
    $.post(model.url + "/save", {json: JSON.stringify(this.toJSON())}, function(text) {
      var o = JSON.parse(text)
      task.merge(o)
      cb()
    })
  }
  
  fn._saveStack = [
    fn.validate,
    fn._persist,
    fn._saved
  ]
  
    
  // model.find = function(id, cb) {
  //     $.get(model.url , {}, function(text) {
  //       cb(model.DB[id])
  //     }
  //   }
  // 
  //   model.count = function(cb) {
  //     var i=0;
  //     for(var id in model.DB) i++
  //     cb(i)
  //   }
  // 
  //   model.exists = function(id, cb) {
  //     cb(!!model.DB[id])
  //   }
  // 
  //   model.loadFromIds = function(ids, cb) {
  //     var ret=[];
  //     for(var id in ids) ret.push(model.DB[id])
  //     cb(ret)
  //   }
  // 
  //   model.all = function(cb) {
  //     cb(model.DB)
  //   }
}
var app = require("./lib/app"),
    is = require("should"),
    Task = require("./lib/task")

Task.setStore("rest")
Task.url = "/tasks"
function params(o) {
  var ret = []
  for(var i in o)
    ret.push(i+"="+escape(o[i]))
  return ret.join("&")
}


Task.ajax = {
  ajax: function(url, data, method, callback) {
   url += "?" + params(data)
    is.response(app, { url: url, method: method }, function(res) {
      callback(res.body)
    })
  },
  get: function(url, data, callback) {
    Task.ajax.ajax(url, data, "GET", callback)
  },
  post: function(url, data, callback) {
    Task.ajax.ajax(url, data, "POST", callback)
  }
}

// exports.test_save = function(done) {
//   var task = new Task({user: "jonah"})
//   
//   task.save(function(o) {
//     task.id.should.be.eql(1)
//       done()
//   })
// }


exports.test_find = function(done) {
  Task.find(1, function(task) {
    console.log(task)
    task.id.should.be.eql(1)
    done()
  })
}

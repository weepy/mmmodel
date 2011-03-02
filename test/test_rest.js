var app = require("./lib/app"),
    is = require("should"),
    assert = require("assert"),
    Task = require("./lib/task")

Task.setStore("rest")
Task.url = "/tasks"
function params(o) {
  var ret = []
  for(var i in o)
    ret.push(i+"="+escape(o[i]))
  return ret.join("&") || "_=1"
}


Task.ajax = {
  ajax: function(url, data, method, callback) {
    url += "?" + params(data)
    is.response(app, { url: url, method: method, data: "_" }, function(res) {
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



exports.test_non_existing_find = function(done) {
  Task.find(1, function(task) {
    is.ok(task === null)
    done()
  })
}

exports.test_create = function(done) {
  Task.create({user: "jonah"}, function(task) {
    task.id.should.be.eql(1)
    done()
  })
}

exports.test_create2 = function(done) {
  Task.create({user: "jonah"}, function(task) {
    task.id.should.be.eql(2)
    done()
  })
}


var app = require("./lib/app"),
    is = require("should"),
    assert = require("assert"),
    Task = require("./lib/task")("rest")


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

exports.test_find = function(done) {
  Task.find(1, function(task) {
    task.id.should.eql(1)
    task.user.should.eql("jonah")
    task.keywords.should.eql(["books"])    
    done()
  })
}

exports.test_update = function(done) {
  Task.find(1, function(task) {
    task.user = "bob"
    task.modified("user").should.be.ok
    task.save(function(t) {
      t.user.should.eql("bob")
      t.id.should.eql(1)
      // task.sync()
      t.modified().should.eql(false)
      t.modified("user").should.eql(false)
      done()
    })
  })
}

exports.test_destroy = function(done) {
  Task.destroy(1, function(ok) {
    ok.should.eql(true)
    done()
  })
}

exports.test_failing_find2 = function(done) {
  Task.find(1, function(task) {
    is.ok(task === null)
    done()
  })
}


exports.test_create2 = function(done) {
  Task.create({user: "jim"}, function(task) {
    task.id.should.be.eql(2) 
    done()
  })
}

exports.test_create3 = function(done) {
  Task.create({user: "bob"}, function(task) {
    task.id.should.be.eql(3) 
    done()
  })
}

exports.test_query = function(done) {
  Task.query({}, function(tasks) {
    tasks.length.should.be.eql(2) 
    tasks[0].id.should.eql(2)
    tasks[1].user.should.eql("bob")
    done()
  })
}



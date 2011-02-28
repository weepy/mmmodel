var x = {},
    assert = require('assert'),
    is = require('should'),
    mmodel = require('../lib/core'),
    Task = require("./lib/task") 

var task, o

exports.load = function(done) {
  o = {user: "billy"}
  task = new Task(o)
  // console.log(task)
  assert.eql(task.user, "billy")
  assert.eql(task.keywords, ["books"])
  assert.eql(task.test, 123)
  done()
}

exports.toJSON = function(done) {
  o = {user: "billy"}
  task = new Task(o)
  assert.eql(task.toJSON(), { user: 'billy',
    title: 'no title!',
    keywords: [ 'books' ],
    type: 'Task' })
  done()  
}

exports.validate = function(done) {
  task = new Task()
  task.validate(function(ok) {
    assert.eql(ok, false)
    assert.eql(this.errors.length, 1)
  })
  
  task2 = new Task({user:"billy"})
  task2.validate(function(ok) {
    assert.eql(ok, true)
    done()
  })
  
}

exports.loadCollection = function(done) {
  var list = Task.loadCollection([{user:"billy"}, {user:"jonah"}])
  assert.eql(list.length, 2)
  assert.ok(list[0] instanceof Task)
  done()
}

exports.merge = function(done) {
  task = new Task()
  task.merge({user:"bob", errors: "hello", title: "meep", __random:"XXX"})
  assert.eql(task.toJSON(), {user:"bob", title: "meep", keywords: ["books"], type:"Task"})
  done()
}


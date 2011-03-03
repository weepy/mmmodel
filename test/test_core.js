var x = {},
    assert = require('assert'),
    is = require('should'),
    Task = require("./lib/task") 

var task, o


exports.load = function(done) {
  o = {user: "billy"}
  task = new Task(o)
  assert.eql(task.user, "billy")
  assert.eql(task.keywords, ["books"])
  assert.eql(task.test, 123)
  done()
}

exports.toJSON = function(done) {
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

exports.loadArray = function(done) {
  var list = Task.loadArray([{user:"billy"}, {user:"jonah"}])
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

exports.test_dirty = function() {
  task = new Task({user:"billy"})
  task.dirty().should.be.ok
  
  task2 = Task.load({user:"billy"})
  task2.dirty().should.eql(false)
    
  task2.user = "johnny"
  
  task2.dirty().should.eql({"user":["billy", "johnny"]})  
  task2.dirty("user").should.eql(["billy", "johnny"])  
}


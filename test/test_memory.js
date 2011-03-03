var x = {},
    assert = require('assert'),
    is = require('should'),
    mmodel = require('../lib/core'),
    Task = require("./lib/task") 

Task.setStore("memory")

var task, o

exports.zero_tasks = function(done) {
  Task.count(function(val) {
    val.should.equal(0)
    done()
  })
}

exports.unsaved_task_has_no_id = function(done) {
  var t = new Task()
  is.ok(!t.id)
  done()
}


exports.save_valid_task = function(done) {
  var t = new Task({user: "billy"})

  t.save(function(ok) {
    
    ok.should.be.ok
    is.ok(t.id, "is saved")

    Task.exists(1, function(ok) {
      is.ok(ok)
    })
    
    Task.count(function(num) {
      is.equal(num, 1, "task count is 1")
      done()
    })
  })
}

exports.find_saved_task = function(done) {
  Task.find(1, function(u) {
    is.equal(u.id, 1, "id is correct")  
  
    Task.count(function(num) {
      is.equal(num, 1, "task count is 1")
      done()
    })
  })
}

exports.test_failed_create = function(done) {
  Task.create({id: 21}, function(p) {
    is.ok(p.errors.length, "task needs owner")
    done()
  })
}

exports.test_create = function(done) {
  Task.create({user: "wibwob"}, function(p) {
    is.ok(p.id)
    p.id.should.equal(2)
  })
  
  Task.create({user: "wibwob"}, function(p) {
    is.ok(p.id)
    p.id.should.equal(3)
    done()
  })
}

exports.test_dirty = function(done) {
  task2 = new Task({user:"billy"})
  task2.user = "johnny" 
  task2.dirty().should.be.ok
  task2.save(function() {
    task2.dirty().should.not.be.ok
    done()
  })
}

exports.test_exists = function(done) {
  Task.find(1, function(task) {
    task.id.should.eql(1)
      Task.count(function(num) {
        num.should.eql(4)
      })
    done()
  })
}

exports.test_destroy = function(done) {
  Task.destroy(1, function(ok) {
    ok.should.be.ok
    Task.destroy(1, function(ok) {
      ok.should.not.be.ok
      Task.find(2, function(task) {
        task.destroy(function(ok) {
          ok.should.be.ok     
          Task.count(function(num) {
            num.should.eql(2)
            Task.destroy(3, function(ok) {
              Task.destroy(4, function(ok) {
                Task.count(function(num) {
                  num.should.eql(0)
                  done()
                })
              })
            })            
          })
        })
      })   
    })
  })
}

exports.test_create2 = function(done) {
  Task.create({user: "wibwob"}, function(p) {
    is.ok(p.id)
    p.id.should.equal(5)
    done()
  })
}

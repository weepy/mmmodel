var x = {},
    assert = require('assert'),
    is = require('should'),
    mmmodel = require('..'),
    Task = require("./lib/task")("memory")

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


exports.save_valid_saved = function(done) {
  var t = new Task({user: "billy"})


  t.save(function(ok) {
    ok.should.be.ok
    is.ok(t.id, "is saved")
    is.ok(t.saved())
    
    Task.exists(1, function(ok) {
      is.ok(ok)
    })
    
    Task.count(function(num) {
      is.equal(num, 1, "task count is 1")
      done()
    })
  })
}

exports.invalid_task_is_not_saved = function(done) {
  var t = new Task()
  t.save(function(task) {
    task.should.be.ok
    is.ok(!t.saved())
    done()
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

exports.test_update = function(done) {
  Task.find(1, function(task) {
    task.user = "bob"
    task.modified("user").should.be.ok
    task.save(function(t) {
      t.user.should.eql("bob")
      t.id.should.eql(1)
      // task._synchronize()
      // task.modified().should.eql(false)
      // task.modified("user").should.eql(false)
      done()
    })
  })
}


exports.test_to_json = function(done) {
  Task.find(1, function(u) {
    u.toJSON().created_at.should.be.a("number")
    done()    
  })
}



exports.test_failed_create = function(done) {
  
  
  Task.create({id: 21}, function(p) {
    is.ok(p.errors.length, "task needs owner")
    p.saved().should.not.be.ok
  })
  
  Task.count(function(num) {
    is.equal(num, 1, "task count is " + num)
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

exports.test_modified = function(done) {
  task2 = new Task({user:"billy"})
  task2.user = "johnny" 
  task2.modified().should.be.ok
  task2.save(function() {
    task2.modified().should.not.be.ok
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

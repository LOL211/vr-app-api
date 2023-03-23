const chai = require('chai');
const chaiHTTP = require('chai-http')
const server = require('../index')
const should = chai.should();
const expect = chai.expect
const fs = require('fs')
const firebase = require("firebase/app");
const auth = require("firebase/auth");

const firebaseConfig = {
    apiKey: "AIzaSyCpefYz7bDeQkV1evWvFpuEADfNPvsuABU",
    authDomain: "vr-application-29195.firebaseapp.com",
    databaseURL: "https://vr-application-29195-default-rtdb.firebaseio.com",
    projectId: "vr-application-29195",
    storageBucket: "vr-application-29195.appspot.com",
    messagingSenderId: "454382693464",
    appId: "1:454382693464:web:a6a10292c3e508484dee2d"
  };

const firebaseapp = firebase.initializeApp(firebaseConfig);
const myauth =auth.getAuth(firebaseapp);


chai.use(chaiHTTP);


describe('Test Auth Request',()=>{


    const createresponse = (classnames, user_name, role)=>{
       
        let CourseList = Object();

        let class_teacher = {};
        class_teacher["CS2204"] = "Teacher 1"
        class_teacher["CS3103"] = "Teacher 2"
        class_teacher["CS3342"] = "Teacher 1"
        CourseList.courses = []
        classnames.forEach(element => {
            let objj = Object()
            objj.CourseName = element;
            objj.Teacher = class_teacher[element]
            CourseList.courses.push((JSON.stringify(objj)))
        });
        CourseList.role=role
        CourseList.name = user_name;

        return CourseList;
    }
    const testequal = (response, actual)=>{
        let coursesame = true;
        response.courses.forEach((ele)=>{
            let stringy = JSON.stringify(ele)
            if(!actual.courses.includes(stringy))
            {
               coursesame = false;
                return;
            }
        });

        if(!coursesame) return false;

        if(response.name == actual.name && response.role == actual.role)
        {
            return true;
        }



    }

    it('Test student', (done)=>{

        chai.request(server)
        .post('/auth')
        .set("Content-type","application/json")
        .send({
            "email":"student1@gmail.com", 
            "password":"test1234"
        })
        .end(async (err, res)=>{
            expect(testequal(res.body.CourseList,createresponse(["CS2204", "CS3103","CS3342"],"Student 1", "Student") )).to.be.equal(true);
            done();
    })
})


    
    it('Test Teacher', (done)=>{

        chai.request(server)
        .post('/auth')
        .set("Content-type","application/json")
        .send({
            "email":"teacher1@gmail.com", 
            "password":"test1234"
        })
        .end((err, res)=>{
            expect(testequal(res.body.CourseList,createresponse(["CS2204","CS3342"],"Teacher 1", "Teacher") )).to.be.equal(true);
            done();
    });
})


    
    it('Test false user', (done)=>{

        chai.request(server)
        .post('/auth')
        .set("Content-type","application/json")
        .send({
            "email":"student10@gmail.com", 
            "password":"test1234"
        })
        .end((err, res)=>{
            console.log(res.text)
            expect(res.text).to.be.equal('Did not find user or improper credentials');
            done();
    });
})

    
it('Test invalid user-password', (done)=>{

    chai.request(server)
    .post('/auth')
    .set("Content-type","application/json")
    .send({
       
        "password":"test1234"
    })
    .end((err, res)=>{
        //console.log(res.text)
        expect(res.text).to.be.equal('Did not find user or improper credentials');
        done();
});
})

    
it('Test invalid user-email', (done)=>{

    chai.request(server)
    .post('/auth')
    .set("Content-type","application/json")
    .send({
       "email":""
    })
    .end((err, res)=>{
        expect(res.text).to.be.equal('Did not find user or improper credentials');
        done();
    })

});

})


describe("Test file list request", ()=>{
    

it('Test teacher ',  (done)=>{
    
    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
       
        chai.request(server)
        .post('/filelist')
        .set("Content-type","application/json")
        .send({
          "IdToken":idtoken,
          "class":"CS2204"
        })
        .end((err, res)=>{
          console.log(res.body.list)
            mylist = [
                '5_-_Computing_Architectures_for_VR.pdf',
                'EE4221_L1_Cloud_Concepts_Overview_(1).pdf',
                'hw1.pdf',
                'test_01.pdf',
                'test_02.pdf',
                'test_03.pdf'
              ]
            let valid = true
    
            mylist.forEach(element => {
                if(!res.body.list.includes(element))
                    valid = false
                
                
            });
            console.log(err)
            expect(valid).to.be.equal(true);
           done();
        })
    })
})

it('Test student ',  (done)=>{
    
    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
       
        chai.request(server)
        .post('/filelist')
        .set("Content-type","application/json")
        .send({
          "IdToken":idtoken,
          "class":"CS2204"
        })
        .end((err, res)=>{
          console.log(res.body.list)
            mylist = [
                '5_-_Computing_Architectures_for_VR.pdf',
                'EE4221_L1_Cloud_Concepts_Overview_(1).pdf',
                'hw1.pdf',
                'test_01.pdf',
                'test_02.pdf',
                'test_03.pdf'
              ]
            let valid = true
    
            mylist.forEach(element => {
                if(!res.body.list.includes(element))
                    valid = false
                
                
            });
            console.log(err)
            expect(valid).to.be.equal(true);
           done();
        })
    })
})

it('Test bad class',  (done)=>{
    
    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
       
        chai.request(server)
        .post('/filelist')
        .set("Content-type","application/json")
        .send({
          "IdToken":idtoken,
          "class":"CS22044"
        })
        .end((err, res)=>{        
            expect(res.body.list.length).to.be.equal(0);
           done();
        })
    })
})


it('Test bad id',  (done)=>{
    
 
    chai.request(server)
    .post('/filelist')
    .set("Content-type","application/json")
    .send({
      "IdToken":"sdsd",
      "class":"CS2204"
    })
    .end((err, res)=>{
      console.log(res.text)
        expect(res.text).to.be.equal("Invalid user");
       done();
    })
})



it('Test bad payload',  (done)=>{
    
 
    chai.request(server)
    .post('/filelist')
    .set("Content-type","application/json")
    .send({
      "class":"CS2204"
    })
    .end((err, res)=>{
        expect(res.text).to.be.equal("Invalid format");
       done();
    })
})

it('Test no payload',  (done)=>{
    
 
    chai.request(server)
    .post('/filelist')
    .set("Content-type","application/json")
    .send({
      
    })
    .end((err, res)=>{
        expect(res.text).to.be.equal("Invalid format");
       done();
    })
})
})


describe("Test File Conversion", ()=>{


it("Test valid path student", (done)=>{
    


    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
        
        chai.request(server)
        .post('/filedownload')
        .set("Content-type","application/json")
        .send({
          "file":"CS2204/test_01.pdf",
          "IdToken":idtoken
        })
        .end((err, res)=>{
           
        expect(res.text).to.be.equal("OK");
           done();
        })
    })
    
})
    


it("Test valid path teacher", (done)=>{
    auth.signInWithEmailAndPassword(myauth, "teacher1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
        
        chai.request(server)
        .post('/filedownload')
        .set("Content-type","application/json")
        .send({
          "file":"CS2204/EE4221_L1_Cloud_Concepts_Overview_(1).pdf",
          "IdToken":idtoken
        })
        .end((err, res)=>{
     
        expect(res.text).to.be.equal("OK");
           done();
        })
    })
    
})
    
it("Test invalid path", (done)=>{
    
    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
        
        chai.request(server)
        .post('/filedownload')
        .set("Content-type","application/json")
        .send({
          "file":"CS204/test_01.pdf",
          "IdToken":idtoken
        })
        .end((err, res)=>{
           
        expect(res.text).to.be.equal("File not found");
           done();
        })
    })
    
})
    
it("Test invalid payload-idtoken", (done)=>{
    

        
        chai.request(server)
        .post('/filedownload')
        .set("Content-type","application/json")
        .send({
          "file":"CS204/test_01.pdf",
          "IdToken":""
        })
        .end((err, res)=>{
           
        expect(res.text).to.be.equal("Invalid user");
           done();
       
    })
    
})

it("Test invalid payload-file", (done)=>{
    

    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
        chai.request(server)
            .post('/filedownload')
            .set("Content-type","application/json")
            .send({
            "file":"",
            "IdToken":idtoken
            })
            .end((err, res)=>{
            
            expect(res.text).to.be.equal("File not found");
            done();
        })
   
})

})
it("Test missing payload-idtoken", (done)=>{
    

         
    auth.signInWithEmailAndPassword(myauth, "student1@gmail.com", "test1234")
    .then((user)=>user.user.getIdToken())
    .then(idtoken=>{
        chai.request(server)
        .post('/filedownload')
        .set("Content-type","application/json")
        .send({
        "IdToken":idtoken
        })
        .end((err, res)=>{
        
        expect(res.text).to.be.equal("Invalid format");
        done();
    })
})
})

it("Test missing payload-file", (done)=>{
    

        
    chai.request(server)
    .post('/filedownload')
    .set("Content-type","application/json")
    .send({
      "file":"CS204/test_01.pdf"
    })
    .end((err, res)=>{
       
    expect(res.text).to.be.equal("Invalid format");
       done();
   
})

})
})

describe("Test image requests", ()=>{
    it("Download valid image", (done)=>{
      
        chai.request(server)
        .get('/image/CS2204/test_01/1')
        .end(async (err, res)=>{
            console.log(res.body);
            // let test =  fs.existsSync("")
            // console.log(test)
            let b = fs.readFileSync("CS2204/test_01/buffer_page_1.png")
            console.log(b)
            expect(b.compare(res.body)).equal(0)
            done();
        })
    })

    it("Download invalid image", (done)=>{
      
        chai.request(server)
        .get('/image/CS22/test_01/1')
        .end((err, res)=>{
            console.log(res.text);
            expect(res.text).equal("File not existing")
            done();
        })
    })

    it("Invalid route", (done)=>{
      
        chai.request(server)
        .get('/image/CS22/1')
        .end((err, res)=>{
           // console.log(res.text);
            expect(res.status).to.be.equal(404)
            done();
        })
    })
})
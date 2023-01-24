const express= require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 8080;
const firebase = require("firebase/app");
const auth = require("firebase/auth");
const fs = require('fs');
const storage = require("firebase/storage")
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

const mystorage = storage.getStorage(firebaseapp);
app.use(bodyParser.json())

const getDetails = async(idtoken)=>{
    let r; 
    r = await fetch("https://vr-app.fly.dev/home",
     {
         method:"POST",
         headers: {
         'Accept':"*/*",
         'Content-Type':"application/json",
         'Access-Control-Allow-Origin': '*'
         },
         body:JSON.stringify(
         {"requestType":"HOME",
             "idToken": idtoken
         }
         )
     });
   
     let td = new TextDecoder();
     let rd = r['body'].getReader();
     let belongs =  td.decode((await rd.read()).value);
   
  
    return JSON.parse(belongs);
  
}

const login = async (email, password) =>{

    let idtoken = null;
    let response = await auth.signInWithEmailAndPassword(myauth, email,password);
    let user = response['user'];
    
    idtoken = await user.getIdToken();
    let name = await getDetails(idtoken);
    console.log(name);

  return [idtoken, name ];
}

const getToken = async(idtoken)=> {
    let r; 
  
   r = await fetch("https://vr-app.fly.dev/token",
    {
        method:"POST",
        headers: {
        'Accept':"*/*",
        'Content-Type':"application/json",
        'Access-Control-Allow-Origin': '*'
        },
        body:JSON.stringify(
        {"requestType":"TEACHER",
            "idToken": idtoken
        }
        )
    });
    let td = new TextDecoder();
    let rd = r['body'].getReader();
    let belongs =  td.decode((await rd.read()).value);
  
  
   return belongs;
  }


app.post("/auth", async (req, res) =>{
    let response =  await login(req.body["email"], req.body["password"]);
    let obj = new Object();
    obj.IdToken = response[0];
    obj.courses = response[1];
    obj.courses.courses = JSON.parse(obj.courses.courses);
    console.log(obj);
    res.status=200
    res.end(JSON.stringify(obj));
})

app.post("/file/list", async (req, res)=>{
    let classname = req.body['class'];
    let idtoken = req.body['IdToken'];
    let t = await getToken(idtoken);

    await auth.signInWithCustomToken(myauth, t);
    let list = []

    const listref = storage.ref(mystorage, '/'+classname);
   
   await storage.listAll(listref).then(res=>{
        res.items.forEach((itemRef) => {
            list.push(itemRef.name);
        });
    }).catch(err=>{ console.log(err)});
res.set("Content-Type", 'application/json')  

res.end(JSON.stringify(list));
});


app.post("/file/download", async (req, res)=>{
    let file = req.body['file'];
    let idtoken = req.body['IdToken'];
    let t = await getToken(idtoken);

    await auth.signInWithCustomToken(myauth, t);

    const listref = storage.ref(mystorage, '/'+file);

    let bytes = await storage.getBytes(listref)
   
await storage.getMetadata(listref).then(metadata=>{
    res.set("Content-Type", metadata.contentType );  
})

res.end(Buffer.from(bytes));
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const express= require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3000;
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


// require("firebase/database");


const firebaseapp = firebase.initializeApp(firebaseConfig);
const myauth =auth.getAuth(firebaseapp);

app.use(bodyParser.json())


const login = async (email, password) =>{

    let idtoken = null;
    let response = await auth.signInWithEmailAndPassword(myauth, email,password);
    let user = response['user'];
    idtoken = await user.getIdToken();
  return idtoken;
}




app.post("/auth", async (req, res) =>{
    
    console.log(req.body["email"])
   let token = await login(req.body["email"], req.body["password"]);
    let obj = new Object();
    obj.IdToken = token;
    console.log(token);
    res.status=200
    res.end(JSON.stringify(obj));
})














app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
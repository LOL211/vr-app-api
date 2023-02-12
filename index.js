const express= require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 8080;
const firebase = require("firebase/app");
const auth = require("firebase/auth");
const fs = require('fs');
const storage = require("firebase/storage");
const pdf = require("pdf-to-png-converter");
const path = require("path");
const firebaseConfig = {
    apiKey: "AIzaSyCpefYz7bDeQkV1evWvFpuEADfNPvsuABU",
    authDomain: "vr-application-29195.firebaseapp.com",
    databaseURL: "https://vr-application-29195-default-rtdb.firebaseio.com",
    projectId: "vr-application-29195",
    storageBucket: "vr-application-29195.appspot.com",
    messagingSenderId: "454382693464",
    appId: "1:454382693464:web:a6a10292c3e508484dee2d"
  };

let createddirectories = [];
 
const firebaseapp = firebase.initializeApp(firebaseConfig);
const myauth =auth.getAuth(firebaseapp);

const mystorage = storage.getStorage(firebaseapp);
app.use(bodyParser.json());

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
    let name = null;
   await auth.signInWithEmailAndPassword(myauth, email,password).then(async response=>{
    let user = response['user'];
    
    idtoken = await user.getIdToken();
   name = await getDetails(idtoken);
   
   }).catch(
        err=>{
           console.log("did not find user"); 
        }
    );
   

  return [idtoken, name];
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

    if(response[0]===null)
    {
        res.status(404);
        res.end("Did not find user");
    }
    else{
   
        let obj = new Object();
        obj.IdToken = response[0];
        obj.CourseList = response[1];
        obj.CourseList.courses = JSON.parse(obj.CourseList.courses);
        console.log(JSON.stringify(obj));
        res.status(200);
      
        res.end(JSON.stringify(obj));
    }
    
});

app.post("/filelist", async (req, res)=>{
    let classname = req.body['class'];
    let idtoken = req.body['IdToken'];
    let t = await getToken(idtoken);

    await auth.signInWithCustomToken(myauth, t).then(async ()=>{
        let list = []

        const listref = storage.ref(mystorage, '/'+classname);
       
       await storage.listAll(listref).then(res=>{
            res.items.forEach((itemRef) => {
                list.push(itemRef.name);
            });
        }).catch(err=>{ console.log(err)});
    res.set("Content-Type", 'application/json')  
    res.status(200);
    let obj = new Object();
    obj.list = list;
    res.end(JSON.stringify(obj));
    }).catch(err=>{
        res.status(404);
        res.end("Invalid user");
    });
    
});


async function convertPDFtoPNG(pdfPath) {
    return pdf.pdfToPng(pdfPath,{
          
              disableFontFace: true, // When `false`, fonts will be rendered using a built-in font renderer that constructs the glyphs with primitive path commands. Default value is true.
              useSystemFonts: false, // When `true`, fonts that aren't embedded in the PDF document will fallback to a system font. Default value is false.
              viewportScale: 1.0, // The desired scale of PNG viewport. Default value is 1.0.
               outputFolder: pdfPath.split('/myfile.pdf')[0], // Folder to write output PNG files. If not specified, PNG output will be available only as a Buffer content, without saving to a file.
              outputFileMask: 'buffer', // Output filename mask. Default value is 'buffer'.
              verbosityLevel: 0 // Verbosity level. ERRORS: 0, WARNINGS: 1, INFOS: 5. Default value is 0.
      });
  }
  function deleteDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }
  
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirectory(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
  
    fs.rmdirSync(dirPath);
  }
app.post("/filedownload", async (req, res)=>{
    let file = req.body['file'];
    let idtoken = req.body['IdToken'];
    
    let t = await getToken(idtoken);

    await auth.signInWithCustomToken(myauth, t);
    file = file.trim();
    const listref = storage.ref(mystorage, '/'+file);
    console.log(file);
    let pat = file.split('.pdf')[0];
    console.log(pat);
    if(fs.existsSync("./"+pat))
    {
        console.log('file exists');
    }
    else
    {  
        let bytes = await storage.getBytes(listref)
        createddirectories.push("./"+pat);
        fs.mkdirSync("./"+pat, { recursive: true });
        fs.writeFileSync("./"+pat+"/myfile.pdf", Buffer.from(bytes), 'binary');

        const timeToDelete = 4*60*60*1000;

        setTimeout(() => {
        // Use the fs.rmdir() method to delete the directory
        deleteDirectory("./"+pat);
        }, timeToDelete);


        console.log("downloaded");
        convertPDFtoPNG("./"+pat+"/myfile.pdf");
        console.log("converted");
    }
        res.set('Content-Type', 'application/json');
        console.log(JSON.stringify("OK"));
        res.end(JSON.stringify("OK"));
});

app.get("/image/:class/:filename/:id", async (req, res)=>{

    let id = req.params.id;
    console.log(id);
    let pat = "/"+req.params.class+"/"+req.params.filename;
    console.log(pat);

    try {
       console.log(pat+"/buffer_page_"+id+".png");
       res.status(200);
       res.sendFile(__dirname +pat+"/buffer_page_"+id+".png");
    } catch (error) {
        console.log(error);
        res.status(404);
        res.end("File not existing");
    }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
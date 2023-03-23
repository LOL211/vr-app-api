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




const readResponse = async (response)=>{
  let td = new TextDecoder();
  let rd = response['body'].getReader();
  return td.decode((await rd.read()).value);
}



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
         })
        })
        return JSON.parse(await readResponse(r));
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
           console.log("did not find userr "+err.code); 
           
        }
    );
  return [idtoken, name];
}

const getToken = async(idtoken)=> {
  
   let r = await fetch("https://vr-app.fly.dev/token",
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
    })
    return await readResponse(r);
  }

app.post("/auth", (req, res) =>{
  console.log("recieved request")
  
  login(req.body["email"],req.body["password"]).then(response=>{
        if(response[0]===null)
        {
          
            res.status(404);
            res.end("Did not find user or improper credentials");
        }
        else{
            res.setHeader("Content-Type", "application/json")
            let obj = new Object();
            obj.IdToken = response[0];
            obj.CourseList = response[1];
            obj.CourseList.courses = JSON.parse(obj.CourseList.courses);
            console.log("Found user");
            res.status(200);
            res.end(JSON.stringify(obj));
        }
    }).catch((err)=>{
      res.status(404);
      res.end("Did not find user or improper credentials");
    })
});

app.post("/filelist", async (req, res)=>{
  let classname; 
  let idtoken;
  
  try{
      classname = req.body['class'];
      idtoken = req.body['IdToken'];
      if(classname ==undefined || idtoken==undefined)
        throw new Error("bad format")
   }
   
   catch (err) { 
    console.log('error')
    res.status(404);
    res.end("Invalid format");
    return;
   }

   let t = await getToken(idtoken);
    auth.signInWithCustomToken(myauth, t).then(async ()=>{
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


const convertPDFtoPNG = (pdfPath)=> {
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


  function deleteAllSubfiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }
  
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory() && !curPath.includes("node_modules")) {
        deleteDirectory(curPath);
      }
    });
  
    fs.rmdirSync(dirPath);
  }


app.post("/filedownload", async (req, res)=>{
  let file
  let idtoken
    
  try{
      file= req.body['file'];
      idtoken= req.body['IdToken'];
      if(file== undefined || idtoken==undefined)
        throw new Error("Invalid format")
    } catch (err) {

      res.status(404).end("Invalid format")
    }
   
    
    let t = await getToken(idtoken);

    auth.signInWithCustomToken(myauth, t).then( async (user)=>{
      
      try{
        file = file.trim();

        const listref = storage.ref(mystorage, '/'+file);
        console.log("File is "+file)
  
       // console.log(file);
        
        let filePath = file.split('.pdf')[0];
       // console.log(filePath);
        
  
        //console.log(listref)
  
  
        storage.getDownloadURL(listref)
        
  
  
        if(fs.existsSync("./"+filePath))
        {
            console.log('file exists');
        }
        else
        {  
       
            
            let bytes = await storage.getBytes(listref)
            
          
            createddirectories.push("./"+filePath);
            fs.mkdirSync("./"+filePath, { recursive: true });
            fs.writeFileSync("./"+filePath+"/myfile.pdf", Buffer.from(bytes), 'binary');
    
            const timeToDelete = 4*60*60*1000;
    
            setTimeout(() => {
            deleteDirectory("./"+filePath);
            }, timeToDelete);
    
    
            console.log("downloaded");
            
            convertPDFtoPNG("./"+filePath+"/myfile.pdf").then((convert)=>{
                fs.unlinkSync("./"+filePath+"/myfile.pdf");
            });
           
            console.log("converted");
        }
    
        res.end("OK");
      }
      catch(err) {
        console.log(err)
        res.status(404).end("File not found")
      }
    }).catch((err)=>{
      console.log(err)
      res.status(404).end("Invalid user")
    });

 
});

app.get("/image/:class/:filename/:id", async (req, res)=>{

    let id = req.params.id;
    // console.log(id);
    let pat = "/"+req.params.class+"/"+req.params.filename;
    // console.log(pat);

   if(fs.existsSync(__dirname +pat+"/buffer_page_"+id+".png")){
      console.log("file found")
       res.status(200);
       res.sendFile(__dirname +pat+"/buffer_page_"+id+".png");
    } 
    else {

        console.log("file not found")
        
        
        res.status(404).end("File not existing");
    }
});

app.get("/remove", async(req, res)=>
{
    try{
        deleteAllSubfiles("./");
    }
    catch(err)
    {
        console.log(err);
    }

});

let server = app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})


module.exports = server
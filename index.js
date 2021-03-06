const express = require("express");
const fileUpload = require("express-fileupload");
const mongodb = require("mongodb");
const fs = require("fs");
const csv = require("csv-parser");
const gfs = require("gridfs-stream")

const app = express();
const router = express.Router();
const mongoClient = mongodb.MongoClient;
const binary = mongodb.Binary;

router.get("/", (req, res) => {
  res.sendFile("./index.html", { root: __dirname });
});

router.get("/download", (req, res) => {
  let name = req.query.downloadfile;
  getFiles(name, res);
});

app.use(fileUpload());

router.post("/upload", (req, res) => {
  let file = { name: req.body.name, file: binary(req.files.uploadedFile.data) };
  insertFile(file, res);
});

router.post("/read", (req, res) => {
  //   console.log(req.files.readFile.data);

  let file = { name: req.files.readFile.name, file: req.files.readFile.data };

  var ext = file.name.substring(file.name.indexOf("."));

  if (ext == ".csv") {
    req.files.readFile.mv("savedfile.csv");
    readCSV(file, res);
  } else {
    req.files.readFile.mv("savedfile.json");
    readJSON(file, res);
  }
});

let results_global;

function readCSV(file, res) {
  const results = [];
  const dbSchema = [];

  let temp = function () {
    fs.createReadStream(file.name)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        console.log(results.length);
        final_res = [];
        results.map((item) => {
          // In the following line, insert employerId(type: ObjectId)
          final_res.push({
            jobTitle: item.Title,
            tasks: [item.jobpost],
            expectations: [item.RequiredQual],
            skills: [item.JobRequirment],
            languages: ["en", "de", "po"],
            jobDescription: item.JobDescription,
            aboutUs: item.AboutC,
            //decide how you want to do the following line.
            jobType: "Part-time",
            location: item.Location,
            //decide how you want to do the following line.
            companyUrl: "www.dummyurl.com",
            companyLogo: "logo.jpg",
          });
        });
        mongoClient.connect(
          "mongodb://localhost:27017",
          { useNewUrlParser: true },
          (err, client) => {
            if (err) {
              return err;
            } else {
              let db = client.db("jobportal");
              let collection = db.collection("jobs");
              try {
                collection.insertMany(final_res);
                console.log("File Inserted");
              } catch (err) {
                console.log("Error while inserting:", err);
              }
              client.close();
              res.redirect("/");
            }
          }
        );
      });
  };
  // fs.createReadStream("savedfile.csv")
  //   .pipe(csv())
  //   .on("data", function (row) {
  //     results.push(row);
  //   });
  let temp1 = temp();
  console.log("poiyrew");
  console.log(results);
}

function readJSON(file, res) {
  fs.readFile("savedfile.json", (err, data) => {
    if (err) throw err;
    else{
      let jobs = JSON.parse(data);
      console.log("read complete");    
      mongoClient.connect(
        "mongodb://localhost:27017",
        { useNewUrlParser: true },
        (err, client) => {
          if (err) {
            console.log(err);
            return err;
          } else {
            console.log("connected successfully");
            let db = client.db("jobportal");
            let collection = db.collection("jobs");
            try {
              collection.insertMany(jobs);
              console.log("Jobs Inserted");
            } catch (err) {
              console.log("Error while inserting:", err);
            }
            client.close();
            res.redirect("/");
          } 
        }
      );
    }   
  });
  
}

function insertFile(file, res) {
  mongoClient.connect(
    "mongodb://localhost:27017",
    { useNewUrlParser: true },
    (err, client) => {
      if (err) {
        return err;
      } else {
        let db = client.db("jobportal");
        let collection = db.collection("userdocs");
        try {
          collection.insertOne(file);
          console.log("File Inserted");
        } catch (err) {
          console.log("Error while inserting:", err);
        }
        client.close();
        res.redirect("/");
      }
    }
  );
}

function getFiles(name, res) {
  console.log(name);
  mongoClient.connect(
    "mongodb://localhost:27017",
    { useNewUrlParser: true },
    (err, client) => {
      if (err) {
        return err;
      } else {
        let db = client.db("jobportal");
        let collection = db.collection("userdocs");
        collection.find({name}).toArray((err, doc) => {
          if (err) {
            console.log("err in finding doc:", err);
          } else {
            console.log(doc);
            let buffer = doc[0].file.buffer;
            fs.writeFileSync("downloadedfile", buffer);
          }
        });
        client.close();
        res.redirect("/");
      }
    }
  );
}

app.use("/", router);

app.listen(3001, () => console.log("Started on 3000 port"));

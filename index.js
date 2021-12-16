import express from "express";
import cors from "cors";
import fs from "fs";
import parser from "xml-js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "50mb" }));

app.post("/read", (req, res) => {
  // get all images and their annotations
  const folder = req.body.folder;
  const images = fs.readdirSync(`./data/${folder}/images`);
  let data = [];
  images.forEach((jpg) => {
    const b64 = fs.readFileSync(`./data/${folder}/images/${jpg}`, "base64");
    const xml = jpg.replace(".jpg", ".xml");
    const annotation = fs.readFileSync(`./data/${folder}/annotations/${xml}`);
    const js = parser.xml2js(annotation, { compact: true });
    data.push({ jpg: jpg, image: b64, annotation: js.annotation });
  });
  res.send(data);
});

app.post("/write", (req, res) => {
  // overwrite a single annotation file
  const folder = req.body.folder;
  const jpg = req.body.image;
  const sub = req.body.sub;
  const danger = req.body.danger;
  const xml = jpg.replace(".jpg", ".xml");
  const xmlPath = `./data/${folder}/annotations/${xml}`;
  const xmlConent = fs.readFileSync(xmlPath);
  let js = parser.xml2js(xmlConent, { compact: true });
  let objects = js.annotation.object;
  if (!Array.isArray(objects)) objects = [objects];
  objects[sub].danger = { _text: danger };
  const json = JSON.stringify(js);
  let xmlNew = parser.json2xml(json, { compact: true, spaces: 2 });
  fs.writeFileSync(xmlPath, xmlNew);
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Port: ${PORT}`);
  console.log(`Listening...`);
});
